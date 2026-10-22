# PayRolleey — Sri Lanka 2026 Enterprise Payroll Management System

A modern, high-resolution, full-stack web-based Payroll Management System built for Sri Lankan statutory compliance (2026 Inland Revenue Department APIT & EPF/ETF standards).

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC) & Data Isolation
- **`HR_ADMIN`**: Full administrative access to the global dashboard, employee directory with CRUD operations, leave request approvals, real-time payroll execution engine, and historical company financial ledgers.
- **`EMPLOYEE`**: Self-service portal strictly isolated to personal compensation details, personal attendance/timesheet logs, leave applications, and individual historical payslips. Unauthorized administrative route access is blocked with HTTP 403 protection.
- **1-Click Persona Switcher**: Seamlessly switch between HR Admin (`admin@payrolleey.lk`) and sample employees (`kasun.perera@...`, `dinithi.fernando@...`, `nuwan.silva@...`, `anjali.wickramasinghe@...`) in the top navigation bar.

---

### 2. Sri Lanka 2026 Statutory Payroll Engine

#### A. EPF & ETF Deductions & Contributions
| Statutory Component | Rate | Paid By | Description |
| :--- | :---: | :---: | :--- |
| **Employee EPF** | **8.0%** | Employee | Deducted directly from Gross Earnings |
| **Employer EPF** | **12.0%** | Employer | Company contribution (not deducted from employee) |
| **Employer ETF** | **3.0%** | Employer | Company contribution (not deducted from employee) |
| **Total Employer Overhead** | **15.0%** | Employer | **Cost to Company (CTC) = Gross Salary + 15%** |

#### B. Inland Revenue Department (IRD) APIT (PAYE) Tax Engine
1. **Taxable Monthly Income** = `Gross Earnings − Employee EPF (8%)`
2. **Monthly Tax-Free Personal Relief** = **LKR 150,000.00**
3. Progressive monthly tax bands applied to excess taxable income:
   - **First LKR 83,333.33** at **6%**
   - **Next LKR 41,666.67** at **18%**
   - **Next LKR 41,666.67** at **24%**
   - **Next LKR 41,666.67** at **30%**
   - **Any remaining balance** at **36%**

---

### 3. Core Modules
- **Admin Executive Dashboard**: Real-time cards for Total Payroll Cost (CTC), Active Employees, Pending Leaves, and Upcoming Payroll Date. Department expense breakdown bar chart and leave quick-approvals.
- **Employee Directory**: High-DPI avatars, search by name/NIC/TIN, department filter pills, full CRUD modals, and detailed profile inspection.
- **Attendance & Leave Management**: Daily check-in/out hours logging, overtime calculation (1.5x rate), and leave approval workflow with review notes.
- **Payroll Processing Engine**: Period selector (Monthly, Bi-weekly, Weekly), real-time dynamic additions (bonuses, allowances) & deductions (unpaid leave days, medical), instant APIT band inspector modal, and execution locking.
- **Payslips & Reporting**: Auto-generated payslips with distinct separation between Employee Deductions and Employer Contributions, Cost to Company reporting, and browser print/PDF export (`window.print()`).

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Vite.
- **Backend**: Node.js, Express.js REST API, JWT authentication, bcryptjs.
- **Database & ORM**: PostgreSQL (hosted on Neon Cloud) with Prisma ORM.

---

## 🚀 Running Locally

### Option A: One-Command Startup (From the Project Root)
From the root folder (`PayRolleey`):
```bash
npm run dev
```
*This starts both the backend API (`http://localhost:5000`) and the frontend client (`http://localhost:5173`) concurrently.*

---

### Option B: Running in Separate Terminals

#### Terminal 1 — Backend Server (`server/`):
```bash
cd server
npm start
```
*Runs on `http://localhost:5000`*

#### Terminal 2 — Frontend Client (`client/`):
```bash
cd client
npm run dev
```
*Runs on `http://localhost:5173`*

---

## 🔑 Demo Login Accounts

All accounts use the password: `password123`

| Email | Role | Designation | Monthly Base (LKR) | Tax Bracket Exercised |
| :--- | :---: | :--- | :---: | :---: |
| `admin@payrolleey.lk` | `HR_ADMIN` | Head of People & Culture | Rs. 380,000.00 | Higher brackets |
| `kasun.perera@payrolleey.lk` | `EMPLOYEE` | Lead Full-Stack Engineer | Rs. 450,000.00 | Top 36% Marginal |
| `dinithi.fernando@payrolleey.lk` | `EMPLOYEE` | Senior Product Designer | Rs. 240,000.00 | Intermediate brackets |
| `nuwan.silva@payrolleey.lk` | `EMPLOYEE` | Finance Specialist | Rs. 175,000.00 | 6% Band |
| `anjali.wickramasinghe@payrolleey.lk` | `EMPLOYEE` | Customer Operations | Rs. 110,000.00 | 0% (Tax Exempt Relief) |
| `ravindu.de.silva@payrolleey.lk` | `EMPLOYEE` | Staff DevOps Architect | Rs. 620,000.00 | Executive 36% |
