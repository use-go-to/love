# 💕 À Deux

App privée pour deux. Chat temps réel, assistant IA, carnet de moments.

---

## 🗄️ Supabase — SQL à coller dans l'éditeur SQL

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

create table moments (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  author text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;
alter table animations enable row level security;
alter table moments enable row level security;

create policy "allow all" on messages for all using (true) with check (true);
create policy "allow all" on animations for all using (true) with check (true);
create policy "allow all" on moments for all using (true) with check (true);

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table animations;
alter publication supabase_realtime add table moments;
```

---

## 🔑 Secrets GitHub à ajouter

Dans ton repo GitHub → **Settings → Secrets and variables → Actions → New repository secret** :

| Nom | Valeur |
|-----|--------|
| `VITE_GROQ_API_KEY` | `gsk_...` (depuis console.groq.com) |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

---

## 🚀 Déploiement GitHub Pages

1. Push ce dossier sur ton repo `a-deux`
2. GitHub → **Settings → Pages → Source → Deploy from a branch → `gh-pages`**
3. GitHub Actions s'occupe du build automatiquement à chaque push
4. Ton site sera sur : `https://TON_PSEUDO.github.io/a-deux/`

---

## ✏️ Personnaliser les prénoms

Dans `src/App.jsx` ligne 8-9 :
```js
const MY_NAME  = 'Moi'   // ← ton prénom
const HER_NAME = 'Lila'  // ← son prénom
```

---

## 💻 Lancer en local

```bash
npm install
cp .env.example .env.local
# Remplis .env.local avec tes vraies clés
npm run dev
# Ouvre http://localhost:5173/a-deux/
```

---

## 📱 Installer comme une vraie app
**iPhone** : Safari → Partager → "Sur l'écran d'accueil"  
**Android** : Chrome → Menu → "Installer l'application"
