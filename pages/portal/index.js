/**
 * /portal — TPP Client Portal
 *
 * 4-tab layout: Dom | Sprawy | Dokumenty | Wiadomości
 * Account as slide-in drawer from right
 * Fixed-height mobile layout (header + bottom nav + scroll container)
 *
 * Data: pulls the logged-in user's latest case from Supabase.
 * Falls back to mock fixtures when Supabase is not configured OR the
 * user has no cases yet (first-login empty state uses mock for shape).
 *
 * Route guard: wrapped in <RequireAuth>. In mock mode renders anyway
 * so the colleague can review the UI before DB wiring.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import PortalHeader  from '../../components/portal/PortalHeader';
import PortalNav     from '../../components/portal/PortalNav';
import PortalHome    from '../../components/portal/PortalHome';
import PortalSprawy  from '../../components/portal/PortalSprawy';
import PortalDokumenty from '../../components/portal/PortalDokumenty';
import PortalWiadomosci from '../../components/portal/PortalWiadomosci';
import PortalCaseDetail from '../../components/portal/PortalCaseDetail';
import AccountDrawer from '../../components/portal/AccountDrawer';
import RequireAuth from '../../components/auth/RequireAuth';
import { useUser } from '../../lib/AuthContext';
import { authedFetch } from '../../lib/supabaseBrowser';
import { buildPortalCaseView, buildMockPortalCase, buildMockPortalUser } from '../../lib/portalAdapter';
import styles from '../../components/portal/Portal.module.css';

export default function PortalPage() {
  return (
    <RequireAuth>
      <PortalInner />
    </RequireAuth>
  );
}

function PortalInner() {
  const { user, profile, isConfigured } = useUser();

  const [tab, setTab]               = useState('home');
  const [direction, setDirection]   = useState('forward');
  const [caseOpen, setCaseOpen]     = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [caseData, setCaseData]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [emptyState, setEmptyState] = useState(false);
  const scrollRef = useRef(null);

  // Load the user's most recent case. In mock mode we short-circuit.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isConfigured) {
        setCaseData(buildMockPortalCase());
        setLoading(false);
        return;
      }

      try {
        const listRes = await authedFetch('/api/cases');
        if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
        const { cases } = await listRes.json();

        if (!cases || cases.length === 0) {
          if (!cancelled) {
            setEmptyState(true);
            setLoading(false);
          }
          return;
        }

        // Fetch full detail (with lawyer, docs, messages) for the newest case
        const newest = cases[0];
        const detailRes = await authedFetch(`/api/cases/${newest.id}`);
        if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
        const detail = await detailRes.json();

        if (!cancelled) {
          setCaseData(buildPortalCaseView(detail));
          setLoading(false);
        }
      } catch (err) {
        console.error('[portal] load error:', err);
        if (!cancelled) {
          setCaseData(buildMockPortalCase());
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isConfigured]);

  const viewUser = buildMockPortalUser(user, profile);

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

  // Render helpers
  const renderLoading = () => (
    <div className={styles.view}>
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#5a6b65' }}>
        Ładowanie…
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className={styles.view}>
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ margin: '0 0 8px', color: '#124030', fontSize: 22 }}>Brak spraw</h2>
        <p style={{ color: '#5a6b65', margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
          Opisz swoją sytuację z AI — dobierzemy prawnika i otworzymy sprawę w portalu.
        </p>
        <Link
          href="/wizard"
          style={{
            display: 'inline-block',
            background: '#2E9465',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Opisz sprawę →
        </Link>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading)   return renderLoading();
    if (emptyState) return renderEmpty();
    if (!caseData) return renderEmpty();

    if (caseOpen) {
      return (
        <div key="case" className={`${styles.view} ${styles.animIn}`}>
          <PortalCaseDetail caseData={caseData} onBack={closeCase} />
        </div>
      );
    }

    const animCls = direction === 'back' ? styles.animBack : styles.animIn;

    const views = {
      home:       <PortalHome       caseData={caseData} user={viewUser} onOpenCase={openCase} />,
      sprawy:     <PortalSprawy     caseData={caseData} onOpenCase={openCase} />,
      dokumenty:  <PortalDokumenty  caseData={caseData} />,
      wiadomosci: <PortalWiadomosci caseData={caseData} user={viewUser} />,
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
        <meta name="robots" content="noindex" />
      </Head>

      <div className={styles.shell}>
        <PortalHeader
          user={viewUser}
          onOpenAccount={() => setDrawerOpen(true)}
        />

        <div className={styles.scrollArea} ref={scrollRef}>
          {renderContent()}
        </div>

        <PortalNav activeTab={tab} onSwitch={switchTab} />

        <AccountDrawer
          open={drawerOpen}
          user={viewUser}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </>
  );
}
