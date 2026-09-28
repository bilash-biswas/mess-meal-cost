# MessCost — Simple Mess হিসাব, Shared by Everyone

> **মেসের হিসাব, সহজেই সবার জন্য।**  
> A complete, production-grade **Mess Expense Management Web & Mobile Application** built for students, bachelors, and shared messes in Bangladesh—designed to run at **$0 / 0 BDT infrastructure cost** on Vercel Hobby, Firebase Free Tier, and GitHub Releases.

---

## 1. Project Overview

**MessCost** enables multiple roommates living in a shared mess to collaboratively manage their monthly accounting (**হিসাব**) transparently from any mobile phone, installable Android `.APK` / PWA, or desktop browser.

It answers all 10 core mess management questions in real time:
1. **How many days/meals was each member present?** (**Day-Wise Meal System**: `Present = 1`, `Absent = 0` on both a **Full-Month Khata Grid** and a **Single-Day Quick View**)
2. **How much did the mess spend this month?** (`Total Expense = Meal Expense + Other Shared Expense`)
3. **What is the current meal rate?** (`Meal Rate = Total Meal Expense ÷ Total Present Meal-Days`)
4. **How much does each member owe?** (`Meal Cost + Shared Expense Share + Custom Expenses`)
5. **How much has each member already paid?** (**Automatic Payer Credit**: `Total Paid = Products/Bazar Paid by Member + Direct Cash/bKash Deposits`)
6. **Who needs to pay?** (`Due / বকেয়া` balances highlighted in semantic rose badges)
7. **Who should receive money?** (`Receivable / পাওনা` balances highlighted in semantic emerald badges)
8. **What were the expenses & who bought them?** (Searchable, categorized expense ledger with receipt photo attachments and automatic payer attribution)
9. **What were the previous month's accounts?** (Frozen historical snapshots in `/history` that never silently change when closed)
10. **How can roommates join or install the mobile app?** (Built-in **QR Code Generator** for 1-scan Mess Joining, **GitHub Releases Android `.APK` download QR**, and **Installable PWA**)

---

## 2. Key Features

### 🗓️ Day-Wise Meal System (`Present = 1`, `Absent = 0`)
- **Monthly Meal Khata Grid (`Day 1` to `30/31` × `Members`)**:
  - View the entire month's attendance sheet at a glance on `/meals`.
  - Tap any cell to toggle between **`1` (Present)** and **`0` (Absent)**.
  - Quick row actions (`All 1` / `All 0`) to fill a member's entire month in one tap.
  - Shows daily totals across the bottom row and each member's monthly total on the right.
  - Commits all modified days in a single Firestore `writeBatch` to stay well within free-tier limits.
- **Single-Day Quick View**:
  - Switch to Single-Day view anytime to mark attendance for a specific date with `Present (1)` / `Absent (0)` buttons, `Copy Previous Day`, `All Present (1)`, and `All Absent (0)`.

### 🛒 Automatic Product Payer Credit ("Who Adds Expense Pays for the Product")
- **Any active mess member** can click **+ Add Expense** when the month is open.
- **Automatic Payer (`Auto-Credited`)**: Whoever adds an expense is automatically recorded as the payer (`paidBy`) for that product.
- **Instant Balance Credit**: Every product/bazar expense added by a member is automatically credited to their **Paid (`জমা ও বাজার`)** balance:
  $$\text{Total Paid} = \text{Products/Bazar Paid by Member} + \text{Direct Cash Deposits}$$
  $$\text{Member Balance} = \text{Total Cost} - \text{Total Paid}$$
- **Transparent Breakdown**: Dashboard, Payments, and Reports clearly show `Products: ৳X • Deposit: ৳Y` for every member.

