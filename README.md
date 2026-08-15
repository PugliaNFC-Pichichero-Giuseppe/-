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
- **Prisma 7** + SQLite (`better-sqlite3` driver adapter) per lo sviluppo/prova locale
- **jose** per le sessioni (JWT firmato in cookie httpOnly), **bcryptjs** per le password
- **qrcode** per generare il QR code di ogni attività, lato server

## Setup rapido (prova locale)

```bash
npm install
cp .env.example .env
# genera un secret e incollalo in .env al posto del placeholder:
openssl rand -base64 32

npx prisma migrate deploy   # crea prisma/dev.db
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

## Deploy in produzione

**Il database SQLite locale (`dev.db`) è pensato solo per sviluppo e prova.** Su piattaforme
serverless come Vercel il filesystem è di sola lettura (a parte `/tmp`, effimero), quindi i dati
non sopravvivrebbero tra una richiesta e l'altra. Prima di andare in produzione, cambia database.
Due strade, entrambe richiedono solo di toccare `prisma/schema.prisma` + `prisma.config.ts` +
`src/lib/db.ts` (query e resto del codice restano invariati):

1. **Turso / LibSQL** — resta SQLite "as-is", ma ospitato. Percorso di migrazione più corto:
   `npm install @prisma/adapter-libsql @libsql/client`, cambiare l'adapter in `src/lib/db.ts`.
2. **Postgres gestito** (Neon, Supabase, Railway…) — `datasource db { provider = "postgresql" }`
   e adapter `@prisma/adapter-pg`. Scelta più tradizionale per un vero SaaS multi-tenant.

Poi: build con `npm run build`, deploy su Vercel (o hosting Node equivalente), variabili
d'ambiente `DATABASE_URL` e `SESSION_SECRET` impostate sulla piattaforma di hosting.

## Comandi utili

```bash
npm run lint         # ESLint
npm run build        # build di produzione (esegue anche il type-check)
npm run db:studio    # Prisma Studio, per ispezionare i dati a occhio
npm run db:migrate   # nuova migrazione dopo una modifica allo schema
```
