package jp.greenly.api.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class ApiDtos {
  private ApiDtos() {}

  public record BaseDimensions(double width, double height, double depth) {}

  public record AssetResponse(
      String id, String name, String category, String modelUrl, BaseDimensions baseDimensions) {}

  public record CreateGardenRequest(
      @NotBlank @Size(max = 120) String name,
      @NotNull @DecimalMin("1.0") @DecimalMax("50.0") Double width,
      @NotNull @DecimalMin("1.0") @DecimalMax("50.0") Double depth) {}

  public record VectorRequest(@NotNull Double x, @NotNull Double y, @NotNull Double z) {}

  public record GardenObjectRequest(
      @NotBlank String id,
      @NotBlank String assetId,
      @NotNull @Valid VectorRequest position,
      @NotNull @Valid VectorRequest rotation,
      @NotNull @Valid VectorRequest scale) {}

  public record GardenDocumentRequest(
      @NotNull @Min(1) @Max(1) Integer schemaVersion,
      @NotBlank String id,
      @NotNull @PositiveOrZero Long revision,
      @NotBlank @Size(max = 120) String name,
      @NotNull @DecimalMin("1.0") @DecimalMax("50.0") Double width,
      @NotNull @DecimalMin("1.0") @DecimalMax("50.0") Double depth,
      @NotNull @Size(max = 200) List<@NotNull @Valid GardenObjectRequest> objects) {}

  public record VectorResponse(double x, double y, double z) {}

  public record GardenObjectResponse(
      String id, String assetId, VectorResponse position, VectorResponse rotation, VectorResponse scale) {}

  public record GardenDocumentResponse(
      int schemaVersion,
      String id,
      long revision,
      String name,
      double width,
      double depth,
      List<GardenObjectResponse> objects) {}

  public record GardenSummaryResponse(
      String id, String name, double width, double depth, long revision, Instant updatedAt) {}

  public record ApiError(int status, String code, String message) {}
}
