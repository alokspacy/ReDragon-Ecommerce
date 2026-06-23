# ReDragon - Modern E-commerce Marketplace

ReDragon is a full-stack e-commerce marketplace branded and developed by **Alok Singh**. The platform allows users to browse products, apply coupons, save multiple shipping addresses, checkout using **Stripe** or **Cash on Delivery (COD)**, register their own seller stores, and manage products and order fulfillment via a dedicated Seller Dashboard. An Admin Panel is also provided to review store applications and monitor system statistics.

---

## Tech Stack & Architecture

- **Frontend (Vercel)**: Next.js 15, React 19, Tailwind CSS v4, Redux Toolkit
- **Backend (Render)**: Node.js, Express, Prisma ORM, PostgreSQL database, Multer, Stripe SDK

---

## Features

1. **JWT User Authentication**: Local login and signup with secure bcrypt password hashing.
2. **Multi-Vendor Store Registrations**: Customers can register a store. Admins must verify and approve applications before products can be listed.
3. **Cart & Address Sync**: Client-side Redux cart states automatically sync to the database in real-time.
4. **Coupon Discounts**: Admin-manageable coupon codes with validations (expiry checks, new-user filters).
5. **Stripe Payments**: Integration with Stripe Billing Checkout sessions and secure Stripe raw Webhooks to update payment status automatically.
6. **Simulated Sandbox Mode**: Out-of-the-box local testing capabilities. If Stripe keys are omitted, the order is routed to a simulation url which calls a mock payment API endpoint to test the checkout flow offline.
7. **Dashboards**:
   - **Seller Dashboard**: Earnings summary, total product/order count, ratings list, add/manage products, toggle inStock, update fulfillment status.
   - **Admin Dashboard**: System-wide revenue charts, store applications verification, coupon managers.

---

## Environmental Variables

### Backend (`/backend/.env`)
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
JWT_SECRET="your_secure_jwt_secret"
CLIENT_URL="http://localhost:3000"

# Stripe Configs (optional for local mock testing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Frontend (`/.env.local`)
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
NEXT_PUBLIC_CURRENCY_SYMBOL="$"
```

---

## Local Development Setup

### Prerequisite
Ensure you have Node.js (v18+) and a running PostgreSQL instance (or Neon / Supabase cloud database link).

### 1. Set Up the Backend
1. Open a terminal and navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database schema and generate Prisma client:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Set Up the Frontend
1. Open a separate terminal in the root directory:
   ```bash
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

---

## Testing Admin & Seller Roles

To test the Admin Panel and Seller Dashboards:
1. Register a user with email `admin@redragon.com`. The system automatically elevates this account to the **Admin** role.
2. Go to `/create-store` as any regular user and submit a store request.
3. Log in as `admin@redragon.com`, navigate to the **Admin Panel** (`/admin`), go to **Approve Stores**, and click **Approve**.
4. Log back in as the store owner, and you will see the **Seller Dashboard** link in the navigation bar. You can now list products, add stock, and fulfill orders!

---

## Deployment Guides

### 1. Backend on Render
1. Connect your GitHub repository to Render.
2. Create a new **Web Service** pointing to your repository.
3. Set the **Root Directory** to `backend`.
4. Configure settings:
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, define:
   - `DATABASE_URL` (Neon or Supabase connection string)
   - `JWT_SECRET`
   - `CLIENT_URL` (your deployed Vercel frontend URL)
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (if utilizing Stripe)

### 2. Frontend on Vercel
1. Import your repository into Vercel.
2. Vercel automatically detects Next.js.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_BACKEND_URL` (pointing to your deployed Render service URL e.g. `https://your-app.onrender.com`)
   - `NEXT_PUBLIC_CURRENCY_SYMBOL` (e.g. `$`)
4. Click **Deploy**.
