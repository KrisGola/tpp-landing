import s from './PortalDokumenty.module.css';

export default function PortalDokumenty({ caseData }) {
  const aiDocs  = caseData.documents.filter(d => d.source === 'ai_generated');
  const userDocs = caseData.documents.filter(d => d.source === 'user');

  return (
    <div className={s.wrap}>
      <h2 className={s.title}>Dokumenty</h2>

      {aiDocs.length > 0 && (
        <>
          <div className={s.sectionLabel}>WYGENEROWANE PRZEZ AI</div>
          <div className={s.list}>
            {aiDocs.map(doc => (
              <div key={doc.id} className={s.docRow}>
                <div className={s.docIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z"
                      stroke="var(--color-primary)" strokeWidth="1.3" strokeLinejoin="round"/>
                    <path d="M9 1v4h4" stroke="var(--color-primary)" strokeWidth="1.3"/>
                  </svg>
                </div>
                <div className={s.docInfo}>
                  <div className={s.docName}>{doc.name}</div>
                  <div className={s.docMeta}>{doc.size} · {doc.date}</div>
                </div>
                <button className={s.downloadBtn} aria-label="Pobierz">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M5 7l3 3 3-3M2 13h12" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {userDocs.length > 0 && (
        <>
          <div className={s.sectionLabel}>TWOJE DOKUMENTY</div>
          <div className={s.list}>
            {userDocs.map(doc => (
              <div key={doc.id} className={s.docRow}>
                <div className={s.docIconUser}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z"
                      stroke="var(--color-text-secondary)" strokeWidth="1.3" strokeLinejoin="round"/>
                    <path d="M9 1v4h4" stroke="var(--color-text-secondary)" strokeWidth="1.3"/>
                  </svg>
                </div>
                <div className={s.docInfo}>
                  <div className={s.docName}>{doc.name}</div>
                  <div className={s.docMeta}>{doc.size} · {doc.date}</div>
                </div>
                <button className={s.downloadBtn} aria-label="Pobierz">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M5 7l3 3 3-3M2 13h12" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload zone */}
      <div className={s.sectionLabel}>DODAJ DOKUMENT</div>
      <label className={s.uploadZone} htmlFor="file-upload">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 18V10M10 14l4-4 4 4" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 22H6a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4h.5M20 22h2a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4h-.5" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className={s.uploadText}>Przeciągnij plik lub kliknij, żeby dodać</span>
        <span className={s.uploadSub}>PDF, DOCX, JPG do 10 MB</span>
        <input id="file-upload" type="file" className={s.hiddenInput} accept=".pdf,.docx,.jpg,.jpeg,.png" />
      </label>

      <div style={{ height: 24 }} />
    </div>
  );
}
