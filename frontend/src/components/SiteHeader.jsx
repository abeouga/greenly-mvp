import { KusakariHeader } from '@kusakari/site-header';
import '@kusakari/site-header/style.css';
import { useEcCart } from '../hooks/useCommerce';
import { ecUrl } from '../domain/shopping';

export function SiteHeader({ onNavigate, disabled = false }) {
  const cart = useEcCart();
  return (
    <KusakariHeader
      ecUrl={ecUrl}
      cartCount={cart.data?.itemCount ?? null}
      canvasUrl={`${window.location.origin}/`}
      logoUrl="/icons/kusakari_ico.png"
      activeSection="canvas"
      onNavigate={onNavigate}
      disabled={disabled}
    />
  );
}
