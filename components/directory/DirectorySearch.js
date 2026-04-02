import s from './DirectorySearch.module.css';

export default function DirectorySearch({ value, onChange }) {
  return (
    <div className={s.wrap}>
      <svg className={s.icon} width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <input
        className={s.input}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Specjalizacja lub miasto…"
        autoComplete="off"
      />
      {value && (
        <button className={s.clear} onClick={() => onChange('')} aria-label="Wyczyść">
          ×
        </button>
      )}
    </div>
  );
}
