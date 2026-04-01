/**
 * Fallback AI output per category.
 * Used when AI call fails or confidence is too low.
 * Always returns the same AIOutput shape as the real pipeline.
 */

const FALLBACKS = {
  praca: {
    classification: {
      legalArea: 'prawo_pracy',
      caseType: 'sprawa_pracownicza',
      urgencyLevel: 'high',
      confidence: 0,
    },
    extraction: {
      keyFacts: [
        { label: 'Obszar prawa', value: 'Prawo pracy' },
      ],
      deadlines: [
        { description: 'Odwołanie do sądu pracy', days: 21, fromEvent: 'zdarzenia' },
      ],
      missingInfo: ['Szczegóły sprawy wymagają weryfikacji'],
    },
    summary: {
      safeToAct: true,
      situationType: 'Sprawa pracownicza',
      plainExplanation: 'Twoja sprawa dotyczy prawa pracy. W zależności od szczegółów możesz mieć szereg praw i możliwości działania. Ważne, żebyś nie zwlekał — terminy w sprawach pracowniczych są stosunkowo krótkie.',
      riskLevel: 'medium',
    },
    actionPlan: {
      steps: [
        { order: 1, title: 'Sprawdź termin na działanie', body: 'W sprawach pracowniczych terminy wynoszą często 21 dni. Działaj jak najszybciej.', urgency: 'critical', deadlineDays: 21, deadlineLabel: '21 dni od zdarzenia', canDoAlone: false },
        { order: 2, title: 'Zbierz wszystkie dokumenty', body: 'Umowa, paski wypłat, korespondencja z pracodawcą — każdy dokument jest ważny.', urgency: 'high', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 3, title: 'Skonsultuj sprawę z prawnikiem', body: 'Specjalista prawa pracy oceni Twoje szanse i wskaże najlepszą ścieżkę działania.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: false },
      ],
    },
  },

  rodzina: {
    classification: {
      legalArea: 'prawo_rodzinne',
      caseType: 'sprawa_rodzinna',
      urgencyLevel: 'medium',
      confidence: 0,
    },
    extraction: {
      keyFacts: [{ label: 'Obszar prawa', value: 'Prawo rodzinne' }],
      deadlines: [],
      missingInfo: [],
    },
    summary: {
      safeToAct: true,
      situationType: 'Sprawa rodzinna',
      plainExplanation: 'Twoja sprawa dotyczy prawa rodzinnego. To trudna sytuacja życiowa, ale prawo daje Ci konkretne narzędzia ochrony. Ważne jest, żebyś działał/-a spokojnie i metodycznie.',
      riskLevel: 'medium',
    },
    actionPlan: {
      steps: [
        { order: 1, title: 'Zabezpiecz ważne dokumenty', body: 'Akty stanu cywilnego, dowody, korespondencja — zbierz wszystko w jednym miejscu.', urgency: 'high', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 2, title: 'Oceń, czy potrzebujesz mediacji', body: 'Mediacja może być szybszym i tańszym rozwiązaniem niż sąd w sprawach rodzinnych.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 3, title: 'Skonsultuj się z prawnikiem rodzinnym', body: 'Prawnik pomoże ocenić Twoją sytuację i wybrać najkorzystniejszą drogę.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: false },
      ],
    },
  },

  umowa: {
    classification: {
      legalArea: 'prawo_cywilne',
      caseType: 'spor_umowny',
      urgencyLevel: 'medium',
      confidence: 0,
    },
    extraction: {
      keyFacts: [{ label: 'Obszar prawa', value: 'Prawo cywilne / umowy' }],
      deadlines: [{ description: 'Przedawnienie roszczeń umownych', days: 1095, fromEvent: 'naruszenia umowy' }],
      missingInfo: [],
    },
    summary: {
      safeToAct: true,
      situationType: 'Spór umowny',
      plainExplanation: 'Twoja sprawa dotyczy umowy lub transakcji. Polskie prawo cywilne daje Ci szereg możliwości dochodzenia swoich praw — od reklamacji po postępowanie sądowe. Masz na ogół czas, żeby działać spokojnie.',
      riskLevel: 'low',
    },
    actionPlan: {
      steps: [
        { order: 1, title: 'Przeczytaj dokładnie umowę', body: 'Zwróć uwagę na klauzule dotyczące odpowiedzialności i trybu reklamacji.', urgency: 'high', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 2, title: 'Złóż reklamację na piśmie', body: 'Pisemna reklamacja to podstawa każdego sporu. Zachowaj kopię i potwierdzenie wysłania.', urgency: 'high', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 3, title: 'Oceń drogę sądową', body: 'Jeśli reklamacja nie przyniesie efektu, sąd może zasądzić odszkodowanie lub wykonanie umowy.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: false },
      ],
    },
  },

  mieszkanie: {
    classification: {
      legalArea: 'prawo_nieruchomosci',
      caseType: 'sprawa_mieszkaniowa',
      urgencyLevel: 'medium',
      confidence: 0,
    },
    extraction: {
      keyFacts: [{ label: 'Obszar prawa', value: 'Prawo nieruchomości / najem' }],
      deadlines: [],
      missingInfo: [],
    },
    summary: {
      safeToAct: true,
      situationType: 'Sprawa mieszkaniowa',
      plainExplanation: 'Twoja sprawa dotyczy mieszkania lub nieruchomości. Polskie prawo chroni zarówno najemców jak i właścicieli. Ważne jest, żebyś wszystkie ustalenia miał/-a na piśmie.',
      riskLevel: 'low',
    },
    actionPlan: {
      steps: [
        { order: 1, title: 'Sprawdź treść umowy najmu', body: 'Prawa i obowiązki obu stron powinny być jasno określone w umowie.', urgency: 'high', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 2, title: 'Zgłoś problem pisemnie', body: 'Każdą sprawę zgłaszaj pisemnie (e-mail lub list polecony) — to Twój dowód w razie sporu.', urgency: 'high', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 3, title: 'Zbierz dokumentację', body: 'Zdjęcia, korespondencja, protokoły zdawczo-odbiorcze — wszystko może być dowodem.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
      ],
    },
  },

  sad: {
    classification: {
      legalArea: 'postepowanie_sadowe',
      caseType: 'postepowanie_sadowe',
      urgencyLevel: 'critical',
      confidence: 0,
    },
    extraction: {
      keyFacts: [{ label: 'Obszar prawa', value: 'Postępowanie sądowe' }],
      deadlines: [{ description: 'Odpowiedź na pismo sądowe', days: 14, fromEvent: 'doręczenia' }],
      missingInfo: [],
    },
    summary: {
      safeToAct: true,
      situationType: 'Pismo sądowe / urzędowe',
      plainExplanation: 'Otrzymałeś/-aś pismo sądowe lub urzędowe. Takie pisma mają zwykle krótkie terminy na odpowiedź — często 14 dni. Nie ignoruj pisma, nawet jeśli czujesz się niewinny/-a. Działanie w terminie jest kluczowe.',
      riskLevel: 'high',
    },
    actionPlan: {
      steps: [
        { order: 1, title: 'Sprawdź termin odpowiedzi natychmiast', body: 'Pismo sądowe ma termin — zazwyczaj 14 dni od doręczenia. Sprawdź datę.', urgency: 'critical', deadlineDays: 14, deadlineLabel: '14 dni od doręczenia', canDoAlone: false },
        { order: 2, title: 'Nie ignoruj pisma', body: 'Brak odpowiedzi może skutkować wyrokiem zaocznym lub innymi negatywnymi konsekwencjami.', urgency: 'critical', deadlineDays: null, deadlineLabel: null, canDoAlone: false },
        { order: 3, title: 'Skonsultuj się z prawnikiem dziś', body: 'Sprawa sądowa wymaga fachowej pomocy. Pierwsze 24–48 godzin są najważniejsze.', urgency: 'critical', deadlineDays: null, deadlineLabel: null, canDoAlone: false },
      ],
    },
  },

  inne: {
    classification: {
      legalArea: 'inne',
      caseType: 'sprawa_prawna',
      urgencyLevel: 'medium',
      confidence: 0,
    },
    extraction: {
      keyFacts: [],
      deadlines: [],
      missingInfo: ['Potrzebujemy więcej informacji, żeby dokładnie ocenić sytuację'],
    },
    summary: {
      safeToAct: true,
      situationType: 'Sprawa prawna',
      plainExplanation: 'Twoja sytuacja wymaga dokładniejszej analizy. Masz jednak czas, żeby działać metodycznie. Zalecamy konsultację z prawnikiem, który po krótkiej rozmowie będzie w stanie wskazać Ci konkretne kroki.',
      riskLevel: 'low',
    },
    actionPlan: {
      steps: [
        { order: 1, title: 'Opisz sytuację jak najdokładniej', body: 'Im więcej szczegółów podasz prawnikowi, tym lepsza będzie ocena Twojej sytuacji.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 2, title: 'Zbierz dokumenty związane ze sprawą', body: 'Każda korespondencja, umowy i pisma mogą okazać się ważne.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: true },
        { order: 3, title: 'Umów konsultację z prawnikiem', body: 'Pierwsza konsultacja (15 min) jest bezpłatna i pomoże określić, jakie masz opcje.', urgency: 'normal', deadlineDays: null, deadlineLabel: null, canDoAlone: false },
      ],
    },
  },
};

export function getFallbackOutput(category) {
  return FALLBACKS[category] || FALLBACKS['inne'];
}
