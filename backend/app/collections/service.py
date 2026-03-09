import uuid
from datetime import datetime, timezone

from sqlmodel import Session, col, func, select

from app.collections.adapters import CollectionItemAdapter
from app.collections.exceptions import (
    AlreadyInCollectionError,
    AlreadyInvitedError,
    AlreadyMemberError,
    CannotInviteSelfError,
    CannotRemoveOwnerError,
    CollectionAccessDeniedError,
    CollectionNotCollaborativeError,
    CollectionNotFoundError,
    CollectionOwnerRequiredError,
    InvitationNotFoundError,
)
from app.collections.models import (
    Collection,
    CollectionInvitation,
    CollectionItem,
    CollectionMember,
    CollectionRole,
    InvitationStatus,
)
from app.collections.schemas import (
    CollectionCreate,
    CollectionDetailPublic,
    CollectionInvitationCreate,
    CollectionInvitationPublic,
    CollectionItemCreate,
    CollectionItemDomain,
    CollectionItemUpdate,
    CollectionMemberPublic,
    CollectionPublic,
    CollectionUpdate,
    ReorderRequest,
)
from app.media import service as media_service
from app.media.providers.base import MediaProvider


# ─── Personal collection helpers (existing) ───


async def add_item_to_collection(
    *,
    session: Session,
    adapter: CollectionItemAdapter,
    provider: MediaProvider,
    user_id: uuid.UUID,
    collection_name: str,
    item_in: CollectionItemCreate,
) -> CollectionItemDomain:
    details = await provider.get_details(
        external_id=item_in.tmdb_id,
        media_type=item_in.media_type,
    )
    media = media_service.get_or_create_media(session=session, details=details)

    existing = adapter.get_by_user_media_and_collection(
        user_id=user_id,
        media_id=media.id,
        collection_name=collection_name,
    )
    if existing:
        raise AlreadyInCollectionError(collection_name)

    if collection_name == "watched":
        watchlist_item = adapter.get_by_user_media_and_collection(
            user_id=user_id,
            media_id=media.id,
            collection_name="watchlist",
        )
        if watchlist_item:
            adapter.delete(id=watchlist_item.id)

    return adapter.add(
        user_id=user_id,
        media_id=media.id,
        collection_name=collection_name,
        rating=item_in.rating,
    )


def update_collection_item(
    *,
    adapter: CollectionItemAdapter,
    item_id: uuid.UUID,
    item_in: CollectionItemUpdate,
) -> CollectionItemDomain | None:
    return adapter.update(id=item_id, rating=item_in.rating)


def get_collection_items(
    *,
    adapter: CollectionItemAdapter,
    user_id: uuid.UUID,
    collection_name: str,
    skip: int,
    limit: int,
) -> tuple[list[CollectionItemDomain], int]:
    return adapter.get_list(
        user_id=user_id, collection_name=collection_name, skip=skip, limit=limit
    )


def remove_collection_item(
    *,
    adapter: CollectionItemAdapter,
    item_id: uuid.UUID,
) -> bool:
    return adapter.delete(id=item_id)


# ─── Named collection helpers ───


def _get_collection_or_404(session: Session, collection_id: uuid.UUID) -> Collection:
    collection = session.get(Collection, collection_id)
    if not collection:
        raise CollectionNotFoundError()
    return collection


def _check_member(
    session: Session, collection_id: uuid.UUID, user_id: uuid.UUID
) -> CollectionMember:
    stmt = select(CollectionMember).where(
        CollectionMember.collection_id == collection_id,
        CollectionMember.user_id == user_id,
    )
    member = session.exec(stmt).first()
    if not member:
        raise CollectionAccessDeniedError()
    return member


def _check_owner(
    session: Session, collection_id: uuid.UUID, user_id: uuid.UUID
) -> CollectionMember:
    member = _check_member(session, collection_id, user_id)
    if member.role != CollectionRole.owner:
        raise CollectionOwnerRequiredError()
    return member


def _build_member_public(member: CollectionMember) -> CollectionMemberPublic:
    return CollectionMemberPublic(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user_full_name=member.user.full_name if member.user else None,
        user_email=member.user.email if member.user else None,
    )


def _build_collection_public(
    session: Session, collection: Collection
) -> CollectionPublic:
    # Count items
    count_stmt = (
        select(func.count())
        .select_from(CollectionItem)
        .where(CollectionItem.collection_id == collection.id)
    )
    item_count = session.exec(count_stmt).one()

    # Get first 4 poster paths for cover mosaic
    poster_stmt = (
        select(CollectionItem)
        .where(CollectionItem.collection_id == collection.id)
        .order_by(col(CollectionItem.position))
        .limit(4)
    )
    items = session.exec(poster_stmt).all()
    cover_posters = [item.media.poster_path if item.media else None for item in items]

    # Members
    members = [_build_member_public(m) for m in collection.members]

    return CollectionPublic(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        owner_id=collection.owner_id,
        is_collaborative=collection.is_collaborative,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        item_count=item_count,
        members=members,
        cover_posters=cover_posters,
    )


