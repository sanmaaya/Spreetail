# Spreetail — Premium Shared Expenses & Roommate Settlement App

Spreetail is a high-fidelity web application designed to bring visual elegance and mathematical precision to flat-mate finances. Inspired by clean, modern consulting interfaces, it resolves roommate spreadsheets, dynamically manages members with join/leave date bounds, and minimizes settlement transactions.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **PostgreSQL** database (or SQLite depending on local development environment variables)

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd spreetail
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following keys:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/spreetail"
   AUTH_SECRET="your_next_auth_secret_minimum_32_characters"
   ```

4. **Initialize Database Schema & Migrations**:
   Run Drizzle migrations to initialize all tables:
   ```bash
   npm run db:push
   # or running custom migrate scripts
   npm run db:migrate
   ```

5. **Seed Default Roommates Dataset**:
   Seed the database with default roommate members (Aisha, Rohan, Priya, Meera, Sam, Dev) and the `expenses.csv` items:
   ```bash
   npm run db:seed
   ```

6. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js](https://nextjs.org) (App Router, Server Actions, API routes)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) & Vanilla CSS for premium glassmorphism
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Database Engine**: PostgreSQL
- **Security & Auth**: [NextAuth.js v5](https://next-auth.js.org) (Credentials login provider)
- **Visual Analytics**: [Recharts](https://recharts.org) (Fully synced with system theme changes)
- **AI Pairing Partner**: Google DeepMind's Antigravity coding model

---

## 💎 Core Premium Features

1. **Pinterest-Inspired Visual UI**: A beautiful, theme-aware landing page featuring overlapping avatar grids, consulting-style service cards, structured statistics, and a tilted glassmorphism live preview bezel.
2. **Date-Bounded Roommate Residency Math**: Rooms are split dynamically. Roommates who join late (e.g. Sam) or leave early (e.g. Meera) are automatically excluded from splits outside their residency window.
3. **Interactive CSV Import Wizard**: A powerful ingestion engine that flags spelling anomalies, duplicate rows, currency conflicts, and zero/negative costs, letting the user verify and resolve duplicates or conflicts before committing to database.
4. **Transaction Minimization Engine**: An algorithm that simplifies debt matrices, outputting the absolute minimum transfers needed to settle all roommate bills.
5. **Theme Toggle System**: Supports a beautiful default white/light theme alongside a dynamic dark theme, utilizing CSS custom properties and MutationObservers to keep canvas charts fully synchronized.
