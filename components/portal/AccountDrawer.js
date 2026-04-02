import s from './AccountDrawer.module.css';

const MENU_ITEMS = [
  { label: 'Mój profil',     icon: '👤' },
  { label: 'E-mail',         icon: '✉️' },
  { label: 'Hasło',          icon: '🔒' },
  { label: 'Plan i płatności', icon: '💳' },
  { label: 'Powiadomienia',  icon: '🔔' },
  { label: 'Prywatność',     icon: '🛡️' },
];

export default function AccountDrawer({ open, user, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`${s.backdrop} ${open ? s.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className={`${s.drawer} ${open ? s.drawerOpen : ''}`} role="dialog" aria-label="Konto">
        {/* Handle */}
        <div className={s.handle} />

        {/* User info */}
        <div className={s.userSection}>
          <div className={s.userAvatar}>{user.initials}</div>
          <div>
            <div className={s.userName}>{user.name}</div>
            <div className={s.userEmail}>{user.email}</div>
          </div>
          <span className={s.planBadge}>{user.plan}</span>
        </div>

        {/* Menu */}
        <div className={s.menuList}>
          {MENU_ITEMS.map(item => (
            <button key={item.label} className={s.menuRow}>
              <span className={s.menuIcon}>{item.icon}</span>
              <span className={s.menuLabel}>{item.label}</span>
              <span className={s.menuChevron}>›</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className={s.logoutBtn}>
          Wyloguj się
        </button>
      </div>
    </>
  );
}
