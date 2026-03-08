from app.exceptions import BadRequestError, ForbiddenError, NotFoundError


class CannotFollowSelfError(BadRequestError):
    detail = "Cannot follow yourself"


class AlreadyFollowingError(BadRequestError):
    detail = "Already following this user"


class FollowRequestPendingError(BadRequestError):
    detail = "Follow request already pending"


class FollowRequestNotPendingError(BadRequestError):
    detail = "Follow request is not pending"


class InvalidFollowStatusError(BadRequestError):
    detail = "Status must be 'accepted' or 'declined'"


class FollowNotFoundError(NotFoundError):
    detail = "Follow relationship not found"


class FollowRequestNotFoundError(NotFoundError):
    detail = "Follow request not found"


class FollowPermissionError(ForbiddenError):
    detail = "Not enough permissions"
