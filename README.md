# Flat Routine, Mess & Maid Expense Tracker 🍽️🧹

A modern, mobile-first web application designed for flatmates and roommates to track daily meals (Lunch & Dinner), Maid attendance with salary calculations, custom topics, and end-of-month expense splitting.

## Key Features

- **GMT +5:30 (IST) Midnight Auto-Reset**: Daily checkmarks naturally advance at 12:00:00 AM IST without deleting historical data.
- **3-Plate Meal Ticks for Guests**:
  - `Tick 1`: Self plate
  - `Tick 2`: +1 Guest plate (2 plates total)
  - `Tick 3`: +2 Guest plates (3 plates total)
- **Maid Presence & Salary Accumulation**:
  - Starts at **₹0** (no pre-charged lump sum) and accumulates on a per-day basis like tiffin.
  - Takes **Monthly Salary** $\div$ total days in month (30 or 31).
  - **First 4 absent days are free / paid leaves**.
  - **5th absent day onwards is not counted** (adds ₹0 payment or split).
- **End-of-Month Bill Split & Analysis**:
  - Exact breakdown of total lunches, dinners, guest meals, and maid share per flatmate.
- **WhatsApp 1-Click Summary**:
  - Generates ready-to-send formatted text with emojis for flatmate WhatsApp groups.
- **Real-Time Multi-Phone Synchronization**:
  - Built with dual storage: runs local-first immediately and syncs live across all phones via Supabase WebSockets.

## Tech Stack
- **Next.js 15 (App Router)**
- **Vanilla CSS Design System** (Dark glassmorphism, responsive mobile-first)
- **Supabase PostgreSQL & Realtime Channels**
- **Deployed on Vercel**
