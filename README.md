# BoutForge

Boxing bout and fixture management platform for Indian clubs. Built with Expo (mobile), Next.js (web), and Supabase.

## Features

- **Auth**: Email/password sign-up, login, forgot password, invite-based club joining
- **Club management**: Per-club data isolation with role-based access (admin, coach, matchmaker, viewer)
- **Fighters**: CRUD, auto BFI/IBA classification, CSV import, bout history
- **Fixtures**: Progressive knockout brackets with winner advancement, bye handling, round unlocking
- **Results**: Full result entry (KO, TKO, UD, SD, MD, DQ, RSC, NC, Draw) with auto W-L-D updates
- **Events**: Cross-club event creation and multi-club registration
- **Admin**: Platform admin console for clubs and category management

## Monorepo Structure

```
proj/
├── apps/
│   ├── mobile/     # Expo React Native app
│   └── web/        # Next.js web app
├── packages/
│   ├── shared/     # Types, Zod schemas, bracket engine, BFI categories
│   └── api/        # Supabase client and service functions
└── supabase/
    ├── migrations/ # PostgreSQL schema + RLS
    └── functions/  # Edge functions (CSV import)
```

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local backend)
- [Expo CLI](https://docs.expo.dev/) (for mobile)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local:
#   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
#   NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For mobile, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `apps/mobile/.env` or `app.json` extra config.

**Supabase auth URLs** (Dashboard → Authentication → URL configuration):

| Setting | Value |
|---------|--------|
| **Site URL** | `https://bout-forge-web-owh5.vercel.app` (must NOT be localhost in cloud project) |
| **Redirect URLs** | `https://bout-forge-web-owh5.vercel.app/auth/callback` |
| | `https://bout-forge-web-owh5.vercel.app/reset-password` |
| | `http://localhost:3000/auth/callback` (local dev only) |
| | `http://localhost:3000/reset-password` (local dev only) |

If confirmation or reset emails still open `localhost:3000`, the Supabase **Site URL** is wrong — update it in the dashboard (the app now sends the correct `redirect_to` from the browser origin, but Supabase email templates also reference Site URL).

### 3. Start Supabase locally

```bash
npm run db:start          # starts local Supabase (excludes vector on Colima)
npm run db:reset          # reapplies migrations + seed data
```

Copy keys from `npx supabase status` into `apps/web/.env.local` if needed. Local defaults are already in `.env.example`.

**Demo login (seed data):**

| Field | Value |
|-------|-------|
| Email | `coach@mumbaiwarriors.in` |
| Password | `demo123456` |
| Club | Mumbai Warriors Boxing Club |

Seed includes 10 fighters, a 7-fighter knockout bracket (QF complete, SF scheduled), and 2 cross-club events.

### 4. Run web app

```bash
npm run dev:web
```

Open http://localhost:3000

### 5. Run mobile app

```bash
npm run dev:mobile
```

Scan QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

## Deployment

### Web (Vercel)

1. Push repo to GitHub
2. Import project in Vercel, set root to `apps/web`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` — optional on Vercel if unset; browser uses live domain. If set, use production URL only: `https://bout-forge-web-owh5.vercel.app` (**never** `http://localhost:3000`)
4. In Supabase cloud project set **Site URL** to the same production domain and add redirect URLs (see Setup step 2).
5. Deploy

Or use the included `vercel.json`:

```bash
cd apps/web && vercel --prod
```

### Backend (Supabase Cloud)

1. Create a project at https://supabase.com (prefer Mumbai/Singapore region for India)
2. Link and push migrations:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

3. Deploy edge functions:

```bash
npx supabase functions deploy import-fighters
```

4. Set platform admin manually in SQL:

```sql
UPDATE profiles SET is_platform_admin = true WHERE email = 'your@email.com';
```

### Mobile (EAS Build)

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure `apps/mobile/eas.json` with your project ID
3. Build:

```bash
cd apps/mobile
eas build --platform all
```

## Progressive Knockout Bracket (7 fighters example)

Round 1: 3 quarterfinal bouts + 1 bye
Round 2: Winner(Bout1) vs Winner(Bout2), Winner(Bout3) vs bye fighter
Round 3: Final between the two semifinal winners

Winners auto-advance when results are entered.

## CSV Import Format

```csv
name,dob,gender,weight_kg
Rahul Sharma,2008-03-15,male,58
Amit Patel,2009-07-22,male,59
```

## License

Private — All rights reserved.
# boutForge
