package jp.greenly.api.api;

import jakarta.validation.ConstraintViolationException;
import jp.greenly.api.api.ApiDtos.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handleApiException(ApiException exception) {
    return response(exception.getStatus(), exception.getCode(), exception.getMessage());
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class,
      HttpMessageNotReadableException.class})
  public ResponseEntity<ApiError> handleInvalidRequest(Exception exception) {
    return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "リクエストの形式または値が不正です。");
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiError> handleMissingResource(NoResourceFoundException exception) {
    return response(HttpStatus.NOT_FOUND, "NOT_FOUND", "要求されたリソースが見つかりません。");
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiError> handleUnsupportedMethod(HttpRequestMethodNotSupportedException exception) {
    return response(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "このHTTPメソッドは利用できません。");
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> handleStorageConflict(DataIntegrityViolationException exception) {
    return response(HttpStatus.CONFLICT, "STORAGE_CONFLICT", "保存データが競合しました。最新の庭を取得してください。");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleUnexpected(Exception exception) {
    log.error("Unhandled API failure", exception);
    return response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "サーバーでエラーが発生しました。");
  }

  private ResponseEntity<ApiError> response(HttpStatus status, String code, String message) {
    return ResponseEntity.status(status).body(new ApiError(status.value(), code, message));
  }
}
