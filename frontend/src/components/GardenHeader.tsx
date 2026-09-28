interface GardenHeaderProps {
  title: string;
  subtitle?: string;
}

export function GardenHeader({ title, subtitle }: GardenHeaderProps) {
  return (
    <header className="brand-header">
      <a className="brand-mark" href="/" aria-label="Greenly 庭一覧へ">
        <span className="brand-icon" aria-hidden="true">G</span>
        <span>Greenly</span>
      </a>
      <div className="brand-heading">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <span className="version-tag">手動3Dエディタ</span>
    </header>
  );
}
