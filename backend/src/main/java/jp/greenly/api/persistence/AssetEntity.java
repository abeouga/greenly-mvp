package jp.greenly.api.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "assets")
public class AssetEntity {
  @Id
  @Column(length = 64, nullable = false)
  private String id;

  @Column(length = 120, nullable = false)
  private String name;

  @Column(length = 40, nullable = false)
  private String category;

  @Column(name = "model_url", length = 255, nullable = false)
  private String modelUrl;

  @Column(name = "base_width", precision = 8, scale = 3, nullable = false)
  private BigDecimal baseWidth;

  @Column(name = "base_height", precision = 8, scale = 3, nullable = false)
  private BigDecimal baseHeight;

  @Column(name = "base_depth", precision = 8, scale = 3, nullable = false)
  private BigDecimal baseDepth;

  protected AssetEntity() {}

  public String getId() { return id; }
  public String getName() { return name; }
  public String getCategory() { return category; }
  public String getModelUrl() { return modelUrl; }
  public BigDecimal getBaseWidth() { return baseWidth; }
  public BigDecimal getBaseHeight() { return baseHeight; }
  public BigDecimal getBaseDepth() { return baseDepth; }
}
