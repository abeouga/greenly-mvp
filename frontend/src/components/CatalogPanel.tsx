import type { GardenAsset } from '../types/garden';

interface CatalogPanelProps {
  assets: GardenAsset[];
  selectedAssetId: string | null;
  disabled: boolean;
  collapsed: boolean;
  onSelect: (assetId: string) => void;
  onToggle: () => void;
}

const categories: Record<string, string> = {
  tree: '植物',
  shrub: '植物',
  paving: '舗装',
  furniture: '家具',
};

export function CatalogPanel({ assets, selectedAssetId, disabled, collapsed, onSelect, onToggle }: CatalogPanelProps) {
  return (
    <aside id="catalog-panel" className={`editor-panel side-panel catalog-panel${collapsed ? ' is-collapsed' : ''}`}>
      <div className="side-panel-controls">
        <button
          className="side-panel-toggle"
          type="button"
          aria-label={collapsed ? 'オブジェクトパネルを表示' : 'オブジェクトパネルを隠す'}
          aria-expanded={!collapsed}
          aria-controls="catalog-panel-content"
          onClick={onToggle}
        >
          <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>
      <div id="catalog-panel-content" className="side-panel-content" aria-hidden={collapsed}>
        <div className="panel-heading">
          <span className="eyebrow">CATALOG</span>
          <h2>オブジェクト</h2>
          <p>種類を選び、地面をクリックして配置します。</p>
        </div>
        <div className="asset-list">
          {assets.map((asset) => (
            <button
              className={`asset-card${selectedAssetId === asset.id ? ' is-active' : ''}`}
              key={asset.id}
              data-testid={`asset-${asset.id}`}
              type="button"
              aria-pressed={selectedAssetId === asset.id}
              disabled={disabled}
              onClick={() => onSelect(asset.id)}
            >
              <span className={`asset-swatch swatch-${asset.id}`} aria-hidden="true" />
              <span className="asset-card-text">
                <strong>{asset.name}</strong>
                <span>{categories[asset.category] ?? asset.category}</span>
                <small>{asset.baseDimensions.width} × {asset.baseDimensions.height} × {asset.baseDimensions.depth} m</small>
              </span>
            </button>
          ))}
        </div>
        <p className="panel-hint">開発用の簡易GLBモデルです。</p>
      </div>
    </aside>
  );
}
