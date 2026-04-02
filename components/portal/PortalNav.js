import s from './PortalNav.module.css';

const TABS = [
  {
    id: 'home', label: 'Dom',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M8 20v-7h6v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'sprawy', label: 'Sprawy',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3"
          stroke="currentColor" strokeWidth="1.6"/>
        <path d="M7 8h8M7 12h8M7 16h5"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'dokumenty', label: 'Dokumenty',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M13 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M13 2v5h5M9 13h4M9 9h1"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'wiadomosci', label: 'Wiadomości',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function PortalNav({ activeTab, onSwitch }) {
  return (
    <nav className={s.nav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ''}`}
          onClick={() => onSwitch(tab.id)}
        >
          <span className={s.icon}>{tab.icon}</span>
          <span className={s.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