### 📱 Mobile App (`.APK` via GitHub + Installable PWA) & QR Code Sharing
- **In-App QR Code & Mobile App Hub (`QR & App` button in Navbar & Members page)**:
  1. **Mess Join QR Code (`মেসে জয়েন QR`)**:
     - Generates a scannable QR code for `<your-domain>/join?code=<INVITE_CODE>`.
     - Roommates scan the QR code with their phone camera → `/join` automatically reads `?code=`, previews the mess, and lets them join in 1 tap.
     - Includes **Download QR Image (PNG)** so you can print and post the QR code on your mess wall or share it in Messenger/WhatsApp.
  2. **Android `.APK` via GitHub Releases (`GitHub APK`)**:
     - Includes an automated GitHub Actions workflow (`.github/workflows/build-android-apk.yml`) that compiles **`MessCost.apk`** in the cloud (no Android Studio needed on your PC) and publishes it to **GitHub Releases** (`releases/latest/download/MessCost.apk`).
     - Displays a scannable QR code and direct **Download `.APK`** button right inside the web app.
  3. **Installable Progressive Web App (`Install App`)**:
     - Equipped with `manifest.json` and Service Worker (`public/sw.js`) for 1-tap **"Install MessCost App Now"** on Android (Chrome/Edge) and **Add to Home Screen** on iPhone (Safari).

### 🔐 Security, Monthly Closing & Smart Settlement
- **Role-Based Access Control (`Owner`, `Admin`, `Member`)**: Enforced both in the UI and via `firestore.rules` & `storage.rules`.
- **Separated Accounting Model**:
  - **Meal Expense (`বাজার খরচ`)**: Included in the monthly Meal Rate calculation.
  - **Other Shared Expense (`ইউটিলিটি ও অন্যান্য বিল`)**: Electricity, Gas, Water, Wi-Fi, Maid/Khala, Cleaning—split via **Equal Split** or **Custom Split**.
- **Receipt Image Compression & Upload**: Client-side HTML5 Canvas WebP compression before uploading to Firebase Storage (`receipts/{messId}/{monthId}/{expenseId}`), with automatic Spark-tier data-URL fallback.
- **Monthly Closing & Audit Trail (`/months` & `/history`)**: Freeze monthly calculations when a month ends (`status: "closed"`), preventing normal edits while allowing Owner/Admin to reopen with audit attribution.
- **Smart Minimum-Transfer Settlement (`/settlement`)**: Greedy net-balance matching algorithm that computes the fewest peer-to-peer transfers (`Member A → Member B ৳500`).

---

## 3. Dashboard & Khata Preview

```text
+-------------------------------------------------------------------------+
| [৳] MessCost — Green View Mess (September 2026)  [OPEN] [QR & App]      |
+-------------------------------------------------------------------------+
| Total Expense: ৳32,450   | Total Meals: 223   | Meal Rate: ৳109.87      |
| My Meals: 26             | My Cost: ৳4,056.62 | My Paid: ৳4,500         |
|                          |                    | (Products: ৳1,500 •     |
|                          |                    |  Deposit: ৳3,000)       |
+-------------------------------------------------------------------------+
| Monthly Meal Khata Grid (Present = 1 • Absent = 0)                      |
| Member   | 01 | 02 | 03 | 04 | 05 | ... | 30 | Quick      | Total       |
| Bilash   |  1 |  1 |  1 |  0 |  1 | ... |  1 | All 1|All 0| 26          |
| Rahim    |  1 |  1 |  1 |  1 |  1 | ... |  1 | All 1|All 0| 28          |
+-------------------------------------------------------------------------+
```

---

## 4. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) + React 19 |
| **Language** | TypeScript (Strict Mode) |
| **Styling & UI** | Tailwind CSS v4 + `shadcn/ui` components + Lucide React Icons |
| **Forms & Validation** | React Hook Form + Zod (`lib/validations/index.ts`) |
| **Authentication** | Firebase Authentication (Email/Password + Google Sign-In) |
| **Database** | Cloud Firestore (Real-time listeners + atomic batch writes) |
| **File Storage** | Firebase Storage (with client-side Canvas WebP compression + Spark fallback) |
| **QR & Mobile App** | Pure ISO/IEC 18004 SVG/Canvas QR Generator (`lib/utils/qrcode.ts`) + PWA + GitHub Actions Android `.APK` |
| **Testing** | Vitest (`tests/calculations.test.ts`, `tests/security.test.ts` — 23 tests) |
| **Hosting** | Vercel Hobby (`*.vercel.app` free domain) |

