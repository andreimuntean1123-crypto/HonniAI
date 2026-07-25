# Honni AI

**Gastronomie și alimentație personalizată** — o aplicație completă Next.js cu trei agenți AI
specializați, căutare de rețete, analiza fotografiilor cu mâncare, planificator alimentar,
bucătăriile lumii, listă de cumpărături și profil de utilizator.

Interfața este disponibilă în **română (implicit), rusă și engleză**, cu temă luminoasă,
întunecată și „tema sistemului”.

> Aplicația funcționează complet și **fără nicio configurare** (mod demonstrativ).
> Adăugarea unei chei API activează răspunsurile reale ale agenților.

---

## 1. Instalare rapidă

```bash
npm install
cp .env.example .env.local     # opțional — vezi secțiunea 2
npm run dev                    # http://localhost:3000
```

Comenzi disponibile:

| Comandă             | Ce face                                       |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | server de dezvoltare                          |
| `npm run build`     | build de producție                            |
| `npm run start`     | rulează build-ul de producție                 |
| `npm run typecheck` | verificare TypeScript, fără emitere de fișiere|

Cerințe: **Node.js 18.18+** (recomandat 20 sau 22).

---

## 2. Unde se introduce cheia API

Cheia **nu se pune niciodată în cod și nu ajunge în browser**. Toate cererile către modelul AI
trec prin rute server-side din `src/app/api/*`.

