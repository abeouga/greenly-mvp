package jp.greenly.api.service;

import static jp.greenly.api.domain.GardenDocumentValidator.validateCreate;
import static jp.greenly.api.domain.GardenDocumentValidator.validateDocument;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import jp.greenly.api.api.ApiDtos.CreateGardenRequest;
import jp.greenly.api.api.ApiDtos.GardenDocumentRequest;
import jp.greenly.api.api.ApiDtos.GardenDocumentResponse;
import jp.greenly.api.api.ApiDtos.GardenObjectRequest;
import jp.greenly.api.api.ApiDtos.GardenObjectResponse;
import jp.greenly.api.api.ApiDtos.GardenSummaryResponse;
import jp.greenly.api.api.ApiDtos.VectorResponse;
import jp.greenly.api.api.ApiException;
import jp.greenly.api.config.GardenOwner;
import jp.greenly.api.persistence.AssetRepository;
import jp.greenly.api.persistence.GardenEntity;
import jp.greenly.api.persistence.GardenRepository;
import jp.greenly.api.persistence.PlacedObjectEntity;
import jp.greenly.api.persistence.PlacedObjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GardenService {
  private final GardenRepository gardens;
  private final PlacedObjectRepository objects;
  private final AssetRepository assets;
  private final GardenOwner owner;

  public GardenService(GardenRepository gardens, PlacedObjectRepository objects,
      AssetRepository assets, GardenOwner owner) {
    this.gardens = gardens;
    this.objects = objects;
    this.assets = assets;
    this.owner = owner;
  }

  @Transactional(readOnly = true)
  public List<GardenSummaryResponse> list() {
    return gardens.findAllByOwnerIdOrderByUpdatedAtDesc(owner.ownerId()).stream()
        .map(this::toSummary).toList();
  }

  @Transactional
  public GardenDocumentResponse create(CreateGardenRequest request) {
    validateCreate(request);
    GardenEntity garden = new GardenEntity(UUID.randomUUID().toString(), owner.ownerId(), request.name().trim(),
        request.width(), request.depth(), 0);
    gardens.saveAndFlush(garden);
    return new GardenDocumentResponse(1, garden.getId(), 0, garden.getName(),
        garden.getWidth(), garden.getDepth(), List.of());
  }

  @Transactional(readOnly = true)
  public GardenDocumentResponse get(String id) {
    GardenEntity garden = findOwned(id);
    return toDocument(garden, objects.findAllByGardenIdOrderByIdAsc(id));
  }

  @Transactional
  public GardenDocumentResponse update(String id, GardenDocumentRequest document) {
    validateDocument(document);
    if (!id.equals(document.id())) {
      throw ApiException.badRequest("GARDEN_ID_MISMATCH", "URLと保存データの庭IDが一致しません。");
    }
    GardenEntity garden = gardens.findByIdAndOwnerIdForUpdate(id, owner.ownerId())
        .orElseThrow(ApiException::notFound);
    if (garden.getRevision() != document.revision()) {
      throw ApiException.conflict("REVISION_CONFLICT", "庭が別の版で更新されています。最新データを取得してください。");
    }
    if (Double.compare(garden.getWidth(), document.width()) != 0
        || Double.compare(garden.getDepth(), document.depth()) != 0) {
      throw ApiException.badRequest("GARDEN_DIMENSIONS_IMMUTABLE", "作成済みの庭の寸法は変更できません。");
    }
    if (garden.getRevision() == Long.MAX_VALUE) {
      throw ApiException.conflict("REVISION_EXHAUSTED", "庭の版番号を更新できません。");
    }

    Set<String> assetIds = document.objects().stream().map(GardenObjectRequest::assetId).collect(Collectors.toSet());
    if (assets.findAllById(assetIds).size() != assetIds.size()) {
      throw ApiException.badRequest("UNKNOWN_ASSET", "カタログに存在しないアセットが含まれています。");
    }

    long nextRevision = garden.getRevision() + 1;
    garden.update(document.name().trim(), nextRevision);
    gardens.saveAndFlush(garden);
    objects.deleteAllByGardenId(id);
    objects.flush();
    List<PlacedObjectEntity> persistedObjects = document.objects().stream()
        .map(object -> toEntity(id, object)).toList();
    objects.saveAllAndFlush(persistedObjects);
    return toDocument(garden, document.objects(), nextRevision);
  }

  @Transactional
  public void delete(String id) {
    GardenEntity garden = gardens.findByIdAndOwnerIdForUpdate(id, owner.ownerId())
        .orElseThrow(ApiException::notFound);
    gardens.delete(garden);
    gardens.flush();
  }

  private GardenEntity findOwned(String id) {
    return gardens.findByIdAndOwnerId(id, owner.ownerId()).orElseThrow(ApiException::notFound);
  }

  private GardenSummaryResponse toSummary(GardenEntity garden) {
    return new GardenSummaryResponse(garden.getId(), garden.getName(), garden.getWidth(),
        garden.getDepth(), garden.getRevision(), garden.getUpdatedAt());
  }

  private GardenDocumentResponse toDocument(GardenEntity garden, List<PlacedObjectEntity> persisted) {
    List<GardenObjectResponse> responseObjects = persisted.stream().map(this::toResponse).toList();
    return new GardenDocumentResponse(1, garden.getId(), garden.getRevision(), garden.getName(),
        garden.getWidth(), garden.getDepth(), responseObjects);
  }

  private GardenDocumentResponse toDocument(GardenEntity garden, List<GardenObjectRequest> submitted,
      long revision) {
    List<GardenObjectResponse> responseObjects = submitted.stream().map(this::toResponse).toList();
    return new GardenDocumentResponse(1, garden.getId(), revision, garden.getName(),
        garden.getWidth(), garden.getDepth(), responseObjects);
  }

  private GardenObjectResponse toResponse(PlacedObjectEntity object) {
    return new GardenObjectResponse(object.getId(), object.getAssetId(),
        new VectorResponse(object.getPositionX(), object.getPositionY(), object.getPositionZ()),
        new VectorResponse(object.getRotationX(), object.getRotationY(), object.getRotationZ()),
        new VectorResponse(object.getScaleX(), object.getScaleY(), object.getScaleZ()));
  }

  private GardenObjectResponse toResponse(GardenObjectRequest object) {
    return new GardenObjectResponse(object.id().toLowerCase(Locale.ROOT), object.assetId(), toResponse(object.position()),
        toResponse(object.rotation()), toResponse(object.scale()));
  }

  private VectorResponse toResponse(jp.greenly.api.api.ApiDtos.VectorRequest vector) {
    return new VectorResponse(vector.x(), vector.y(), vector.z());
  }

  private PlacedObjectEntity toEntity(String gardenId, GardenObjectRequest object) {
    return new PlacedObjectEntity(object.id().toLowerCase(), gardenId, object.assetId(),
        object.position().x(), object.position().y(), object.position().z(),
        object.rotation().x(), object.rotation().y(), object.rotation().z(),
        object.scale().x(), object.scale().y(), object.scale().z());
  }
}
