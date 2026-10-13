class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def bad_request(code: str, message: str) -> None:
    raise ApiError(400, code, message)


def not_found() -> ApiError:
    return ApiError(404, "GARDEN_NOT_FOUND", "庭が見つかりません。")
