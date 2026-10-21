// ReliefHub mark: a shield (protection) holding a roof chevron (shelter and
// recovery) above flood waves (the emergency being coordinated).
// `tone="dark"` is for navy backgrounds such as the sidebar.
export function LogoMark({ className = 'h-9 w-9', tone = 'light', title }) {
  const shield = tone === 'dark' ? '#f6f4ee' : '#0f2a44';
  const roof = tone === 'dark' ? '#0f2a44' : '#f6f4ee';
  return (
    <svg viewBox="0 0 32 32" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d="M16 2.5 27 6.6V15c0 6.9-4.6 12.2-11 14.5C9.6 27.2 5 21.9 5 15V6.6Z" fill={shield} />
      <path d="M10.2 14.6 16 9.6l5.8 5" fill="none" stroke={roof} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.6 19.6c1.2-1.2 2.5-1.2 3.7 0s2.5 1.2 3.7 0 2.5-1.2 3.7 0 2.5 1.2 3.7 0" fill="none" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 23.8c1-1 2-1 3 0s2 1 3 0 2-1 3 0" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Logo({ tone = 'dark', subtitle = 'Flood relief coordination' }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark tone={tone} className="h-10 w-10 shrink-0" />
      <span className="leading-tight">
        <span className={`block text-[17px] font-semibold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-brand-900'}`}>
          Relief<span className="text-teal-400">Hub</span>
        </span>
        {subtitle && <span className={`block text-xs ${tone === 'dark' ? 'text-brand-300' : 'text-slate-500'}`}>{subtitle}</span>}
      </span>
    </span>
  );
}
