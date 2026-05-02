# Antriksh - Modern Learning Management System (LMS)

Antriksh is a high-performance, professional LMS platform built for tech-education. It features a seamless student learning experience and a powerful admin management suite.

## 🚀 Key Features

### For Students
- **Course Catalog**: Beautifully designed course listing with search and category filtering.
- **Course Player**: Distraction-free video player with adaptive streaming (via Cloudflare Stream).
- **Progress Tracking**: Automatic lesson completion and real-time progress bars.
- **Student Dashboard**: Quick access to enrolled courses and "Continue Learning" functionality.
- **Razorpay Integration**: Secure, one-click payment and instant course enrollment.

### For Admins
- **Admin Dashboard**: Overview of revenue, active students, and course performance.
- **Course & Module Management**: Create courses and structured modules (sections) via the UI.
- **Cloudflare Video Pipeline**: Direct Creator Uploads from the admin panel with real-time progress bars.
- **Student Management**: View student list and track platform growth.
- **Payment Tracking**: Monitor successful transactions and revenue.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Video Hosting**: Cloudflare Stream
- **Payments**: Razorpay

## ⚙️ Setup & Environment Variables

Create a `.env` file in the root directory and add the following:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
VITE_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_id
CLOUDFLARE_API_TOKEN=your_cloudflare_token
```

## 📦 Deployment Instructions

### 1. Database Migrations
Run the following to set up the database schema and Column naming:
```bash
npx supabase db push
```

### 2. Edge Functions
Deploy the payment and upload functions:
```bash
npx supabase functions deploy create-order
npx supabase functions deploy cloudflare-upload
npx supabase functions deploy webhook
```

### 3. Edge Function Secrets
Set the required secrets for the live functions:
```bash
npx supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... CLOUDFLARE_API_TOKEN=...
```

## 🏗️ Project Structure
- `/src/app/pages`: Core page components (Dashboard, Player, Admin Panel).
- `/src/app/components`: Reusable UI components (Navbar, Sidebar, ProtectedRoute).
- `/supabase/functions`: Backend logic for payments and video uploads.
- `/src/app/lib/supabase.ts`: Supabase client initialization.

---

Built with ❤️ by Antigravity AI