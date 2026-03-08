from app.exceptions import BadRequestError


class EmptyQueryError(BadRequestError):
    detail = "Query cannot be empty"
