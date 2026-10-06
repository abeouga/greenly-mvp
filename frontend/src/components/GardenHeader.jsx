import { GreenlyIcon } from './GreenlyIcon';

export function GardenHeader({ title, subtitle }) {
    return (<header className="brand-header">
      <a className="brand-mark" href="/" aria-label="Greenly 庭一覧へ">
        <GreenlyIcon />
        <span>Greenly</span>
      </a>
      <div className="brand-heading">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <span className="version-tag">Garden workspace</span>
    </header>);
}
