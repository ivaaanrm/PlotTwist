from app.exceptions import AppException


class AlreadyInCollectionError(AppException):
    status_code = 400

    def __init__(self, collection_name: str = "collection"):
        self.detail = f"This media is already in your {collection_name} collection."
        super().__init__(self.detail)


class CollectionItemNotFoundError(AppException):
    status_code = 404
    detail = "Item not found."


class UserNotOwnerError(AppException):
    status_code = 403
    detail = "You don't have permission to modify this item."


class CollectionNotFoundError(AppException):
    status_code = 404
    detail = "Collection not found."


class CollectionAccessDeniedError(AppException):
    status_code = 403
    detail = "You don't have access to this collection."


class CollectionOwnerRequiredError(AppException):
    status_code = 403
    detail = "Only the collection owner can perform this action."


class CollectionNotCollaborativeError(AppException):
    status_code = 400
    detail = "This collection is not collaborative."


class AlreadyMemberError(AppException):
    status_code = 400
    detail = "User is already a member of this collection."


class AlreadyInvitedError(AppException):
    status_code = 400
    detail = "User has already been invited to this collection."


class InvitationNotFoundError(AppException):
    status_code = 404
    detail = "Invitation not found."


class CannotRemoveOwnerError(AppException):
    status_code = 400
    detail = "Cannot remove the owner from the collection."


class CannotInviteSelfError(AppException):
    status_code = 400
    detail = "You cannot invite yourself to a collection."
