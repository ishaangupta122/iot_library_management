# SmartLib

Smart library seat management. ESP32 IR sensors report each seat, and three web interfaces show live availability, kiosk reservations and usage analytics.

Built with Next.js, Tailwind CSS, Recharts and Firebase.

| Page | For |
| --- | --- |
| `/student` | Students: live seats, opening hours, best time to visit |
| `/kiosk` | Library entrance: reserve a seat by scanning or typing a roll number |
| `/admin` | Staff: overview, live monitoring, reservations, analytics, opening hours |

## Requirements

- Node.js 24
- A Firebase project with Realtime Database, Firestore and Authentication

## Setup

1. **Install**
   ```bash
   npm install
   ```
2. **Environment**: copy `.env.local.example` to `.env.local` and fill in the values.
   - `NEXT_PUBLIC_DATA_SOURCE=firestore` for live data, or empty for demo mode.
   - `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`: Firebase console > Project settings > Service accounts > Generate new private key.
3. **Firebase rules**
   - Realtime Database: `sensors` must allow public read (see `firebase/database.rules.json`).
   - Firestore:
     ```bash
     firebase login
     firebase deploy --only firestore:rules
     ```
4. **Seed students and admins** (once, or after editing the student list):
   ```bash
   npm run seed
   ```

## Run

```bash
npm run dev        # terminal 1: website at http://localhost:3000
npm run recorder   # terminal 2: records sensor changes for analytics
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the website |
| `npm run recorder` | Turn sensor changes into sessions; keep it running while the library is open |
| `npm run seed` | Write the student list and admin emails to Firestore |
| `npm run sample` | Add labelled sample sessions and reservations for the last 21 days |
| `npm run sample:remove` | Delete all sample data |
| `npm run build` | Check that everything compiles |
| `npm run start` | Run the production build |

Without hardware, change `sensors/ir1` (0 free, 1 occupied, 2 on a break) by hand in the Firebase console.

## Firmware (ESP32)

The sketch is in `firmware/main.cpp` and needs the Firebase ESP Client library.

1. Copy `firmware/secrets.example.h` to `firmware/secrets.h`.
2. Fill in the WiFi details, Firebase API key, database URL and the ESP32's Firebase account.
3. Upload to the board.

`secrets.h` is ignored by git, so passwords never get committed.

## Where things are

| What | File |
| --- | --- |
| Timings and limits (hold length, sessions, admin login) | `src/config.js` |
| Seat layout, students, default hours | `src/mockData.js` |
| Sensor to seat mapping (`ir1` to Seat A, ...) | `src/lib/sensorMap.js` |
| Seat status rules | `src/lib/seatStatus.js` |
| Opening hours | Admin > Settings (saved in Firebase) |
| Firebase rules | `firebase/` |
| ESP32 firmware | `firmware/` |

## Deploying on Vercel

- Add every variable from `.env.local` under Settings > Environment Variables, then redeploy.
- Node.js 24 is set in `package.json`.
- Add the Vercel domain under Firebase > Authentication > Settings > Authorized domains.
- The recorder does not run on Vercel; run it on a computer that stays on.

## Notes

- Without Firebase keys the app runs in demo mode. Admin login: `admin@smartlib.demo` / `admin123`.
- Only emails in `NEXT_PUBLIC_ADMIN_EMAILS` can open `/admin`.
- Never run a plain `firebase deploy`; it would overwrite the Realtime Database rules.
