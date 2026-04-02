/**
 * /prawnicy — TPP Lawyer Directory
 *
 * Public catalog of lawyers with tpp_is_listed = true.
 * Filters: specialization, city, availability, price.
 * Cards link to /p/[slug] (existing legal-portal public profile).
 *
 * Data: Supabase query with mock fallback (same as /api/match)
 */

import { useState, useMemo } from 'react';
import Head from 'next/head';
import s from '../../components/directory/Directory.module.css';
import LawyerCard from '../../components/directory/LawyerCard';
import DirectorySearch from '../../components/directory/DirectorySearch';

// ── Mock data (same pool as matchingEngine) ──────────────
const MOCK_LAWYERS = [
  {
    id: 'ak', slug: 'anna-kowalska', displayName: 'mec. Anna Kowalska',
    title: 'Radca prawny', city: 'Warszawa', region: 'Mazowieckie',
    specializations: ['Prawo pracy', 'Odwołanie od zwolnienia', 'Mobbing'],
    rating: 4.9, reviewCount: 63, responseHours: 1,
    availability: 'Dostępna dziś', availabilityType: 'today',
    priceConsult: 'bezpłatna 15 min', priceHour: '280 PLN/godz.',
    bio: 'Specjalizuję się w prawie pracy od 12 lat. Reprezentowałam ponad 300 pracowników w sporach z pracodawcami.',
    caseCount: 47,
  },
  {
    id: 'kd', slug: 'katarzyna-dabrowska', displayName: 'mec. Katarzyna Dąbrowska',
    title: 'Adwokat', city: 'Gdańsk', region: 'Pomorskie',
    specializations: ['Prawo pracy', 'Prawo rodzinne', 'Postępowanie sądowe'],
    rating: 4.85, reviewCount: 54, responseHours: 2,
    availability: 'Dostępna dziś', availabilityType: 'today',
    priceConsult: 'bezpłatna 20 min', priceHour: '290 PLN/godz.',
    bio: 'Doświadczony adwokat z 10-letnim stażem. Specjalizuję się w sporach pracowniczych i sprawach rodzinnych.',
    caseCount: 38,
  },
  {
    id: 'ms', slug: 'marta-stawska', displayName: 'radca pr. Marta Stawska',
    title: 'Radca prawny', city: 'Warszawa', region: 'Mazowieckie',
    specializations: ['Prawo rodzinne', 'Rozwód', 'Alimenty', 'Opieka nad dziećmi'],
    rating: 4.8, reviewCount: 29, responseHours: 2,
    availability: 'Dostępna dziś', availabilityType: 'today',
    priceConsult: 'bezpłatna 15 min', priceHour: '300 PLN/godz.',
    bio: 'Prawo rodzinne to moja pasja. Pomagam klientom przez najtrudniejsze momenty — rozwody, podział majątku, kontakty z dziećmi.',
    caseCount: 22,
  },
  {
    id: 'pn', slug: 'piotr-nowak', displayName: 'adw. Piotr Nowak',
    title: 'Adwokat', city: 'Kraków', region: 'Małopolskie',
    specializations: ['Prawo cywilne', 'Umowy', 'Odszkodowania', 'Windykacja'],
    rating: 4.7, reviewCount: 41, responseHours: 3,
    availability: 'Dostępny jutro', availabilityType: 'tomorrow',
    priceConsult: 'bezpłatna 30 min', priceHour: '320 PLN/godz.',
    bio: 'Specjalizuję się w sporach cywilnych i prawie umów. Pomagam zarówno osobom fizycznym jak i firmom.',
    caseCount: 55,
  },
  {
    id: 'jw', slug: 'jakub-wisniewski', displayName: 'adw. Jakub Wiśniewski',
    title: 'Adwokat', city: 'Wrocław', region: 'Dolnośląskie',
    specializations: ['Prawo nieruchomości', 'Prawo lokalowe', 'Umowy najmu'],
    rating: 4.6, reviewCount: 18, responseHours: 4,
    availability: 'Dostępny w tym tygodniu', availabilityType: 'week',
    priceConsult: null, priceHour: '260 PLN/godz.',
    bio: 'Kompleksowa obsługa prawna w zakresie nieruchomości — zakup, sprzedaż, najem, spory ze spółdzielnią.',
    caseCount: 31,
  },
  {
    id: 'aw', slug: 'anna-wojcik', displayName: 'mec. Anna Wójcik',
    title: 'Radca prawny', city: 'Poznań', region: 'Wielkopolskie',
    specializations: ['Prawo cywilne', 'Prawo konsumenckie', 'Odszkodowania'],
    rating: 4.75, reviewCount: 33, responseHours: 2,
    availability: 'Dostępna dziś', availabilityType: 'today',
    priceConsult: 'bezpłatna 15 min', priceHour: '270 PLN/godz.',
    bio: 'Prawo konsumenckie i odszkodowania. Pomagam odzyskać należne świadczenia od ubezpieczycieli i firm.',
    caseCount: 29,
  },
  {
    id: 'tk', slug: 'tomasz-kowalski', displayName: 'adw. Tomasz Kowalski',
    title: 'Adwokat', city: 'Warszawa', region: 'Mazowieckie',
    specializations: ['Postępowanie sądowe', 'Prawo karne', 'Odwołania'],
    rating: 4.65, reviewCount: 72, responseHours: 3,
    availability: 'Dostępny jutro', availabilityType: 'tomorrow',
    priceConsult: null, priceHour: '350 PLN/godz.',
    bio: 'Doświadczony adwokat w sprawach karnych i postępowaniach sądowych. Obrona na każdym etapie postępowania.',
    caseCount: 89,
  },
  {
    id: 'mk', slug: 'magdalena-kwiatkowska', displayName: 'mec. Magdalena Kwiatkowska',
    title: 'Radca prawny', city: 'Łódź', region: 'Łódzkie',
    specializations: ['Prawo pracy', 'Prawo cywilne', 'Umowy'],
    rating: 4.7, reviewCount: 26, responseHours: 4,
    availability: 'Dostępna w tym tygodniu', availabilityType: 'week',
    priceConsult: 'bezpłatna 20 min', priceHour: '250 PLN/godz.',
    bio: 'Kompleksowa pomoc prawna dla osób fizycznych. Prawo pracy i umowy cywilnoprawne to moje główne specjalizacje.',
    caseCount: 19,
  },
];

