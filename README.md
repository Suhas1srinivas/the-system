# LIFE OS // THE SYSTEM

A cyber-futuristic Solo Leveling-inspired personal life operating system, habit tracker, and career progression engine.

Built for **Suhas S** • 6-Month Protocol (October 5, 2026 ➔ April 1, 2027).

---

## 🚀 Features

- **Rank Evolution System:** Ranks E ➔ S based on discipline, habit adherence, and leveling milestones.
- **7-Day Workout Split Tracker:** Push / Pull / Legs + active recovery tracking with reversible XP.
- **Daily Discipline & Habit Protocols:** 5 AM wake-up, 3L hydration, skincare, clean protein, 8h sleep, and pelvic tilt alignment.
- **Detox Engines:** Real-time counter & bio-recovery monitors for Smoke-Free and Dopamine / Purity.
- **Career Execution Tracks:** 5 core tracks (SNS, Consumo, Company Applications, Excel Mastery, MLOps).
- **Interactive Daily Stats & Calendar Inspector:** Full daily historical matrix and Dear Diary reflections.
- **Stasis Emergency Protocol:** 24-hour stasis lock with urge defusal & physiological reset.
- **Cloud Sync:** Seamless multi-device sync across phone and laptop via Supabase / Firebase.

---

## 📦 How to Push to GitHub

1. Create a new empty repository on your GitHub account (e.g., named `the-system` or `life-os`).
2. Run the following commands in this directory:

```bash
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M main
git push -u origin main
```

3. **Enable GitHub Pages for Free Web Hosting:**
   - Go to your repository on GitHub.
   - Click **Settings** ➔ **Pages** (under Code and automation).
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
   - Your site will automatically build and deploy to: `https://<YOUR-GITHUB-USERNAME>.github.io/<YOUR-REPO-NAME>/`!
   - You can bookmark and add this URL to your phone's home screen as a web app.

---

## ☁️ Cloud Database Sync (Supabase / Firebase)

Your progress is automatically saved to local storage so the app works 100% offline. To sync between your phone and laptop in real time:

### Supabase Setup (Recommended - 100% Free):
1. Create a free account at [supabase.com](https://supabase.com) and create a project.
2. In the Supabase dashboard, go to the **SQL Editor** and run:
   ```sql
   create table if not exists user_state (
     id text primary key,
     data jsonb not null,
     updated_at timestamp with time zone default timezone('utc'::text, now())
   );
   alter table user_state enable row level security;
   create policy "Allow all operations for anon" on user_state for all using (true) with check (true);
   ```
3. Copy your **Project URL** and **anon public key** from Project Settings ➔ API.
4. Click the **Cloud Sync** icon in the app navigation and paste your credentials, or add them to your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. All your task completions, workouts, diary notes, and XP will automatically sync between your phone and PC!
