/**
 * /portal — TPP Client Portal
 *
 * 4-tab layout: Dom | Sprawy | Dokumenty | Wiadomości
 * Account as slide-in drawer from right
 * Fixed-height mobile layout (header + bottom nav + scroll container)
 *
 * Data: currently uses mock data — will connect to Supabase in Faza 1/4
 */

import { useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import PortalHeader  from '../../components/portal/PortalHeader';
import PortalNav     from '../../components/portal/PortalNav';
import PortalHome    from '../../components/portal/PortalHome';
import PortalSprawy  from '../../components/portal/PortalSprawy';
import PortalDokumenty from '../../components/portal/PortalDokumenty';
import PortalWiadomosci from '../../components/portal/PortalWiadomosci';
import PortalCaseDetail from '../../components/portal/PortalCaseDetail';
import AccountDrawer from '../../components/portal/AccountDrawer';
import styles from '../../components/portal/Portal.module.css';

// ── Mock user (replace with Supabase auth in Faza 1) ────
const MOCK_USER = {
  id:       'mock-mw',
  name:     'Marta Wiśniewska',
  initials: 'MW',
  email:    'marta@example.com',
  plan:     'Free',
};

// ── Mock case ───────────────────────────────────────────
const MOCK_CASE = {
  id:          'case-1',
  title:       'Bezprawne zwolnienie z pracy',
  category:    'Prawo pracy',
  status:      'active',
  priority:    'urgent',
  deadlineDays: 18,
  deadlineLabel: '18 dni do złożenia odwołania do sądu pracy',
  openedAt:    '2026-04-01',
  lawyer: {
    id:       'mock-ak',
    name:     'mec. Anna Kowalska',
    initials: 'AK',
    status:   'Aktywna · odpowiada w 1 godz.',
  },
  aiAnalysis: {
    summary: 'Twoja sprawa dotyczy prawa pracy. Zwolnienie bez pisemnego uzasadnienia po ponad 3 miesiącach pracy narusza przepisy Kodeksu pracy. Masz konkretne prawa i możliwości działania — terminy są krótkie, ale jeszcze możesz działać.',
    urgency: 'urgent',
    timeline: [
      { label: 'Analiza AI',   done: true,  active: false },
      { label: 'Plan',         done: true,  active: false },
      { label: 'Prawnik',      done: false, active: true  },
      { label: 'Sąd pracy',    done: false, active: false },
      { label: 'Wynik',        done: false, active: false },
    ],
    steps: [
      { order: 1, title: 'Złóż odwołanie do sądu pracy', urgency: 'critical', deadlineLabel: '21 dni od daty zwolnienia', body: 'Termin 21 dni od dnia wypowiedzenia jest prekluzyjny — po jego upływie tracisz prawo do odwołania.' },
      { order: 2, title: 'Zażądaj pisemnego uzasadnienia', urgency: 'high', deadlineLabel: null, body: 'Pracodawca ma obowiązek dostarczyć uzasadnienie wypowiedzenia na piśmie na Twój wniosek.' },
      { order: 3, title: 'Zbierz dokumenty', urgency: 'normal', deadlineLabel: null, body: 'Umowa o pracę, paski wynagrodzeń, korespondencja e-mail, świadkowie.' },
    ],
  },
  documents: [
    { id: 'd1', name: 'Wzór odwołania do sądu pracy.docx', source: 'ai_generated', size: '28 KB', date: 'Wczoraj' },
    { id: 'd2', name: 'Umowa o pracę.pdf', source: 'user', size: '156 KB', date: '1 kwi' },
    { id: 'd3', name: 'Pismo wypowiedzenia.pdf', source: 'user', size: '89 KB', date: '1 kwi' },
  ],
  nextBooking: {
    date: '2 kwi 2026',
    time: '09:00',
    type: 'online',
    meetUrl: '#',
  },
};

export default function PortalPage() {
  const [tab, setTab]             = useState('home');
  const [direction, setDirection] = useState('forward');
  const [caseOpen, setCaseOpen]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef(null);

  const switchTab = useCallback((name) => {
    if (name === tab && !caseOpen) return;
    setDirection('forward');
    setCaseOpen(false);
    setTab(name);
    scrollRef.current?.scrollTo(0, 0);
  }, [tab, caseOpen]);

  const openCase = useCallback(() => {
    setDirection('forward');
    setCaseOpen(true);
    scrollRef.current?.scrollTo(0, 0);
  }, []);

  const closeCase = useCallback(() => {
    setDirection('back');
    setCaseOpen(false);
    scrollRef.current?.scrollTo(0, 0);
  }, []);

  const renderContent = () => {
    if (caseOpen) {
      return (
        <div key="case" className={`${styles.view} ${styles.animIn}`}>
          <PortalCaseDetail caseData={MOCK_CASE} onBack={closeCase} />
        </div>
      );
    }

    const animCls = direction === 'back' ? styles.animBack : styles.animIn;

    const views = {
      home:       <PortalHome       caseData={MOCK_CASE} user={MOCK_USER} onOpenCase={openCase} />,
      sprawy:     <PortalSprawy     caseData={MOCK_CASE} onOpenCase={openCase} />,
      dokumenty:  <PortalDokumenty  caseData={MOCK_CASE} />,
      wiadomosci: <PortalWiadomosci caseData={MOCK_CASE} user={MOCK_USER} />,
    };

    return (
      <div key={tab} className={`${styles.view} ${animCls}`}>
        {views[tab]}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Panel klienta — Twoja Pomoc Prawna</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>

      <div className={styles.shell}>
        <PortalHeader
          user={MOCK_USER}
          onOpenAccount={() => setDrawerOpen(true)}
        />

        <div className={styles.scrollArea} ref={scrollRef}>
          {renderContent()}
        </div>

        <PortalNav activeTab={tab} onSwitch={switchTab} />

        <AccountDrawer
          open={drawerOpen}
          user={MOCK_USER}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </>
  );
}