---

## 5. Architecture & Financial Calculation Engine

All financial calculations are implemented as **pure, deterministic functions** in `lib/calculations/`:
- `lib/calculations/meal-rate.ts`: `roundCurrency`, `calculateDailyMealTotal`, `calculateTotalMeals`, `calculateMealRate`, `calculateMemberMealCost`
- `lib/calculations/member-balance.ts`: `calculateSharedExpense`, `calculateMemberBalance`, `calculateMonthlyAccounting` (automatically credits `expensePaid` to whoever added each expense)
- `lib/calculations/settlement.ts`: `calculateSettlement`

### Rounding Policy
- Currency values are displayed in Bangladeshi Taka (`৳`) and rounded to **2 decimal places** (paisa precision) using `Math.round((value + Number.EPSILON) * 100) / 100`.
- During monthly member cost aggregation, `exactMealRate = totalMealExpense / totalMeals` is used before rounding each member's meal cost so the sum of individual meal costs matches `totalMealExpense` without compounding rounding drift.

---

## 6. Step-by-Step Firebase Setup Guide

Follow these steps to connect your free Firebase project:

1. **Create a Firebase Project**:
   - Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and create a project (e.g., `messcost-bd`).
2. **Enable Authentication**:
   - Go to **Build → Authentication → Sign-in method** and enable **Email/Password** and **Google**.
3. **Create Cloud Firestore Database**:
   - Go to **Build → Firestore Database → Create database** (choose `asia-south1` or `asia-southeast1`).
4. **Publish Firestore Security Rules**:
   - Copy the contents of [`firestore.rules`](./firestore.rules) into **Firebase Console → Firestore Database → Rules** and click **Publish**.
5. **Configure Environment Variables**:
   - Copy `.env.local.example` to `.env.local` and add your Firebase Web App config keys:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
     NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
     ```

---

## 7. Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (http://localhost:3000)
npm run dev

# 3. Run unit & security test suite (23 tests via Vitest)
npm run test

# 4. Run ESLint code quality check
npm run lint

# 5. Build production bundle
npm run build
```

---

## 8. How to Build & Share the Mobile App (`.APK`) via GitHub & QR Code

1. **Push to GitHub & Deploy Web App on Vercel**:
   ```bash
   git init
   git add .
   git commit -m "feat: MessCost web & mobile app with QR sharing"
   git branch -M main
   git remote add origin https://github.com/bilash-biswas/mess-meal-cost.git
   git push -u origin main
   ```
   Import the repo on [vercel.com](https://vercel.com), add your `NEXT_PUBLIC_FIREBASE_*` environment variables, and deploy. Also add your `*.vercel.app` domain to **Firebase Console → Authentication → Settings → Authorized domains**.

2. **Automatic Android `.APK` Build on GitHub Releases**:
   - In your GitHub repo, go to **Settings → Actions → General → Workflow permissions**, select **"Read and write permissions"**, and click **Save**.
   - Open the **Actions** tab → select **Build & Release Android APK (MessCost)** → click **Run workflow** and enter your live Vercel URL (e.g., `https://messcost-bd.vercel.app`).
   - GitHub Actions will automatically build **`MessCost.apk`** and publish it to **GitHub Releases**:
     `https://github.com/bilash-biswas/mess-meal-cost/releases/latest/download/MessCost.apk`

3. **Share via QR Code from Your Website**:
   - Click **`QR & App`** in the top navigation bar of your MessCost web app.
   - Use **Mess Join QR** to let roommates scan and join your mess in 1 tap.
   - Use **GitHub APK** (`bilash-biswas/mess-meal-cost`) to display the QR code that downloads `MessCost.apk` directly from GitHub Releases.
   - Use **Install App** to install the PWA directly to any Android or iPhone Home Screen.