# ─── Named Collection CRUD ───


def create_collection(
    *,
    session: Session,
    owner_id: uuid.UUID,
    data: CollectionCreate,
) -> CollectionPublic:
    collection = Collection(
        name=data.name,
        description=data.description,
        owner_id=owner_id,
        is_collaborative=data.is_collaborative,
    )
    session.add(collection)
    session.flush()

    member = CollectionMember(
        collection_id=collection.id,
        user_id=owner_id,
        role=CollectionRole.owner,
    )
    session.add(member)
    session.commit()
    session.refresh(collection)

    return _build_collection_public(session, collection)


def get_user_collections(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[CollectionPublic], int]:
    # All collections where user is a member
    base = (
        select(Collection)
        .join(CollectionMember)
        .where(CollectionMember.user_id == user_id)
    )

    count_stmt = select(func.count()).select_from(base.subquery())
    count = session.exec(count_stmt).one()

    stmt = base.order_by(col(Collection.updated_at).desc()).offset(skip).limit(limit)
    collections = session.exec(stmt).all()

    return [_build_collection_public(session, c) for c in collections], count


def get_collection_detail(
    *,
    session: Session,
    collection_id: uuid.UUID,
    user_id: uuid.UUID,
) -> CollectionDetailPublic:
    collection = _get_collection_or_404(session, collection_id)
    _check_member(session, collection_id, user_id)

    public = _build_collection_public(session, collection)

    # Get all items ordered by position
    items_stmt = (
        select(CollectionItem)
        .where(CollectionItem.collection_id == collection_id)
        .order_by(col(CollectionItem.position))
    )
    items = session.exec(items_stmt).all()
    items_public = [CollectionItemDomain.model_validate(i) for i in items]

    return CollectionDetailPublic(
        **public.model_dump(),
        items=items_public,
    )


