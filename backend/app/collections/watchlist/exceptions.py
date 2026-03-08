from app.exceptions import BadRequestError, ForbiddenError, NotFoundError


class AlreadyInWatchlistError(BadRequestError):
    detail = "Already in watchlist"


class AlreadyWatchedError(BadRequestError):
    detail = "Already marked as watched"


class WatchlistItemNotFoundError(NotFoundError):
    detail = "Watchlist item not found"


class WatchlistPermissionError(ForbiddenError):
    detail = "Not enough permissions"
