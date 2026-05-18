# Personal Expense Tracker

A fast and secure single-user expense tracking dashboard built for personal finance management. The application uses a modern full-stack architecture with strong type safety, server-side data handling, and minimal client-side JavaScript.

---

## 🚀 Tech Stack & Architecture

- Framework: Next.js (App Router)
- Database: Neon DB (PostgreSQL)
- ORM: Prisma v7
- Authentication: NextAuth.js
- Forms & Validation: React Hook Form + Zod
- Styling: Tailwind CSS v4

---

## 🧠 Core Engineering Decisions

### 1. Single-User Authentication

The application uses a custom credentials-based authentication system with NextAuth.js. Instead of implementing OAuth providers or public registration, access is restricted to a single admin user defined through environment variables.

### 2. Atomic Transactions

Prisma `$transaction` API is used to maintain financial data consistency. Whenever a transaction is created, the account balance update and transaction insertion happen inside a single database transaction. If one operation fails, all changes are rolled back automatically.

### 3. Server Actions

The project uses Next.js Server Actions instead of traditional REST API routes. Form data is submitted directly to server-side functions, validated with Zod schemas, and stored securely in the database.

### 4. Optimized Queries

The dashboard fetches only the latest 10 transactions using Prisma’s `take` parameter to improve performance and reduce unnecessary data transfer.

---

## ⚙️ Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://your_neon_database_url"

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_secure_password"

NEXTAUTH_SECRET="your_generated_secret_key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Push Database Schema

```bash
npx prisma db push
```

### 6. Open Prisma Studio

```bash
npx prisma studio
```

### 7. Run Development Server

```bash
npm run dev
```

---

## 🌍 Deployment

The application is optimized for deployment on Vercel.

Before deployment:

```txt
1. Add all environment variables in Vercel
2. Configure Neon Database
3. Run database migrations
4. Deploy the project
```