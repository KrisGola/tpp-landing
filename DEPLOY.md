# Deploy — landing-v2.html → produkcja

## Branch: `deploy/landing-v2`

Ten branch zawiera wersję strony gotową do wdrożenia na twojapomocprawna.pl.

---

## Co wdrożyć

Plik: **`landing-v2.html`**

Przed deploy'em zmień nazwę na `index.html` (lub skonfiguruj serwer tak, żeby serwował `landing-v2.html` jako stronę główną).

---

## Checklist przed wdrożeniem

- [ ] Zmienić `href="#"` przy logo na `href="/"`
- [ ] Podpiąć prawdziwy formularz waitlisty (sekcja `#lista`) — aktualnie obsługiwany przez JS w pliku, zamienić na endpoint API lub np. Mailchimp / ConvertKit
- [ ] Dodać prawdziwy URL do przycisku "Zaloguj się" (panel prawnika)
- [ ] Uzupełnić linki w stopce (Regulamin, Prywatność, Cookies, RODO)
- [ ] Dodać `<link rel="icon">` z favicon
- [ ] Ustawić właściwy `og:image` w meta tagach (linia 9–11)
- [ ] Sprawdzić czy Google Fonts ładuje się poprawnie na domenie produkcyjnej

---

## Jak zmergować do main (po akceptacji)

```bash
git checkout main
git merge deploy/landing-v2 --no-ff -m "Merge deploy/landing-v2 → main"
```

---

## Kontakt

Pytania do Krisa: kr.golaszewski@gmail.com
