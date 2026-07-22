# Art 'n Me

A premium digital printing services management system and interactive customer portal for Art 'n Me. Built to streamline shop operations and provide an immersive, high-fidelity experience for customers.

## Key Features

- **3D Interactive Customizer**: A fully-featured 3D shirt configurator built with React Three Fiber. Customers can select base colors, upload graphics, add text, spin the model 360°, and export their custom designs directly for a quote.
- **Customer Portal**: High-performance landing pages showcasing digital printing services (Direct-to-Film T-Shirts, Mugs, Full Sublimation Jerseys), a dynamic portfolio gallery, and a streamlined quote request flow.
- **Admin Dashboard**: Secure, role-based administration area to manage customer quotes, active projects, and system users.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **3D Engine**: Three.js, React Three Fiber, Drei
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **UI & Animation**: Tailwind CSS v4, Shadcn UI, Framer Motion
- **Auth**: Supabase Auth
- **Media**: Cloudinary

## Getting Started

### 1. Setup Environment
```bash
cp .env.example .env.local
# Fill in your Supabase, database, and Cloudinary credentials
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
Server actions and dashboard routes are protected via Supabase auth sessions and role-based access control. All mutations enforce strict server-side validation.

## License
Proprietary. See [LICENSE](./LICENSE) for details.
