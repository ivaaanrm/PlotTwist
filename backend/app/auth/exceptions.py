from app.exceptions import BadRequestError


class InvalidCredentialsError(BadRequestError):
    detail = "Incorrect email or password"


class InvalidTokenError(BadRequestError):
    detail = "Invalid token"


class InactiveUserError(BadRequestError):
    detail = "Inactive user"
