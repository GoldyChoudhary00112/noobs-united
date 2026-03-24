# 🎮 Noobs United

> Plan your day with the crew — location, time, game & snacks. All in one place.

## 📁 Project Structure

```
noobs-united/
├── src/
│   ├── App.jsx          # Main app (all screens + Supabase logic)
│   ├── main.jsx         # React entry point
│   └── lib/
│       └── supabase.js  # Supabase client
├── schema.sql           # Database schema (run in Supabase)
├── index.html
├── vite.config.js
├── vercel.json          # SPA routing for Vercel
├── .env.example         # Env template
└── package.json
```

---

## 🛠 Tech Stack

| Layer       | Tech                        |
|-------------|-----------------------------|
| Frontend    | React 18 + Vite             |
| Styling     | CSS Variables (no library)  |
| Fonts       | Google Fonts (Righteous + Nunito) |
| Database    | Supabase (PostgreSQL)       |
| Auth        | Custom (username + password in DB) |
| Real-time   | Supabase Realtime (WebSockets) |
| Hosting     | Vercel                      |

---

## ✨ Features

- 🔐 Signup / Login (username + password)
- ✅ Daily availability toggle
- 📍 Location voting (Football Ground, Cristy Bakery, Temple Park, Roof Top)
- ⏰ Time voting (5 PM / 6 PM / 8 PM)
- 🎮 Game voting (Minecraft / Roblox / Football)
- 🍕 Snacks voting (Gol Gappe / Ice Cream / Cold Drink)
- 🎭 Emoji reactions (👍 😎 🔥 😂)
- 🗒️ Auto-generated final plan summary
- ⚡ Real-time updates across all devices (WebSockets)

---

## 🔒 Security Note

Passwords are stored as plain text — fine for a private friends app.
To upgrade, use `pgcrypto` in Supabase or switch to Supabase Auth.
