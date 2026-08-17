# Recensioni Smart

SaaS di gestione recensioni: una pagina "gate" per ogni attività cliente (raggiungibile via
card NFC, QR code o link diretto) chiede una valutazione a stelle. Chi dà una valutazione pari
o superiore alla soglia impostata (default 4/5) viene accompagnato a scrivere una recensione
pubblica su Google. Chi dà una valutazione più bassa lascia un feedback privato che arriva solo
al titolare — mai pubblicato — con la possibilità di leggerlo e gestirlo dalla dashboard.

Nasce come base per offrire il servizio a più attività (bar, ristoranti, negozi, studi): ogni
account può gestire più attività, ognuna con la propria pagina pubblica, i propri colori, la
propria soglia e il proprio QR code.

## Nota importante: "review gating"

Instradare selettivamente le recensioni positive verso Google mentre si intercettano quelle
negative in privato è una pratica nota come *review gating*, esplicitamente vietata dalle
linee guida di Google per le recensioni e, dal 2024, anche dalla normativa FTC statunitense
sulle recensioni ingannevoli. Per questo motivo l'app **non blocca mai** la strada pubblica:
anche chi lascia una valutazione bassa trova sempre, subito sotto il modulo di feedback privato,
un link per lasciare comunque una recensione pubblica su Google se lo desidera. Il feedback
privato è pensato come un canale aggiuntivo e più veloce, non come un blocco.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions) — vedi `AGENTS.md`/`CLAUDE.md`: questa
  versione ha diverse convenzioni cambiate rispetto a Next.js "classico" (es. `proxy.ts` al posto
  di `middleware.ts`, generatore Prisma dedicato, Tailwind v4 CSS-first).
- **Tailwind CSS v4**
- **Prisma 7** + **Postgres** (`@prisma/adapter-pg`) — locale in sviluppo, ospitato in produzione
  (pensato per il tier Postgres di Vercel/Neon, vedi sotto)
- **jose** per le sessioni (JWT firmato in cookie httpOnly), **bcryptjs** per le password
- **qrcode** per generare il QR code di ogni attività, lato server

## Setup rapido (prova locale)

Serve un Postgres raggiungibile — locale (`brew install postgresql` / `apt install postgresql`)
o già lo stesso database ospitato che userai in produzione (va benissimo, vedi sezione Deploy).

```bash
npm install
cp .env.example .env
# imposta DATABASE_URL nel .env con la tua stringa di connessione Postgres, poi genera un
# secret e incollalo al posto del placeholder di SESSION_SECRET:
openssl rand -base64 32

npx prisma migrate deploy   # crea le tabelle
npx prisma db seed          # crea un account demo + dati di esempio

npm run dev                 # http://localhost:3000
```

**Login demo** (creato dal seed): `demo@puglianfc.it` / `provalo123` — attività precaricata
*Vulpes Pop Bistrot* con ~20 valutazioni di esempio, così la dashboard non è vuota al primo
accesso. Puoi anche registrare un account nuovo da `/signup`.

Pagina pubblica di prova: `/r/vulpes-pop-bistrot` (aggiungi `?src=qr` o `?src=nfc` per simulare
i due canali).

## Struttura del progetto

```
prisma/schema.prisma          Modello dati (User, Business, ReviewEvent, Feedback)
prisma/seed.ts                Account demo + dati di esempio
src/proxy.ts                  Protezione route /dashboard (solo verifica cookie, niente DB)
src/lib/                      db, sessioni, password, validazione (zod), slug
src/app/page.tsx              / — landing page del SaaS
src/app/login, /signup        Autenticazione (Server Actions)
src/app/dashboard             Area privata: elenco attività, overview, feedback, impostazioni
src/app/r/[slug]              Pagina pubblica "gate" mostrata al cliente finale
```

Ogni pagina sotto `/dashboard/[slug]/*` verifica che l'attività appartenga all'utente loggato
(`getOwnedBusiness`) — nessuna route fida solo del middleware.

## Deploy su Vercel

Il codice è già pronto per Vercel (Postgres invece di un file locale, `prisma migrate deploy`
integrato nella build). I passaggi che seguono si fanno dal sito, con il tuo account:

1. **Importa il repository.** Su [vercel.com](https://vercel.com) → *Add New → Project* → importa
   `PugliaNFC-Pichichero-Giuseppe/-` da GitHub. Se non hai ancora unito questo branch a `main`,
   Vercel lo mostra comunque come *Preview Deployment* quando lo selezioni — non serve fare merge
   solo per vederlo online.
2. **Aggiungi un database Postgres.** Nella scheda *Storage* del progetto → *Create Database* →
   Postgres (Neon). Vercel imposta da solo la variabile `DATABASE_URL` — non serve un altro
   account.
3. **Aggiungi `SESSION_SECRET`.** In *Settings → Environment Variables*, incolla una stringa
   generata con `openssl rand -base64 32`.
4. **Aggiungi `RESEND_API_KEY` e `NOTIFICATION_FROM_EMAIL`** (facoltative — senza, l'app funziona
   lo stesso, semplicemente non manda l'email di avviso sui feedback negativi). Chiave da
   [resend.com/api-keys](https://resend.com/api-keys); `NOTIFICATION_FROM_EMAIL` può restare
   `Recensioni Smart <onboarding@resend.dev>` finché non colleghi un dominio tuo su Resend.
5. **Deploy.** Ogni push su questo branch da qui in poi ricompila automaticamente. La prima build
   applica anche le migrazioni Prisma sul database appena creato (è nello script `build`).
6. **Popola i dati demo (facoltativo, una tantum).** Dal tuo PC, con la `DATABASE_URL` che Vercel
   ti mostra in *Storage* copiata in un `.env` locale:
   ```bash
   npx prisma db seed
   ```
   così l'URL pubblico che ti dà Vercel ha subito dentro l'account demo e i dati di esempio.

Nota sul piano gratuito ("Hobby"): va benissimo per provarla e per un primo cliente di cortesia,
ma i suoi termini escludono l'uso commerciale — quando inizi a farla pagare a più aziende serve
il piano Pro (~20$/mese).

## Comandi utili

```bash
npm run lint         # ESLint
npm run build        # build di produzione (esegue anche il type-check)
npm run db:studio    # Prisma Studio, per ispezionare i dati a occhio
npm run db:migrate   # nuova migrazione dopo una modifica allo schema
```
