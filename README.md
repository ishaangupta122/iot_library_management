# SmartLib

Smart library seat management. ESP32 IR sensors report each seat, and three web interfaces show live availability, kiosk reservations and usage analytics.

Built with Next.js, Tailwind CSS, Recharts and Firebase.

| Page | For |
| --- | --- |
| `/student` | Students: live seats, opening hours, best time to visit |
| `/kiosk` | Library entrance: reserve a seat by scanning or typing a roll number |
| `/admin` | Staff: overview, live monitoring, reservations, analytics, opening hours |

## Setup

1. **Install**
   ```bash
   npm install
   ```
2. **Environment**: copy `.env.local.example` to `.env.local` and fill in the values.
   - `NEXT_PUBLIC_DATA_SOURCE=firestore` for live data, or leave it empty for demo mode.
   - `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`: Firebase console > Project settings > Service accounts > Generate new private key.
3. **Firebase rules**
   - Realtime Database: `sensors` must allow public read (see `firebase/database.rules.json`).
   - Firestore: deploy `firebase/firestore.rules`:
     ```bash
     firebase login
     firebase deploy --only firestore:rules
     ```
4. **Seed students and admins** (one time, or after editing the student list):
   ```bash
   npm run seed
   ```

## Run

```bash
npm run dev        # terminal 1: website at http://localhost:3000
npm run recorder   # terminal 2: records sensor changes for analytics, logs to the console
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the website for development |
| `npm run recorder` | Turn sensor changes into sessions (keep running while the library is open) |
| `npm run seed` | Write the student list and admin emails to Firestore |
| `npm run build` | Check that everything compiles (production build) |
| `npm run start` | Run the production build |

Without hardware, change `sensors/ir1` (0 free, 1 occupied, 2 on a break) by hand in the Firebase console.

## Where things are

| What | File |
| --- | --- |
| Timings and limits (hold length, sessions, history) | `src/config.js` |
| Seat layout, students, demo data | `src/mockData.js` |
| Sensor to seat mapping (`ir1` to Seat A, ...) | `src/lib/sensorMap.js` |
| Seat status rules | `src/lib/seatStatus.js` |
| Opening hours | Admin > Settings (saved in Firebase) |
| Firebase rules | `firebase/` |

## Notes

- Without Firebase keys the app runs in demo mode. Admin login: `admin@smartlib.demo` / `admin123`.
- Only emails in `NEXT_PUBLIC_ADMIN_EMAILS` can open `/admin`.
- Never run a plain `firebase deploy`; it would overwrite the Realtime Database rules.
