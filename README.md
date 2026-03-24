# Art 'n Me

Digital printing services management system built with Next.js and Supabase.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS v4, Shadcn UI, Framer Motion
- **Auth**: Supabase Auth

## Getting Started

### 1. Setup Environment
```bash
cp .env.local.example .env.local
# Update with your Supabase credentials
```

### 2. Database Sync
```bash
pnpm install
pnpm db:push
```

### 3. Development
```bash
pnpm dev
```

## Internal Tools

- **Admin Creation**: `pnpm tsx scripts/create-admin.ts`
- **Drizzle Studio**: `pnpm db:studio`

## Security
Server actions and dashboard routes are protected via Supabase auth sessions and role-based access control. All mutations enforce server-side validation.

## License
Proprietary. See [LICENSE](file:///f:/projects/dev/artnme/LICENSE) for details.
