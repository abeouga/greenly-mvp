package jp.greenly.api.api;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import jp.greenly.api.api.ApiDtos.CreateGardenRequest;
import jp.greenly.api.api.ApiDtos.GardenDocumentRequest;
import jp.greenly.api.api.ApiDtos.GardenDocumentResponse;
import jp.greenly.api.api.ApiDtos.GardenSummaryResponse;
import jp.greenly.api.service.GardenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gardens")
public class GardenController {
  private final GardenService gardens;

  public GardenController(GardenService gardens) {
    this.gardens = gardens;
  }

  @GetMapping
  public List<GardenSummaryResponse> list() {
    return gardens.list();
  }

  @PostMapping
  public ResponseEntity<GardenDocumentResponse> create(@Valid @RequestBody CreateGardenRequest request) {
    GardenDocumentResponse garden = gardens.create(request);
    return ResponseEntity.created(URI.create("/api/gardens/" + garden.id())).body(garden);
  }

  @GetMapping("/{id}")
  public GardenDocumentResponse get(@PathVariable String id) {
    return gardens.get(id);
  }

  @PutMapping("/{id}")
  public GardenDocumentResponse update(@PathVariable String id,
      @Valid @RequestBody GardenDocumentRequest document) {
    return gardens.update(id, document);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    gardens.delete(id);
    return ResponseEntity.noContent().build();
  }
}
