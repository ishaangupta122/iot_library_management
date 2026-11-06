# SmartLib: Smart Library Seat Management

Next.js (App Router), JavaScript/JSX, Tailwind CSS, Lucide, Recharts. Static mock data for now; Firebase later.

```bash
npm install
npm run dev     # http://localhost:3000
```

Three interfaces share one data layer:

| Route | Interface |
| --- | --- |
| `/admin` | Admin dashboard: Overview, Live Monitoring, Reservations, Usage Analytics, Settings |
| `/student` | Public student dashboard (live seat availability, no login) |
| `/kiosk` | Walk-up reservation kiosk (`/kiosk?dev` shows the developer tools) |

## Folder structure

```
src/
├── app/
│   ├── layout.jsx, page.jsx, globals.css, icon.svg     root layout, home launcher, styles, favicon
│   ├── admin/
│   │   ├── layout.jsx, page.jsx                         shell + Overview
│   │   ├── monitoring/ reservations/ analytics/         one folder per page (page.jsx + its own parts)
│   │   ├── settings/_components/                        settings sections
│   │   └── _components/                                 sidebar, header, search, feed gate, overview cards
│   ├── student/ (layout.jsx, page.jsx, _components/)
│   └── kiosk/   (layout.jsx, page.jsx, _components/)
├── components/
│   ├── ui/        generic building blocks (Button, Card, Modal, DataTable, ...)
│   ├── seats/     seat visuals shared by admin, student and kiosk (SeatTile, SeatDetails, Chair, SeatStatCard)
│   ├── charts/    Recharts wrappers and chart colors
│   └── SimulationPanel.jsx   dev-only simulator
├── context/LibraryContext.jsx   in-memory data layer and actions (swap for Firebase later)
├── data/mockData.js             single source of truth for all mock data
└── lib/                         pure logic: seatStatus, analytics, utils, navigation, simulation
```

Folders starting with `_` are private to their route and never become URLs.

## Admin login (Firebase Authentication)

`/admin/*` is guarded; signed-out visitors go to `/login`. Student and kiosk pages stay public.

- Sign in with email + password or Google. "Forgot password?" sends Firebase's reset email (the link lets the admin choose a new password).
- Only emails listed in `NEXT_PUBLIC_ADMIN_EMAILS` are admitted; anyone else is signed out immediately.
- Without Firebase keys the app runs in **demo mode**: `admin@smartlib.demo` / `admin123` (no emails are sent).

Setup: copy `.env.local.example` to `.env.local`, fill the Firebase web-app keys, then in the Firebase console enable **Authentication > Sign-in method > Email/Password and Google**, create the single admin user, and (for the email template) edit **Authentication > Templates > Password reset**. The email allowlist is a UI gate only; when the database is added, enforce admin-only writes in its security rules.

## Live data (Firestore + /api routes)

Off by default (the app uses built-in demo data). To switch on:

1. Firebase console > Project settings > Service accounts > **Generate new private key**. Copy `client_email` and `private_key` into `.env.local` as `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (keep the `\n` escapes, wrap in quotes). Never commit this key.
2. Add `SENSOR_API_KEY` (long random string) to `.env.local`.
3. Firestore > Rules: paste `firestore.rules` and Publish (or `firebase deploy --only firestore:rules`).
4. Create the starting data: `node --env-file=.env.local scripts/seed.mjs` (set `SEED_STUDENTS="1024031118:Name,..."` for your students).
5. Set `NEXT_PUBLIC_DATA_SOURCE=firestore` and restart.

Browsers can only read. Writes go through `src/app/api/*` (Firebase Admin SDK): `sensor` (ESP32, header `x-device-key`), `reserve` (kiosk), `settings` (admin token).
Test a sensor without hardware: `node --env-file=.env.local scripts/sensor.mjs DEV-1001 occupied`.

## Key rules
- `src/lib/seatStatus.js` holds the seat-state rules. Status is always derived from the sensor reading and reservations, never stored. Physical occupancy is separate from reservations.
- One active hold per student at a time.
- `NEXT_PUBLIC_ENABLE_SIMULATION=false` hides the dev simulator.