1. Copiază `.env.example` în `.env.local` (fișierul este deja în `.gitignore`).
2. Completează cheia:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...          # cheia ta din https://console.anthropic.com
ANTHROPIC_MODEL=claude-sonnet-5       # model pentru chat
ANTHROPIC_VISION_MODEL=claude-sonnet-5 # model pentru analiza imaginilor
```

3. Repornește serverul (`npm run dev`).

În **Setări → Stare API AI** vezi imediat dacă aplicația rulează „Conectat” sau în
„Mod demonstrativ”.

### Varianta fără configurare: cheia din interfață

Nu e obligatoriu să pui cheia în server. Oricine deschide site-ul poate folosi **cheia lui**:

1. deschizi asistentul (butonul plutitor) → apeși pe **iconița de cheie** din antet
   (sau **Setări → Cheia ta API**);
2. lipești cheia și salvezi.

Cheia:

- rămâne **doar în browserul acela** — nu în contul tău, nu în baza de date, nu în
  documentul care se sincronizează între dispozitive (are propriul loc de stocare);
- se trimite la fiecare cerere doar ca antet, serverul o folosește pentru acel apel și o
  uită imediat — nu o scrie nicăieri și nu o afișează în loguri;
- se poate șterge oricând din aceeași fereastră, iar în interfață apare mascată
  (`sk-ant-…4f2a`).

Dacă vrei ca site-ul să funcționeze pentru toți vizitatorii fără să-și aducă propria cheie,
pune `ANTHROPIC_API_KEY` în variabilele de mediu (Vercel → Settings → Environment Variables,
apoi Redeploy). Cheia din interfață are prioritate față de cea din server.

### Alt furnizor (opțional)

Dacă preferi un API compatibil OpenAI, lasă `ANTHROPIC_API_KEY` gol și completează:

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### Conturi și sincronizare între dispozitive (opțional)

Autentificarea se face cu **email și parolă** — nu există login prin Google.

Fără nicio configurare, contul și datele lui rămân **în browserul curent**. Ca să ai
aceleași favorite, planuri, istoric și listă de cumpărături pe telefon și pe calculator,
conectează o bază de date KV (Redis):

**Pe Vercel** — Storage → Marketplace → *Upstash Redis* → Connect Project. Vercel adaugă
singur variabilele; după aceea dă **Redeploy**.

**Local sau alt hosting** — pune în `.env.local`:

```bash
KV_REST_API_URL=https://....upstash.io
KV_REST_API_TOKEN=...
```

Ce se schimbă când există baza de date:

| | Fără KV | Cu KV |
| --- | --- | --- |
| Cont | doar în acest browser | pe server, valabil de pe orice dispozitiv |
| Parole | hash SHA-256 local | hash scrypt cu sare, pe server |
| Sesiune | localStorage | cookie httpOnly, 30 de zile, invalidat la deconectare |
| Favorite, planuri, istoric | per dispozitiv | sincronizate automat |

Sincronizarea rulează în fundal (scriere amânată ~1 secundă) și rezolvă conflictele după
ultima modificare: dacă alt dispozitiv a salvat ceva mai nou, versiunea aceea este păstrată
și adusă înapoi în loc să fie suprascrisă. Starea apare în **Setări → Sincronizare între
dispozitive**.

## 3. Modul demonstrativ

Dacă nu există cheie API, aplicația **nu se blochează**: fiecare funcție are un răspuns
demonstrativ real, în limba selectată.

| Funcție               | Comportament fără cheie API                                        |
| --------------------- | ------------------------------------------------------------------ |
| Chat (3 agenți)       | răspunsuri structurate, pregătite în avans, cu marcaj „mod demo”    |
| Analiza fotografiei   | analiză completă demonstrativă (valori, beneficii, recomandări)     |
| Plan alimentar        | plan generat local din biblioteca de rețete, cu calcul BMR/TDEE real|
| Generare rețetă cu AI | întrebarea este preluată de agentul culinar                         |
| Rețete, filtre, listă | complet funcționale (28 de rețete și 16 bucătării incluse)           |

Conținutul demonstrativ apare **doar** când nu există cheie API. Dacă o cerere reală
eșuează, aplicația spune că a eșuat — nu prezintă un răspuns pregătit în avans ca și cum ar
fi analiza fotografiei tale.

---

## 4. Structura proiectului

```
src/
├─ app/
│  ├─ layout.tsx              # shell: providers, header, footer, bară mobilă, splash
│  ├─ page.tsx                # pagina principală (hero + secțiuni)
│  ├─ recipes/                # căutare rapidă: grup → categorie → rezultate
│  ├─ analyze/                # încărcare + analiză foto și agentul de nutriție
│  ├─ planner/                # formular și plan alimentar editabil
│  ├─ cuisines/               # listă bucătării + pagină /cuisines/[slug]
│  ├─ shopping-list/          # listă pe categorii, export, print, share
│  ├─ favorites/              # favorite și tot istoricul
│  ├─ profile/  settings/     # profil, preferințe, temă, limbă, datele mele
│  └─ api/                    # rute server-side (chat, analyze, plan, recipe, status)
├─ components/
│  ├─ brand/                  # logo (SVG transparent, urmează tema)
│  ├─ layout/                 # header, footer, bară mobilă, splash, titluri de pagină
│  ├─ providers/              # temă, i18n, toast, autentificare, date
│  ├─ chat/                   # ChatPanel + ChatDock (butonul plutitor)
│  ├─ recipes/                # card, detaliu, panou de filtre
│  ├─ auth/                   # modal de autentificare + onboarding
│  └─ ui/                     # Modal, Markdown, FoodArt, TagInput, skeletons…
├─ data/                      # rețete (mâncăruri + băuturi) și bucătării, în 3 limbi
├─ i18n/                      # dicționarele ro / ru / en
├─ hooks/                     # Web Speech API (dictare + citire cu voce)
├─ lib/                       # tipuri, nutriție, prompturi agenți, demo, storage
└─ config/brand.ts            # numele produsului, tagline, culoare, prefix stocare
```

---

## 5. Cei trei agenți AI

Prompturile de sistem sunt în `src/lib/agents.ts`:

| Agent                    | Specializare                                                           |
| ------------------------ | ---------------------------------------------------------------------- |
| **Chef AI**              | rețete, tehnici, înlocuiri, porții, listă de cumpărături               |
| **Nutrition Planner AI** | planuri alimentare și interpretare orientativă a valorilor nutritive   |
| **World Cuisine AI**     | meniuri autentice, preparate tradiționale, context cultural            |

Toți primesc automat **contextul utilizatorului** — un text generat din preferințele salvate
(vezi `src/lib/profileContext.ts`), de exemplu:

> „Utilizatorul nu consumă arahide, nu îi plac ciupercile, preferă bucătăria italiană și
> moldovenească, dorește să crească în greutate și preferă rețete care se pregătesc în maximum
> 40 de minute.”

Textul este vizibil în **Profil**, iar agenții au instrucțiunea explicită de a folosi doar
părțile relevante pentru întrebarea curentă.

Toți agenții respectă aceleași reguli de siguranță: nu oferă diagnostic medical, nu recomandă
diete extreme și trimit către un specialist în situații sensibile (minori, sarcină, alergii
severe, afecțiuni medicale).

---

## 6. Funcții principale

- **Căutare rapidă de rețete** — două grupuri (mâncăruri / băuturi), 18 categorii, căutare
  fără diacritice, filtre pentru timp, calorii, dificultate, dietă, buget, bucătărie, masă și
  ingredientele pe care le ai acasă.
- **Detaliu rețetă** — imagine, timpi, dificultate, porții ajustabile (cantitățile se
  recalculează), valori nutritive, pași, sfaturi, alergeni, alternative, variantă mai sănătoasă,
  plus butoane pentru favorite, plan alimentar, listă de cumpărături și întrebări către agent.
- **Analiza fotografiei** — încărcare, drag & drop sau cameră, previzualizare, ștergere,
  analiză cu nivel de încredere, valori estimate, beneficii, aspecte de urmărit, scor nutrițional
  și recomandări. Istoricul păstrează miniaturi locale.
- **Planificator alimentar** — formular complet, calcul BMR/TDEE (Mifflin–St Jeor), plan pe o zi
  sau o săptămână, alternative, înlocuire/editare/regenerare per masă, export și tipărire,
  plus chat pentru modificări („fă planul mai ieftin”, „nu-mi place somonul”).
- **Bucătăriile lumii** — 16 bucătării cu ingrediente specifice, preparate reprezentative și
  context cultural, fiecare cu agentul de meniuri alături.
- **Listă de cumpărături** — grupare pe raioane, combinarea automată a cantităților duplicate,
  bifare, editare, export, tipărire și partajare.
- **Favorite și istoric** — rețete, planuri, bucătării explorate, analize, conversații, căutări,
  cu sortare și ștergere.
- **Voce** — dictare și citirea răspunsurilor prin Web Speech API, cu buton de oprire.
  Funcțiile se ascund automat pe browserele care nu le suportă.

---

## 7. Securitate și confidențialitate

- Cheia API rămâne pe server; browserul vorbește doar cu `/api/*`.
- Validare pe server pentru: tipul fișierului (JPG/PNG/WEBP), dimensiunea imaginii
  (`MAX_IMAGE_MB`), structura mesajelor, formularul planificatorului și răspunsurile modelului
  (fiecare câmp este normalizat și limitat înainte de a ajunge în interfață).
- **Limitare de cereri** per IP (`AI_RATE_LIMIT_REQUESTS` / `AI_RATE_LIMIT_WINDOW_SECONDS`),
  cu mesaje clare de eroare în interfață.
- Răspunsurile agenților sunt randate cu un parser Markdown propriu, fără `innerHTML`.
- Datele personale (preferințe, alergii, planuri, istoric) sunt stocate **local, pe dispozitiv**,
  separat pentru fiecare cont. În **Setări** poți exporta datele sau șterge selectiv istoricul,
  conversațiile, analizele — sau contul complet.
- Parolele conturilor locale sunt stocate doar ca hash SHA-256.

Pentru producție cu utilizatori reali, înlocuiește stratul local cu Firebase/Supabase:
`AuthProvider` și `DataProvider` sunt singurele fișiere care trebuie modificate.

---

## 8. Personalizarea brandului

Numele, tagline-ul și culoarea se schimbă dintr-un singur loc:

- text și identitate → `src/config/brand.ts` (sau variabila `NEXT_PUBLIC_APP_NAME`)
- logo → `src/components/brand/Logo.tsx` + `flamePaths.ts` (SVG transparent, moștenește culoarea
  temei prin `currentColor`)
- paleta → variabilele CSS `--brand-*` din `src/app/globals.css`
- favicon → `public/icon.svg`

---

## 9. Tehnologii

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion ·
lucide-react · Web Speech API · rute server-side pentru AI (Anthropic sau API compatibil OpenAI).

---

## 10. Notă importantă

Informațiile nutriționale, analizele fotografiilor și planurile alimentare sunt **orientative**.
Nu înlocuiesc consultul unui medic sau nutriționist.
