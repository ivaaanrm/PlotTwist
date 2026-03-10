from app.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError


class UserNotFoundError(NotFoundError):
    detail = "User not found"


class UserEmailExistsError(ConflictError):
    detail = "User with this email already exists"


class UserUsernameExistsError(ConflictError):
    detail = "User with this username already exists"


class IncorrectPasswordError(BadRequestError):
    detail = "Incorrect password"


class SamePasswordError(BadRequestError):
    detail = "New password cannot be the same as the current one"


class SuperUserDeletionError(ForbiddenError):
    detail = "Super users are not allowed to delete themselves"


class InsufficientPrivilegesError(ForbiddenError):
    detail = "The user doesn't have enough privileges"


class ProfileNotVisibleError(ForbiddenError):
    detail = "You must follow this user to view their profile"
