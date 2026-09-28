package jp.greenly.api.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "placed_objects")
public class PlacedObjectEntity {
  @Id
  @Column(length = 36, columnDefinition = "CHAR(36)", nullable = false)
  private String id;

  @Column(name = "garden_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
  private String gardenId;

  @Column(name = "asset_id", length = 64, nullable = false)
  private String assetId;

  @Column(name = "position_x", nullable = false)
  private double positionX;
  @Column(name = "position_y", nullable = false)
  private double positionY;
  @Column(name = "position_z", nullable = false)
  private double positionZ;
  @Column(name = "rotation_x", nullable = false)
  private double rotationX;
  @Column(name = "rotation_y", nullable = false)
  private double rotationY;
  @Column(name = "rotation_z", nullable = false)
  private double rotationZ;
  @Column(name = "scale_x", nullable = false)
  private double scaleX;
  @Column(name = "scale_y", nullable = false)
  private double scaleY;
  @Column(name = "scale_z", nullable = false)
  private double scaleZ;

  protected PlacedObjectEntity() {}

  public PlacedObjectEntity(String id, String gardenId, String assetId,
      double positionX, double positionY, double positionZ,
      double rotationX, double rotationY, double rotationZ,
      double scaleX, double scaleY, double scaleZ) {
    this.id = id;
    this.gardenId = gardenId;
    this.assetId = assetId;
    this.positionX = positionX;
    this.positionY = positionY;
    this.positionZ = positionZ;
    this.rotationX = rotationX;
    this.rotationY = rotationY;
    this.rotationZ = rotationZ;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.scaleZ = scaleZ;
  }

  public String getId() { return id; }
  public String getAssetId() { return assetId; }
  public double getPositionX() { return positionX; }
  public double getPositionY() { return positionY; }
  public double getPositionZ() { return positionZ; }
  public double getRotationX() { return rotationX; }
  public double getRotationY() { return rotationY; }
  public double getRotationZ() { return rotationZ; }
  public double getScaleX() { return scaleX; }
  public double getScaleY() { return scaleY; }
  public double getScaleZ() { return scaleZ; }
}
