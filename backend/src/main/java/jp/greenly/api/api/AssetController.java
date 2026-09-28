package jp.greenly.api.api;

import java.util.List;
import jp.greenly.api.api.ApiDtos.AssetResponse;
import jp.greenly.api.service.AssetCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets")
public class AssetController {
  private final AssetCatalogService catalog;

  public AssetController(AssetCatalogService catalog) {
    this.catalog = catalog;
  }

  @GetMapping
  public List<AssetResponse> list() {
    return catalog.list();
  }
}
