# 💕 À Deux

## Stack gratuite
- **Groq** → IA (questions, réflexions, suggestions)
- **Supabase** → Chat temps réel (remplace Firebase, 10x plus simple)
- **Vercel** → Hébergement (transforme ton GitHub en site web)

---

## 🔑 Étape 1 — Clé Groq (2 min)
1. https://console.groq.com → créer un compte
2. **API Keys** → **Create API Key** → copie `gsk_...`

---

## 🗄️ Étape 2 — Supabase (5 min)
1. https://supabase.com → **Start for free** → créer un compte
2. **New project** → nom : `a-deux` → mot de passe (note-le) → **Create**
3. Attends 1 minute que le projet démarre
4. Dans le menu gauche → **SQL Editor** → colle ce SQL et clique **Run** :

```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  sender text not null,
  channel text not null default 'main',
  created_at timestamptz default now()
);

create table animations (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  from_user text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;
alter table animations enable row level security;

create policy "allow all" on messages for all using (true) with check (true);
create policy "allow all" on animations for all using (true) with check (true);

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table animations;
```

5. Menu gauche → **Settings** → **API** → copie :
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public** key → `eyJhbGci...`

---

## 📁 Étape 3 — GitHub (3 min)
1. https://github.com/new → nom `a-deux` → **Create repository**
2. Dans un terminal :
```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/a-deux.git
git push -u origin main
```
3. Sur GitHub → **Settings** → **Secrets and variables** → **Actions** → ajouter :
```
VITE_GROQ_API_KEY       → gsk_...
VITE_SUPABASE_URL       → https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY  → eyJhbGci...
```
(les 3 secrets Vercel viennent à l'étape 4)

---

## 🚀 Étape 4 — Vercel (3 min)

**Vercel = il transforme ton code GitHub en vrai site web sur internet.**
À chaque `git push`, le site est mis à jour automatiquement.

1. https://vercel.com → **Sign up with GitHub**
2. **Add New Project** → importe `a-deux`
3. Dans **Environment Variables**, ajoute les 3 mêmes variables VITE_*
4. **Deploy** → Vercel te donne ton URL : `a-deux-xxx.vercel.app`

Pour les 3 secrets GitHub manquants :
- **VERCEL_TOKEN** → vercel.com → Settings → Tokens → Create
- **VERCEL_ORG_ID** → vercel.com → Settings → General → Team ID
- **VERCEL_PROJECT_ID** → dans ton projet Vercel → Settings → General → Project ID

---

## 💻 Lancer en local
```bash
npm install
cp .env.example .env.local
# Remplis .env.local avec tes vraies clés
npm run dev
# Ouvre http://localhost:5173
```

---

## 📱 Installer comme une vraie app
**iPhone** : Safari → Partager → "Sur l'écran d'accueil"
**Android** : Chrome → Menu → "Installer l'application"

---

## ✏️ Personnaliser
Dans `src/App.jsx` ligne 10-11 :
```js
const MY_NAME  = 'Moi'   // ton prénom
const HER_NAME = 'Lila'  // son prénom
```