def update_collection(
    *,
    session: Session,
    collection_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CollectionUpdate,
) -> CollectionPublic:
    collection = _get_collection_or_404(session, collection_id)
    _check_owner(session, collection_id, user_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(collection, key, value)
    collection.updated_at = datetime.now(timezone.utc)

    session.add(collection)
    session.commit()
    session.refresh(collection)

    return _build_collection_public(session, collection)


def delete_collection(
    *,
    session: Session,
    collection_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    collection = _get_collection_or_404(session, collection_id)
    _check_owner(session, collection_id, user_id)
    session.delete(collection)
    session.commit()


# ─── Named Collection Items ───


async def add_item_to_named_collection(
    *,
    session: Session,
    provider: MediaProvider,
    collection_id: uuid.UUID,
    user_id: uuid.UUID,
    item_in: CollectionItemCreate,
) -> CollectionItemDomain:
    _get_collection_or_404(session, collection_id)
    _check_member(session, collection_id, user_id)

    details = await provider.get_details(
        external_id=item_in.tmdb_id,
        media_type=item_in.media_type,
    )
    media = media_service.get_or_create_media(session=session, details=details)

    # Check duplicate
    existing_stmt = select(CollectionItem).where(
        CollectionItem.collection_id == collection_id,
        CollectionItem.media_id == media.id,
    )
    if session.exec(existing_stmt).first():
        raise AlreadyInCollectionError()

    # Get next position
    max_pos_stmt = (
        select(func.coalesce(func.max(CollectionItem.position), -1))
        .where(CollectionItem.collection_id == collection_id)
    )
    max_pos = session.exec(max_pos_stmt).one()

    item = CollectionItem(
        user_id=user_id,
        media_id=media.id,
        collection_id=collection_id,
        position=max_pos + 1,
        rating=item_in.rating,
    )
    session.add(item)
    session.commit()
    session.refresh(item)

    return CollectionItemDomain.model_validate(item)


def remove_item_from_named_collection(
    *,
    session: Session,
    collection_id: uuid.UUID,
    item_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    _get_collection_or_404(session, collection_id)
    _check_member(session, collection_id, user_id)

    item = session.get(CollectionItem, item_id)
    if not item or item.collection_id != collection_id:
        raise CollectionNotFoundError()

    session.delete(item)
    session.commit()


def reorder_collection_items(
    *,
    session: Session,
    collection_id: uuid.UUID,
    user_id: uuid.UUID,
    data: ReorderRequest,
) -> None:
    _get_collection_or_404(session, collection_id)
    _check_member(session, collection_id, user_id)

    for position, item_id in enumerate(data.item_ids):
        item = session.get(CollectionItem, item_id)
        if item and item.collection_id == collection_id:
            item.position = position
            session.add(item)

    session.commit()


# ─── Invitations ───


def create_invitation(
    *,
    session: Session,
    collection_id: uuid.UUID,
    sender_id: uuid.UUID,
    data: CollectionInvitationCreate,
) -> CollectionInvitationPublic:
    collection = _get_collection_or_404(session, collection_id)
    _check_owner(session, collection_id, sender_id)

    if not collection.is_collaborative:
        raise CollectionNotCollaborativeError()

    if data.receiver_id == sender_id:
        raise CannotInviteSelfError()

    # Check if already a member
    existing_member = select(CollectionMember).where(
        CollectionMember.collection_id == collection_id,
        CollectionMember.user_id == data.receiver_id,
    )
    if session.exec(existing_member).first():
        raise AlreadyMemberError()

    # Check if already invited (pending)
    existing_invite = select(CollectionInvitation).where(
        CollectionInvitation.collection_id == collection_id,
        CollectionInvitation.receiver_id == data.receiver_id,
        CollectionInvitation.status == InvitationStatus.pending,
    )
    if session.exec(existing_invite).first():
        raise AlreadyInvitedError()

    invitation = CollectionInvitation(
        collection_id=collection_id,
        sender_id=sender_id,
        receiver_id=data.receiver_id,
    )
    session.add(invitation)
    session.commit()
    session.refresh(invitation)

    return CollectionInvitationPublic(
        id=invitation.id,
        collection_id=invitation.collection_id,
        sender_id=invitation.sender_id,
        receiver_id=invitation.receiver_id,
        status=invitation.status,
        created_at=invitation.created_at,
        collection_name=collection.name,
        sender_full_name=invitation.sender.full_name if invitation.sender else None,
    )


def get_received_invitations(
    *,
    session: Session,
    user_id: uuid.UUID,
) -> tuple[list[CollectionInvitationPublic], int]:
    stmt = (
        select(CollectionInvitation)
        .where(
            CollectionInvitation.receiver_id == user_id,
            CollectionInvitation.status == InvitationStatus.pending,
        )
        .order_by(col(CollectionInvitation.created_at).desc())
    )
    invitations = session.exec(stmt).all()

    result = []
    for inv in invitations:
        result.append(
            CollectionInvitationPublic(
                id=inv.id,
                collection_id=inv.collection_id,
                sender_id=inv.sender_id,
                receiver_id=inv.receiver_id,
                status=inv.status,
                created_at=inv.created_at,
                collection_name=inv.collection.name if inv.collection else None,
                sender_full_name=inv.sender.full_name if inv.sender else None,
            )
        )

    return result, len(result)


def respond_to_invitation(
    *,
    session: Session,
    invitation_id: uuid.UUID,
    user_id: uuid.UUID,
    status: str,
) -> CollectionInvitationPublic:
    invitation = session.get(CollectionInvitation, invitation_id)
    if not invitation or invitation.receiver_id != user_id:
        raise InvitationNotFoundError()

    invitation.status = InvitationStatus(status)
    session.add(invitation)

    if status == InvitationStatus.accepted:
        member = CollectionMember(
            collection_id=invitation.collection_id,
            user_id=user_id,
            role=CollectionRole.editor,
        )
        session.add(member)

    session.commit()
    session.refresh(invitation)

    return CollectionInvitationPublic(
        id=invitation.id,
        collection_id=invitation.collection_id,
        sender_id=invitation.sender_id,
        receiver_id=invitation.receiver_id,
        status=invitation.status,
        created_at=invitation.created_at,
        collection_name=invitation.collection.name if invitation.collection else None,
        sender_full_name=invitation.sender.full_name if invitation.sender else None,
    )


def remove_member(
    *,
    session: Session,
    collection_id: uuid.UUID,
    member_user_id: uuid.UUID,
    requester_id: uuid.UUID,
) -> None:
    _get_collection_or_404(session, collection_id)
    _check_owner(session, collection_id, requester_id)

    stmt = select(CollectionMember).where(
        CollectionMember.collection_id == collection_id,
        CollectionMember.user_id == member_user_id,
    )
    member = session.exec(stmt).first()
    if not member:
        raise CollectionAccessDeniedError()

    if member.role == CollectionRole.owner:
        raise CannotRemoveOwnerError()

    session.delete(member)
    session.commit()
