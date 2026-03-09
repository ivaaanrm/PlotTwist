class AppException(Exception):
    """Base application exception. Subclass with status_code and detail."""

    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


class NotFoundError(AppException):
    status_code = 404
    detail = "Not found"


class BadRequestError(AppException):
    status_code = 400
    detail = "Bad request"


class ConflictError(AppException):
    status_code = 409
    detail = "Conflict"


class ForbiddenError(AppException):
    status_code = 403
    detail = "Forbidden"
