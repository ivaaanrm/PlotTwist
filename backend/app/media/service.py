import json

from sqlmodel import Session, select

from app.media.models import Media, MediaType
from app.media.provider import MediaDetails


def get_or_create_media(*, session: Session, details: MediaDetails) -> Media:
    statement = select(Media).where(
        Media.tmdb_id == details.external_id,
        Media.media_type == details.media_type,
    )
    media = session.exec(statement).first()
    if media:
        return media

    media = Media(
        tmdb_id=details.external_id,
        media_type=details.media_type,
        title=details.title,
        overview=details.overview,
        poster_path=details.poster_path,
        backdrop_path=details.backdrop_path,
        release_date=details.release_date,
        tmdb_rating=details.rating,
        genres=json.dumps(details.genres) if details.genres else None,
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    return media


def get_media_by_tmdb_id(
    *,
    session: Session,
    tmdb_id: int,
    media_type: MediaType,
) -> Media | None:
    statement = select(Media).where(
        Media.tmdb_id == tmdb_id,
        Media.media_type == media_type,
    )
    return session.exec(statement).first()
