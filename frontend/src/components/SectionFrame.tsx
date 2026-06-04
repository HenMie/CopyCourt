import type { ReactNode } from 'react';

interface SectionFrameProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function SectionFrame({
  title,
  subtitle,
  badge,
  icon,
  fullWidth = false,
  children,
}: SectionFrameProps) {
  return (
    <section className={`section-frame${fullWidth ? ' section-frame-full' : ''}`}>
      <header className="section-frame-header">
        <div className="section-frame-title">
          <div className="section-frame-icon">{icon}</div>
          <div>
            <p className="section-frame-eyebrow">{subtitle ?? 'Court Record'}</p>
            <h2>{title}</h2>
          </div>
        </div>
        {badge ? <span className="section-frame-badge">{badge}</span> : null}
      </header>
      <div className="section-frame-body">{children}</div>
    </section>
  );
}
