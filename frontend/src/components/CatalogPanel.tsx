import type { GardenAsset } from '../types/garden';
import { AssetPreview } from './AssetPreview';
import { UiIcon } from './UiIcon';

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
    <aside id="catalog-panel" className={`catalog-panel${collapsed ? ' is-collapsed' : ''}`} aria-label="素材カタログ">
      <div className="catalog-heading">
        <h2><UiIcon name="plus" size={16} />素材を追加</h2>
        <span>{selectedAssetId ? '同じ素材を続けて配置できます' : '素材を選び、庭をクリックして配置'}</span>
        <button
          className="text-button"
          type="button"
          aria-label={collapsed ? 'オブジェクトパネルを表示' : 'オブジェクトパネルを隠す'}
          aria-expanded={!collapsed}
          aria-controls="catalog-panel-content"
          onClick={onToggle}
        >
          {collapsed ? '開く' : 'しまう'}<span className={collapsed ? 'chevron-up' : ''}><UiIcon name="chevron" size={16} /></span>
        </button>
      </div>
      <div id="catalog-panel-content" hidden={collapsed}>
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
              <AssetPreview assetId={asset.id} />
              <span className="asset-card-text">
                <strong>{asset.name}</strong>
                <span>{categories[asset.category] ?? asset.category}{selectedAssetId === asset.id ? ' · 配置中' : ''}</span>
                <small>{asset.baseDimensions.width} × {asset.baseDimensions.height} × {asset.baseDimensions.depth} m</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