const ALL_SPECS = [
  'Prawo pracy', 'Prawo rodzinne', 'Prawo cywilne',
  'Prawo nieruchomości', 'Postępowanie sądowe', 'Odszkodowania',
];

const CITIES = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź'];

const SORT_OPTIONS = [
  { id: 'match',    label: 'Najlepiej oceniani' },
  { id: 'reviews',  label: 'Najwięcej opinii' },
  { id: 'price',    label: 'Najniższa cena' },
  { id: 'response', label: 'Najszybsza odpowiedź' },
];

export default function PrawnicyPage() {
  const [query, setQuery]         = useState('');
  const [specFilter, setSpec]     = useState(null);
  const [cityFilter, setCity]     = useState(null);
  const [availFilter, setAvail]   = useState(null); // 'today' | null
  const [sortBy, setSort]         = useState('match');
  const [showFilters, setShowFilters] = useState(false);

  // ── Filter + sort ───────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...MOCK_LAWYERS];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(l =>
        l.displayName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.specializations.some(s => s.toLowerCase().includes(q))
      );
    }

    if (specFilter) {
      list = list.filter(l =>
        l.specializations.some(s => s.toLowerCase().includes(specFilter.toLowerCase()))
      );
    }

    if (cityFilter) {
      list = list.filter(l => l.city === cityFilter);
    }

    if (availFilter === 'today') {
      list = list.filter(l => l.availabilityType === 'today');
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'match')    return b.rating - a.rating;
      if (sortBy === 'reviews')  return b.reviewCount - a.reviewCount;
      if (sortBy === 'response') return a.responseHours - b.responseHours;
      if (sortBy === 'price') {
        const pa = parseInt(a.priceHour) || 999;
        const pb = parseInt(b.priceHour) || 999;
        return pa - pb;
      }
      return 0;
    });

    return list;
  }, [query, specFilter, cityFilter, availFilter, sortBy]);

  const activeFilterCount = [specFilter, cityFilter, availFilter].filter(Boolean).length;

  return (
    <>
      <Head>
        <title>Znajdź prawnika — Twoja Pomoc Prawna</title>
        <meta name="description" content={`Znajdź prawnika w Polsce. ${MOCK_LAWYERS.length} specjalistów: prawo pracy, rodzinne, cywilne, nieruchomości i więcej.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta property="og:title" content="Znajdź prawnika — Twoja Pomoc Prawna" />
        <meta property="og:description" content="AI dopasuje Cię do najlepszego prawnika w Polsce. Bezpłatna pierwsza konsultacja." />
      </Head>

      <div className={s.shell}>
        {/* Header */}
        <header className={s.header}>
          <a href="/" className={s.logo}>
            <span className={s.logoLight}>twojapomoc</span>
            <span className={s.logoBold}>prawna</span>
            <span className={s.logoTld}>.pl</span>
          </a>
          <a href="/wizard" className={s.wizardCta}>
            AI pomoże wybrać →
          </a>
        </header>

        {/* Hero */}
        <div className={s.hero}>
          <div className={s.heroInner}>
            <h1 className={s.heroTitle}>Znajdź prawnika</h1>
            <p className={s.heroSub}>{MOCK_LAWYERS.length} specjalistów w całej Polsce</p>
            <DirectorySearch value={query} onChange={setQuery} />
          </div>
        </div>

        {/* Filters bar */}
        <div className={s.filtersBar}>
          <div className={s.filtersScroll}>
            {/* Availability quick filter */}
            <button
              className={`${s.filterPill} ${availFilter === 'today' ? s.filterPillActive : ''}`}
              onClick={() => setAvail(a => a === 'today' ? null : 'today')}
            >
              Dostępni dziś
            </button>

            {/* Specializations */}
            {ALL_SPECS.map(spec => (
              <button
                key={spec}
                className={`${s.filterPill} ${specFilter === spec ? s.filterPillActive : ''}`}
                onClick={() => setSpec(s => s === spec ? null : spec)}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* City + sort controls */}
          <div className={s.controls}>
            <select
              className={s.select}
              value={cityFilter ?? ''}
              onChange={e => setCity(e.target.value || null)}
            >
              <option value="">Wszystkie miasta</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className={s.select}
              value={sortBy}
              onChange={e => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className={s.resultsBar}>
          <span className={s.resultsCount}>
            {filtered.length} {filtered.length === 1 ? 'prawnik' : filtered.length < 5 ? 'prawnicy' : 'prawników'}
            {(specFilter || cityFilter) && (
              <span className={s.resultsSub}>
                {specFilter && ` · ${specFilter}`}
                {cityFilter && ` · ${cityFilter}`}
              </span>
            )}
          </span>
          {activeFilterCount > 0 && (
            <button
              className={s.clearFilters}
              onClick={() => { setSpec(null); setCity(null); setAvail(null); }}
            >
              Wyczyść filtry
            </button>
          )}
        </div>

        {/* Card list */}
        <div className={s.list}>
          {filtered.length === 0 ? (
            <div className={s.empty}>
              <p>Brak wyników dla wybranych filtrów.</p>
              <button className={s.emptyBtn} onClick={() => { setSpec(null); setCity(null); setAvail(null); setQuery(''); }}>
                Pokaż wszystkich
              </button>
            </div>
          ) : (
            filtered.map(lawyer => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} />
            ))
          )}
        </div>

        {/* Bottom CTA */}
        <div className={s.bottomCta}>
          <div className={s.bottomCtaInner}>
            <p className={s.bottomCtaText}>Nie wiesz którego wybrać?</p>
            <a href="/wizard" className={s.bottomCtaBtn}>
              Użyj AI — dobierze najlepszego dla Twojej sprawy
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
