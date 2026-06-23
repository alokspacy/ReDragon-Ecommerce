<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=280&color=0:991b1b,50:dc2626,100:f87171&text=ReDragon&fontColor=ffffff&fontSize=65&animation=fadeIn&fontAlignY=40"/>
</p>

<p align="center">
  <h1 align="center">🐉 ReDragon</h1>
  <p align="center">
    Multi-Vendor E-Commerce Marketplace
  </p>
  <p align="center">
    Dynamic Cart Syncing • PostgreSQL & Prisma • Multi-Vendor Management • Razorpay Integration
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/alokspacy/ReDragon-Ecommerce?style=for-the-badge">
  <img src="https://img.shields.io/github/forks/alokspacy/ReDragon-Ecommerce?style=for-the-badge">
  <img src="https://img.shields.io/github/license/alokspacy/ReDragon-Ecommerce?style=for-the-badge">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-Frontend-black?style=flat-square&logo=next.js">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=flat-square&logo=node.js">
  <img src="https://img.shields.io/badge/Express.js-API-black?style=flat-square&logo=express">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat-square&logo=postgresql">
  <img src="https://img.shields.io/badge/Prisma-ORM-indigo?style=flat-square&logo=prisma">
  <img src="https://img.shields.io/badge/Razorpay-Payments-blue?style=flat-square&logo=razorpay">
</p>

---

# 📖 Overview

**ReDragon** is a full-stack multi-vendor e-commerce marketplace branded and developed by **Alok Singh**. The platform allows users to browse products, apply discount coupons, save multiple shipping addresses, checkout using secure **Razorpay** payments or **Cash on Delivery (COD)**, register their own seller stores, and manage products and order fulfillment via a dedicated Seller Dashboard. 

An Admin Panel is also provided to review store applications, monitor system statistics, and manage platform coupons.

---

# ✨ Features

| Feature | Description |
|:---|:---|
| 🔑 **JWT Authentication** | Local login and signup with secure bcrypt password hashing and session authorization. |
| 🐉 **Multi-Vendor Store** | Regular users can submit a store request. Approved stores can list and sell products on the platform. |
| 🔄 **Cart & Address Sync** | Client-side Redux cart states automatically sync to the PostgreSQL database in real-time. |
| 🎟️ **Coupon System** | Admin-manageable coupon codes with validations (expiry checks, new-user filters). |
| 💳 **Razorpay Checkout** | Fully integrated Razorpay checkout flows supporting both live key verification and offline simulation. |
| 🛠️ **Simulated Sandbox Mode** | Out-of-the-box local testing capabilities. When keys are omitted, checkouts route to local mock APIs. |
| 📊 **Seller Dashboard** | Earnings summary, total product/order count, ratings list, add/manage products, toggle inStock, update fulfillment status. |
| 👑 **Admin Dashboard** | System-wide revenue charts, store applications verification, coupon managers. |

---

# 🏗 Architecture

```
┌──────────────────────────────────────┐
│             Web Frontend             │
│        Next.js 15 / Redux RTK        │
└──────────────────┬───────────────────┘
                   │ HTTP / API Requests
                   ▼
┌──────────────────────────────────────┐
│           Node.js Backend            │
│         Express Server / JWT         │
└──────────────────┬───────────────────┘
         ┌_________┴_________┐
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │    Razorpay     │
│   Prisma Client │ │ Payment Gateway │
└─────────────────┘ └─────────────────┘
```

## Frontend
- **Next.js 15**: React 19 App Router & Server actions
- **Redux Toolkit**: Client-side cart sync, session handling, and store states
- **Tailwind CSS**: Modern, elegant, fully responsive designs with ReDragon's crimson red theme accents
- **Axios & JWT**: Clean service integrations and token managers

## Backend
- **Node.js**: Asynchronous backend server
- **Express.js**: REST API controllers and middleware routers
- **Prisma ORM**: Relational schema handling and fluent queries
- **Multer**: Static product photo upload handling
- **Crypto & HMAC-SHA256**: Secure verification of Razorpay webhooks and hashes

## Database
- **PostgreSQL**: Managed Neon PostgreSQL cluster with relational database structure

```
ReDragon-Ecommerce
├── backend
│   ├── controllers        # Request handlers & logic (Auth, Orders, Coupons, Products, Stores)
│   ├── middleware         # JWT & role verification filters
│   ├── prisma             # Schema file (`schema.prisma`) & database seed scripts
│   ├── uploads            # Static assets and product image uploads
│   ├── .env.example       # Example environment configuration
│   ├── server.js          # API entry point & configuration
│   └── package.json       # Backend dependencies & script tasks
│
└── frontend
    ├── app                # Next.js App Router (Public routes, User panel, Admin panel, Seller dashboard)
    ├── assets             # Brand logos & static site graphics
    ├── components         # Shared UI controls (Navbar, Footer, OrderSummary, Charts)
    ├── lib                # Core API routing client definitions
    └── package.json       # Frontend dependencies & next tasks
```

---

# 🚀 Getting Started

## Environmental Variables

### Backend Configuration (`/backend/.env`)
Create a `.env` file in the `/backend` directory:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
JWT_SECRET="your_secure_jwt_secret"
CLIENT_URL="http://localhost:3000"

# Razorpay Configs (Fallback to simulation if keys are missing)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_secret_..."
```

### Frontend Configuration (`/frontend/.env.local`)
Create a `.env.local` file in the `/frontend` directory:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```

---

## Installation & Setup

### Clone Repository
```bash
git clone https://github.com/alokspacy/ReDragon-Ecommerce.git
cd ReDragon-Ecommerce
```

### 1. Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database schema and generate Prisma client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Run the seed script to populate default admin, products, and images:
   ```bash
   npx prisma db seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Set Up the Frontend
1. Open a new terminal in the root directory and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at `http://localhost:3000`.

---

## 🛠️ Testing Admin & Seller Roles
1. **Register Admin**: Register a user with email `admin@redragon.com`. The system automatically elevates this account to the **Admin** role.
2. **Submit Store Request**: Go to `/create-store` as any regular logged-in customer and submit a store registration form.
3. **Approve Store**: Log in as `admin@redragon.com`, navigate to the **Admin Panel** (`/admin`), and approve the store request under the **Approve Stores** tab.
4. **Seller Dashboard**: Log back in as the store owner. You will now see the **Seller Dashboard** link in your account menu, allowing you to list products, manage inventory, and fulfill orders!

---

## 👥 Support & Contact
- **Developer/Brand**: Alok Singh
- **GitHub**: [alokspacy](https://github.com/alokspacy)

If you found this project useful, please consider giving it a star.

⭐ Star the repository to support future development.

Built with ❤️ using Next.js, Express, and PostgreSQL
© 2026 ReDragon
