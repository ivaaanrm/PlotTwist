from app.exceptions import AppException


class AlreadyInCollectionError(AppException):
    def __init__(self, collection_name: str):
        super().__init__(
            status_code=400,
            detail=f"This media is already in your {collection_name} collection.",
        )


class CollectionItemNotFoundError(AppException):
    def __init__(self):
        super().__init__(
            status_code=404,
            detail="Item not found.",
        )


class UserNotOwnerError(AppException):
    def __init__(self):
        super().__init__(
            status_code=403,
            detail="You don't have permission to modify this item.",
        )
