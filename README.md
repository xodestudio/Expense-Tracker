# Personal Expense Tracker

A blazing-fast, single-user financial tracking dashboard designed for personal use. Built with a modern full-stack architecture focusing on type-safety, server-side data mutations, and minimal client-side JavaScript.

## 🚀 Tech Stack & Architecture

- **Framework:** Next.js (App Router)
- **Database:** Neon DB (PostgreSQL)
- **ORM:** Prisma v7 (with native PostgreSQL adapter connection pooling)
- **Authentication:** NextAuth.js (Custom single-user credentials provider)
- **Forms & Validation:** React Hook Form + Zod (Strict schema validation)
- **Styling:** Tailwind CSS v4

## 🧠 Core Engineering Decisions

1. **Single-User Security Model:** Avoided bloated OAuth or open registration systems. The app is locked down via Next.js Middleware and NextAuth credentials, accessible only by a single hardcoded admin environment variable.
2. **Atomic Transactions:** Financial data integrity is maintained using Prisma's `$transaction` API. When adding an expense or income, the `Transaction` record creation and the `Account` balance update happen atomically. If one fails, the entire operation rolls back.
3. **Server Actions:** Eliminated the need for separate API routes for form submissions. Data is passed directly from the client form to Next.js Server Actions, validated via Zod, and pushed to the database.
4. **Optimized Queries:** The dashboard limits the transaction feed to the 10 most recent entries using Prisma's `take` parameter, reducing network payload and memory overhead.

## ⚙️ Local Development Setup

Follow these steps to run the project locally:

**1. Clone the repository**
\`\`\`bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
\`\`\`

**2. Install dependencies**
\`\`\`bash
npm install
\`\`\`

**3. Setup Environment Variables**
Create a `.env` file in the root directory and add the following:
\`\`\`env
DATABASE_URL="postgres://your_neon_db_url_here"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_secure_password"
NEXTAUTH_SECRET="generate_a_random_secret_key"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

**4. Generate Prisma Client & Push Schema**
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

**5. Seed the Database**
To create the initial 'Cash' and 'Bank' accounts, run the development server and hit the seed route (if implemented) or use Prisma Studio:
\`\`\`bash
npx prisma studio
\`\`\`

**6. Run the application**
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) with your browser to log in.

## 🌍 Deployment

This application is optimized for Vercel. Ensure all environment variables are properly configured in your Vercel project settings before deploying.
