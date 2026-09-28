CREATE TABLE assets (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  model_url VARCHAR(255) NOT NULL,
  base_width DECIMAL(8, 3) NOT NULL,
  base_height DECIMAL(8, 3) NOT NULL,
  base_depth DECIMAL(8, 3) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE gardens (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_id VARCHAR(128) NOT NULL,
  name VARCHAR(120) NOT NULL,
  width DOUBLE NOT NULL,
  depth DOUBLE NOT NULL,
  revision BIGINT NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  INDEX idx_gardens_owner_updated (owner_id, updated_at)
) ENGINE=InnoDB;

CREATE TABLE placed_objects (
  id CHAR(36) NOT NULL PRIMARY KEY,
  garden_id CHAR(36) NOT NULL,
  asset_id VARCHAR(64) NOT NULL,
  position_x DOUBLE NOT NULL,
  position_y DOUBLE NOT NULL,
  position_z DOUBLE NOT NULL,
  rotation_x DOUBLE NOT NULL,
  rotation_y DOUBLE NOT NULL,
  rotation_z DOUBLE NOT NULL,
  scale_x DOUBLE NOT NULL,
  scale_y DOUBLE NOT NULL,
  scale_z DOUBLE NOT NULL,
  INDEX idx_placed_objects_garden (garden_id),
  CONSTRAINT fk_placed_objects_garden FOREIGN KEY (garden_id) REFERENCES gardens (id) ON DELETE CASCADE,
  CONSTRAINT fk_placed_objects_asset FOREIGN KEY (asset_id) REFERENCES assets (id)
) ENGINE=InnoDB;

INSERT INTO assets (id, name, category, model_url, base_width, base_height, base_depth) VALUES
  ('tree_oak', '木', 'tree', '/models/tree-oak.glb', 2.000, 4.000, 2.000),
  ('shrub_boxwood', '低木', 'shrub', '/models/shrub-boxwood.glb', 1.200, 1.200, 1.200),
  ('brick_paver', 'レンガ', 'paving', '/models/brick-paver.glb', 0.600, 0.150, 0.200),
  ('bench_wood', 'ベンチ', 'furniture', '/models/bench-wood.glb', 1.600, 0.850, 0.650)
ON DUPLICATE KEY UPDATE id = id;
