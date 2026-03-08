from app.exceptions import BadRequestError, ForbiddenError, NotFoundError


class AlreadyWatchedError(BadRequestError):
    detail = "Already marked as watched"


class WatchedItemNotFoundError(NotFoundError):
    detail = "Watched item not found"


class WatchedPermissionError(ForbiddenError):
    detail = "Not enough permissions"
