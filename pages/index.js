/**
 * / — twojapomocprawna.pl landing page
 *
 * Two primary CTAs:
 *   - "Opisz sprawę z AI"  → /wizard
 *   - "Przeglądaj prawników" → /prawnicy
 *
 * The page is intentionally short — the real conversion happens in the
 * wizard. All content is static so the page is fast and SEO-friendly.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '../lib/AuthContext';
import s from '../styles/landing.module.css';

const STEPS = [
  {
    icon: '✏️',
    title: 'Opisz sprawę',
    body: 'W 2 minuty, własnymi słowami. Bez formularzy prawniczych.',
  },
  {
    icon: '🧠',
    title: 'AI analizuje',
    body: 'Rozpoznaje kategorię, terminy i plan działania. Dostajesz wyjaśnienie po ludzku.',
  },
  {
    icon: '⚖️',
    title: 'Dostajesz prawnika',
    body: 'Dopasowanego do sprawy, lokalizacji i pilności. Możesz umówić konsultację od razu.',
  },
];

const BENEFITS = [
  { metric: '< 2 min', label: 'czas analizy sprawy' },
  { metric: '280+',    label: 'prawników w bazie' },
  { metric: '4.8 ★',   label: 'średnia ocena' },
  { metric: 'Bezpłatnie', label: 'analiza i dobór prawnika' },
];

const CATEGORIES = [
  { slug: 'prawo-pracy',         icon: '💼', label: 'Prawo pracy',      blurb: 'Zwolnienia, umowy, mobbing' },
  { slug: 'prawo-rodzinne',      icon: '👨‍👩‍👧', label: 'Prawo rodzinne',   blurb: 'Rozwód, alimenty, opieka' },
  { slug: 'prawo-cywilne',       icon: '📄', label: 'Prawo cywilne',    blurb: 'Umowy, odszkodowania, długi' },
  { slug: 'prawo-nieruchomosci', icon: '🏠', label: 'Nieruchomości',    blurb: 'Najem, zakup, wspólnoty' },
  { slug: 'postepowanie-sadowe', icon: '⚖️', label: 'Postępowanie sądowe', blurb: 'Wezwania, pozwy, egzekucja' },
  { slug: 'inne',                icon: '💡', label: 'Inne',              blurb: 'Nie wiem jeszcze' },
];

export default function HomePage() {
  const { user, loading } = useUser();

  return (
    <>
      <Head>
        <title>Twoja Pomoc Prawna — znajdź prawnika z AI</title>
        <meta name="description" content="Opisz swoją sprawę w 2 minuty. AI dopasuje prawnika do Twojej sytuacji i lokalizacji. Pierwsza analiza bezpłatna." />
        <meta property="og:title" content="Twoja Pomoc Prawna — znajdź prawnika z AI" />
        <meta property="og:description" content="AI analizuje Twoją sprawę i dopasowuje najlepszego prawnika." />
      </Head>

      <div className={s.page}>
        {/* Navbar */}
        <header className={s.nav}>
          <Link href="/" className={s.brand}>
            twojapomoc<strong>prawna</strong>.pl
          </Link>
          <nav className={s.navLinks}>
            <Link href="/prawnicy" className={s.navLink}>Prawnicy</Link>
            {!loading && (user ? (
              <Link href="/portal" className={s.navCta}>Mój panel</Link>
            ) : (
              <Link href="/login" className={s.navLink}>Zaloguj</Link>
            ))}
          </nav>
        </header>

        {/* Hero */}
        <section className={s.hero}>
          <div className={s.heroInner}>
            <div className={s.badge}>
              <span className={s.badgeDot} /> AI + 280 prawników w Polsce
            </div>

            <h1 className={s.heroTitle}>
              Opisz swoją sprawę. <br />
              <span className={s.heroTitleAccent}>AI dobierze prawnika.</span>
            </h1>

            <p className={s.heroLead}>
              Zwolnienie z pracy, rozwód, problem z umową?
              Opisz sytuację po ludzku — w 2 minuty dostaniesz analizę,
              plan działania i dopasowanego prawnika.
            </p>

            <div className={s.heroCtas}>
              <Link href="/wizard" className={s.primaryCta}>
                Opisz sprawę →
              </Link>
              <Link href="/prawnicy" className={s.secondaryCta}>
                Przeglądaj prawników
              </Link>
            </div>

            <p className={s.heroNote}>
              Bez rejestracji. Analiza AI i dobór prawnika — bezpłatnie.
            </p>
          </div>
        </section>

        {/* Benefits bar */}
        <section className={s.benefits}>
          {BENEFITS.map(b => (
            <div key={b.label} className={s.benefit}>
              <div className={s.benefitMetric}>{b.metric}</div>
              <div className={s.benefitLabel}>{b.label}</div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Jak to działa</h2>
          <div className={s.steps}>
            {STEPS.map((step, i) => (
              <div key={step.title} className={s.step}>
                <div className={s.stepIcon} aria-hidden="true">{step.icon}</div>
                <div className={s.stepNum}>Krok {i + 1}</div>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepBody}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className={`${s.section} ${s.sectionMuted}`}>
          <h2 className={s.sectionTitle}>W jakich sprawach pomagamy</h2>
          <div className={s.categories}>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/wizard?cat=${cat.slug}`}
                className={s.category}
              >
                <div className={s.categoryIcon}>{cat.icon}</div>
                <div className={s.categoryLabel}>{cat.label}</div>
                <div className={s.categoryBlurb}>{cat.blurb}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={s.finalCta}>
          <h2 className={s.finalTitle}>Gotów do zrobienia kroku?</h2>
          <p className={s.finalLead}>
            Opisz swoją sytuację — analiza trwa mniej niż 2 minuty.
          </p>
          <Link href="/wizard" className={s.primaryCta}>
            Zacznij teraz →
          </Link>
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.footerInner}>
            <div className={s.footerBrand}>
              twojapomoc<strong>prawna</strong>.pl
              <div className={s.footerNote}>
                AI-powered marketplace prawniczy
              </div>
            </div>
            <div className={s.footerLinks}>
              <Link href="/wizard">Znajdź prawnika</Link>
              <Link href="/prawnicy">Katalog prawników</Link>
              <Link href="/login">Zaloguj się</Link>
              <Link href="/regulamin">Regulamin</Link>
              <Link href="/prywatnosc">Prywatność</Link>
            </div>
          </div>
          <div className={s.footerBottom}>
            © {new Date().getFullYear()} twojapomocprawna.pl
          </div>
        </footer>
      </div>
    </>
  );
}
