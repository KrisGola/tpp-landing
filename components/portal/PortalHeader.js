import s from './PortalHeader.module.css';

export default function PortalHeader({ user, onOpenAccount }) {
  return (
    <header className={s.header}>
      <a href="/" className={s.logo}>
        <span className={s.logoLight}>twojapomoc</span>
        <span className={s.logoBold}>prawna</span>
        <span className={s.logoTld}>.pl</span>
      </a>

      <div className={s.right}>
        <button className={s.notifBtn} aria-label="Powiadomienia">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2a7 7 0 0 1 7 7v3l1.5 2.5H2.5L4 12V9a7 7 0 0 1 7-7z"
              stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 18a2 2 0 0 0 4 0" stroke="rgba(255,255,255,.8)" strokeWidth="1.5"/>
          </svg>
          <span className={s.notifDot} />
        </button>

        <button className={s.avatar} onClick={onOpenAccount} aria-label="Konto">
          {user.initials}
        </button>
      </div>
    </header>
  );
}
