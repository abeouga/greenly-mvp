package jp.greenly.api.domain;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import jp.greenly.api.api.ApiDtos.CreateGardenRequest;
import jp.greenly.api.api.ApiDtos.GardenDocumentRequest;
import jp.greenly.api.api.ApiDtos.GardenObjectRequest;
import jp.greenly.api.api.ApiDtos.VectorRequest;
import jp.greenly.api.api.ApiException;

public final class GardenDocumentValidator {
  private GardenDocumentValidator() {}

  public static void validateDimensions(double width, double depth) {
    if (!isSideValid(width) || !isSideValid(depth)) {
      throw ApiException.badRequest("INVALID_GARDEN_DIMENSIONS", "庭の幅と奥行きは1〜50mで指定してください。");
    }
  }

  public static void validateCreate(CreateGardenRequest request) {
    validateDimensions(request.width(), request.depth());
    if (request.name().isBlank() || request.name().length() > 120) {
      throw ApiException.badRequest("INVALID_GARDEN_NAME", "庭の名前は1〜120文字で指定してください。");
    }
  }

  public static void validateDocument(GardenDocumentRequest document) {
    validateDimensions(document.width(), document.depth());
    if (document.schemaVersion() != 1) {
      throw ApiException.badRequest("UNSUPPORTED_SCHEMA_VERSION", "対応していない庭データ形式です。");
    }
    if (document.name().isBlank() || document.name().length() > 120) {
      throw ApiException.badRequest("INVALID_GARDEN_NAME", "庭の名前は1〜120文字で指定してください。");
    }
    if (document.objects().size() > GardenLimits.MAX_OBJECTS) {
      throw ApiException.badRequest("TOO_MANY_OBJECTS", "庭に配置できるオブジェクトは200個までです。");
    }

    Set<String> ids = new HashSet<>();
    for (GardenObjectRequest object : document.objects()) {
      String canonicalId = canonicalUuid(object.id());
      if (!ids.add(canonicalId)) {
        throw ApiException.badRequest("DUPLICATE_OBJECT_ID", "配置オブジェクトのIDが重複しています。");
      }
      validateObject(object, document.width(), document.depth());
    }
  }

  public static String canonicalUuid(String rawId) {
    try {
      UUID id = UUID.fromString(rawId);
      if (!id.toString().equals(rawId.toLowerCase(Locale.ROOT))) {
        throw new IllegalArgumentException("non-canonical UUID");
      }
      return id.toString();
    } catch (IllegalArgumentException exception) {
      throw ApiException.badRequest("INVALID_OBJECT_ID", "配置オブジェクトのIDはUUID形式で指定してください。");
    }
  }

  private static void validateObject(GardenObjectRequest object, double width, double depth) {
    VectorRequest position = object.position();
    VectorRequest rotation = object.rotation();
    VectorRequest scale = object.scale();

    requireFinite(position.x(), position.y(), position.z(), rotation.x(), rotation.y(), rotation.z(),
        scale.x(), scale.y(), scale.z());
    if (position.x() < -width / 2 || position.x() > width / 2
        || position.z() < -depth / 2 || position.z() > depth / 2 || position.y() != 0.0) {
      throw ApiException.badRequest("OBJECT_POSITION_OUT_OF_BOUNDS", "配置位置は庭の範囲内でY=0にしてください。");
    }
    if (rotation.x() != 0.0 || rotation.z() != 0.0) {
      throw ApiException.badRequest("INVALID_OBJECT_ROTATION", "オブジェクトはY軸回りだけ回転できます。");
    }
    if (scale.x() < GardenLimits.MIN_SCALE || scale.x() > GardenLimits.MAX_SCALE
        || Double.compare(scale.x(), scale.y()) != 0 || Double.compare(scale.x(), scale.z()) != 0) {
      throw ApiException.badRequest("INVALID_OBJECT_SCALE", "倍率は0.25〜3.0の一様な値にしてください。");
    }
  }

  private static void requireFinite(Double... values) {
    for (Double value : values) {
      if (value == null || !Double.isFinite(value)) {
        throw ApiException.badRequest("NON_FINITE_NUMBER", "座標、回転、倍率には有限の数値を指定してください。");
      }
    }
  }

  private static boolean isSideValid(double value) {
    return Double.isFinite(value)
        && value >= GardenLimits.MIN_SIDE_METERS
        && value <= GardenLimits.MAX_SIDE_METERS;
  }
}
