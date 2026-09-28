package jp.greenly.api.service;

import java.util.List;
import jp.greenly.api.api.ApiDtos.AssetResponse;
import jp.greenly.api.api.ApiDtos.BaseDimensions;
import jp.greenly.api.persistence.AssetEntity;
import jp.greenly.api.persistence.AssetRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetCatalogService {
  private final AssetRepository assets;

  public AssetCatalogService(AssetRepository assets) {
    this.assets = assets;
  }

  @Transactional(readOnly = true)
  public List<AssetResponse> list() {
    return assets.findAll(Sort.by("id")).stream().map(this::toResponse).toList();
  }

  private AssetResponse toResponse(AssetEntity asset) {
    return new AssetResponse(asset.getId(), asset.getName(), asset.getCategory(), asset.getModelUrl(),
        new BaseDimensions(asset.getBaseWidth().doubleValue(), asset.getBaseHeight().doubleValue(),
            asset.getBaseDepth().doubleValue()));
  }
}
