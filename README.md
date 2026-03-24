# Art 'n Me - Digital Printing Services & Studios

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-0.9.0-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.1-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)

Welcome to the **Art 'n Me** repository! This is the official Next.js web application for Silay City's premier digital printing and corporate giveaway studio. The application features a high-converting customer landing page and a secure, fully-featured internal admin dashboard for managing orders and customer profiles.

## ✨ Features

- **Modern Landing Page**: A fast, responsive, and beautifully animated front-facing site designed to convert leads to inquiries, built with Shadcn UI and Framer Motion.
- **Secure Admin Dashboard**: Role-based access control protecting internal order operations and revenue tracking.
- **Order Tracking & Revenue Analytics**: Monitor pending revenue, active orders, and overdue projects with visual charts.
- **Next.js App Router**: Optimized for latest Next.js 16 Server Components and Server Actions.
- **Drizzle ORM + Postgres**: Type-safe database interactions synchronized with a Supabase PostgreSQL backend.
- **Supabase Authentication**: Reliable and secure user sessions and internal staff access control.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router, Server Actions)
- **Database**: PostgreSQL (via [Supabase](https://supabase.io/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/) & React Hook Form
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 🚀 Getting Started

To run the application locally, follow these instructions:

### Prerequisites

- Node.js > 20.x
- `pnpm` (recommended) or `npm`
- A free [Supabase](https://supabase.com/) account for the database and authentication.

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/artnme.git
cd artnme
pnpm install
```

### 2. Environment Variables
Copy the `.env.local.example` file to create your local environment variables:
```bash
cp .env.local.example .env.local
```
Update `.env.local` with your own Supabase project credentials.

### 3. Database Setup
Push the Drizzle schema to your Supabase PostgreSQL database:
```bash
pnpm db:push
```

*(Optional)* If you need an admin user, execute the initial user creation script:
```bash
pnpm tsx scripts/create-admin.ts
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## 🔒 Security

This application takes security seriously and has been audited for open-source readiness:
- All sensitive database and API credentials are safely injected via environment variables and excluded from source control. 
- Destructive data mutations (such as deleting orders or customers) enforce `requireAdmin()` verifications. 
- The `/dashboard` route and internal server actions are strictly protected using standard Next.js authentication patterns with `updateSession()` middleware and explicit `requireAuth()` server wrappers.
There are **no hardcoded secrets** in this repository.

## 🤝 Contributing

We welcome community contributions! Please feel free to open issues, fork the repository, and submit Pull Requests.
When contributing, please ensure:
- Your code passes `pnpm lint`.
- Your code passes `pnpm build` cleanly.
- You do not commit `.env` or any sensitive configuration files.

## 📄 License

This project is proprietary for Art 'n Me operations. Please refer to `LICENSE` for distribution rights if you intend to reuse the software.
