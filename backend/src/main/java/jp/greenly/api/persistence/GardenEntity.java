package jp.greenly.api.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "gardens")
public class GardenEntity {
  @Id
  @Column(length = 36, columnDefinition = "CHAR(36)", nullable = false)
  private String id;

  @Column(name = "owner_id", length = 128, nullable = false)
  private String ownerId;

  @Column(length = 120, nullable = false)
  private String name;

  @Column(nullable = false)
  private double width;

  @Column(nullable = false)
  private double depth;

  @Column(nullable = false)
  private long revision;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected GardenEntity() {}

  public GardenEntity(String id, String ownerId, String name, double width, double depth, long revision) {
    this.id = id;
    this.ownerId = ownerId;
    this.name = name;
    this.width = width;
    this.depth = depth;
    this.revision = revision;
  }

  @PrePersist
  void beforeInsert() {
    updatedAt = Instant.now();
  }

  @PreUpdate
  void beforeUpdate() {
    updatedAt = Instant.now();
  }

  public String getId() { return id; }
  public String getOwnerId() { return ownerId; }
  public String getName() { return name; }
  public double getWidth() { return width; }
  public double getDepth() { return depth; }
  public long getRevision() { return revision; }
  public Instant getUpdatedAt() { return updatedAt; }

  public void update(String name, long revision) {
    this.name = name;
    this.revision = revision;
  }
}
