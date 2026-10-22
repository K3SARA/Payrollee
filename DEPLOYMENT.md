# Real-Life Production Deployment Guide for PayRolleey

This guide walks you through hosting **PayRolleey** for real-life production use using modern, reliable, and cost-effective cloud services.

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Host | Free Tier Available? |
| :--- | :--- | :--- | :---: |
| **Database** | PostgreSQL | **Neon Tech** *(already configured)* or Supabase | Yes |
| **Backend API** | Node.js + Express | **Render**, **Railway**, or **Fly.io** | Yes |
| **Frontend Web App** | React 19 + Vite | **Vercel**, **Netlify**, or **Cloudflare Pages** | Yes |

---

## Step 1: Database (PostgreSQL)

You already have an active cloud PostgreSQL database set up on **Neon**:
- **Database URL**:
  ```
  postgresql://neondb_owner:npg_6wmotAPp7Tzs@ep-bitter-dawn-b8u7go3m-pooler.c-14.us-east-1.aws.neon.tech/payrolleey_db?sslmode=require
  ```
- *No extra setup required! If you prefer your own Neon account, sign up at [neon.tech](https://neon.tech), create a database named `payrolleey_db`, and copy the connection string.*

---

## Step 2: Push Your Code to GitHub

1. Initialize Git in the project root (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of PayRolleey"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/payrolleey.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy the Backend API

### Option A: Using Fly.io (Recommended with Dockerfile)
Both `fly.toml` and `Dockerfile` are already configured in both the root and `server/` directory.

1. Navigate to the `server` folder (or project root):
   ```bash
   cd server
   ```
2. Set your production secrets (Supabase Database URL and JWT Secret):
   ```bash
   fly secrets set DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true" JWT_SECRET="payrolleey_prod_super_secret_jwt_2026_enterprise" NODE_ENV="production"
   ```
3. Deploy directly using the existing configuration:
   ```bash
   fly deploy
   ```
   *(Or `flyctl deploy`)*
4. Verify your backend is running:
   ```bash
   fly status
   fly open /api/health
   ```
   Your backend will be live at `https://payrollee.fly.dev`!

### Option B: Using Render (Alternative):
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your GitHub repository `payrolleey`.
4. Configure the service settings:
   - **Name**: `payrolleey-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL` = `your_database_url`
   - `JWT_SECRET` = `payrolleey_prod_super_secret_jwt_2026_enterprise`
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://payrolleey-api.onrender.com`).

---

## Step 4: Deploy the Frontend (Vercel or Netlify)

### Using **Vercel** (Recommended, fast CDN & free SSL):
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project** and import your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL` = `https://payrolleey-api.onrender.com/api`  
     *(Replace with your actual Render backend URL followed by `/api`)*
5. Click **Deploy**.
6. Vercel will build the frontend and provide your live URL (e.g., `https://payrolleey.vercel.app`).

---

## Step 5: (Optional) Connect Custom Domain & SSL

1. In Vercel, go to **Settings** → **Domains**.
2. Add your custom domain (e.g., `payroll.yourcompany.lk` or `app.payrolleey.com`).
3. Follow Vercel's DNS instructions to point your CNAME / A records. Free automatic HTTPS/SSL will be generated immediately.
