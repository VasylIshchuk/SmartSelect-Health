## BestChoose

BestChoose is a Next.js (App Router) application using Supabase authentication and role-based dashboards (admin/doctor/patient).

### Tech stack

- **Runtime**: Node.js (recommended **v20+**)
- **Framework**: Next.js **16**
- **UI**: React **19**, Tailwind CSS **v4**, Headless UI, lucide-react
- **Forms**: react-hook-form + zod
- **Charts**: victory
- **Auth/DB**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Notifications**: sonner

### Requirements

- **Node.js**: v20+ (v18 may work, but v20+ is recommended)
- **Package manager**: yarn (recommended), npm, pnpm, or bun
- **Supabase project**: you need a Supabase URL + keys (see env section)
- **Optional**: Supabase CLI (only if you want to run `yarn generate`)

### Environment variables

Create a local env file (recommended: `.env.local`) with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SERVICE_ROLE_KEY=
```

#### Security note (important)

`NEXT_PUBLIC_*` variables are exposed to the browser in Next.js. A **service role key must never be public**.

This project currently reads `NEXT_PUBLIC_SERVICE_ROLE_KEY` (see `src/api/supabaseAdmin.ts`). Treat it as **highly sensitive**:

- **Never commit it**
- **Never use it in client-side code**
- Prefer storing it as a **server-only** variable (not prefixed with `NEXT_PUBLIC_`) and only accessing it from server routes/actions

### How to run (step-by-step)

#### 1) Install dependencies

```bash
yarn
```

#### 2) Configure env

- Create `.env.local`
- Add the required Supabase env vars (above)

#### 3) Start the dev server

```bash
yarn dev
```

Then open `http://localhost:3000`.

### Common scripts

- **Dev**:

```bash
yarn dev
```

- **Lint**:

```bash
yarn lint
```

- **Production build**:

```bash
yarn build
```

- **Start production server** (after build):

```bash
yarn start
```

- **Generate Supabase types** (optional; requires Supabase CLI + project access):

```bash
yarn generate
```

### App structure (high level)

- **Auth / route guards**: `src/components/hoc/`
- **Dashboards**: `src/app/(dashboard)/` + `src/components/dashboards/`
- **Supabase clients**: `src/api/supabase.ts`, `src/api/supabaseAdmin.ts`
- **Hooks**: `src/hooks/`

### Troubleshooting

- **Blank page or auth redirects looping**: double-check your env vars and that Supabase URL/keys match the correct project.
- **Charts show no data**: ensure your database has relevant rows (appointments/reports) and the app has access to read them.
- **`yarn generate` fails**: install and authenticate Supabase CLI, and confirm the project id in the script matches your Supabase project.
