import { KusakariHeader } from '@kusakari/site-header';
import '@kusakari/site-header/style.css';
import { ecUrl } from '../domain/shopping';

export function SiteHeader({ onNavigate, disabled = false }) {
  return (
    <KusakariHeader
      ecUrl={ecUrl}
      canvasUrl={`${window.location.origin}/`}
      logoUrl="/icons/kusakari_ico.png"
      activeSection="canvas"
      onNavigate={onNavigate}
      disabled={disabled}
    />
  );
}
