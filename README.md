# JalRakshak AI 💧

> **AI-Powered Water Quality Monitoring, Risk Detection, and Contamination Early-Warning System**

An intelligent water-monitoring platform for tracking water-quality measurements, identifying unusual changes using IS 10500:2012 regulatory screening + Isolation Forest anomaly detection, and helping communities act on potential water risks.

---

## 🚀 Quick Start (Local Demo)

### Prerequisites
- Python 3.11+ 
- Node.js 18+
- npm

---

### 1. Clone / Extract the Project

```
c:\Users\ASUS\Desktop\water\
├── backend\          ← FastAPI + SQLite
└── frontend\         ← React + Vite
```

---

### 2. Backend Setup

```powershell
# Navigate to backend
cd c:\Users\ASUS\Desktop\water\backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the backend API server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Auto-create the SQLite database (`jalrakshak.db`) on first run
- Seed 8 real Indian water source locations with 37+ historical measurements
- Generate alerts and inspection tasks for demonstration

✅ API available at: `http://localhost:8000`  
✅ Swagger UI docs: `http://localhost:8000/docs`  
✅ Health check: `http://localhost:8000/api/health`

---

### 3. Frontend Setup

```powershell
# In a new terminal
cd c:\Users\ASUS\Desktop\water\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Application at: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Administrator** | `admin` | `admin123` | Full platform access |
| **Field Officer** | `officer` | `officer123` | Measurements, inspections, alerts |
| **Community Viewer** | `viewer` | `viewer123` | Read-only public data |

> Use the **1-click role login buttons** on the Login page for quick demos.

---

## 🏗️ Architecture

```
Frontend (React/Vite)          Backend (FastAPI)            Database
  :5173                          :8000                       SQLite
  ┌──────────────┐               ┌───────────────────┐      ┌──────────┐
  │ Dashboard    │  ──/api/──►   │ FastAPI Routers   │ ──►  │jalrak-   │
  │ Sources      │               │ Screening Engine  │      │shak.db   │
  │ Measurements │               │ Alert Dispatcher  │      │          │
  │ Alerts       │               │ Auth Service      │      │8 sources │
  │ Inspections  │               │ Seed Data         │      │37+ meas. │
  │ Laboratory   │               └───────────────────┘      └──────────┘
  │ Analytics    │
  │ Map (Leaflet)│
  └──────────────┘
```

---

## 📊 Features

### Water Source Management
- Register boreholes, hand pumps, public taps, storage tanks, pipelines
- GPS coordinates with interactive Leaflet/OpenStreetMap map
- Source status tracking, inspection history, measurement timeline

### AI-Assisted Screening Engine
- **IS 10500:2012** (Indian Standard Drinking Water) compliance checks:
  - pH: 6.5–8.5 acceptable range
  - Turbidity: ≤1 NTU desirable, ≤5 NTU permissible
  - TDS: ≤500 mg/L acceptable, ≤2000 mg/L permissible
  - Temperature: 10–38°C normal range
- **Isolation Forest** multivariate anomaly detection on historical baselines
- Dry-run evaluation before committing measurements
- Stale data detection (7-day threshold)

### Alert System
- Auto-generated alerts for threshold violations and anomalies
- Severity levels: Low, Medium, High, Critical
- Acknowledge and resolve workflow
- In-app notification center

### Field Inspection Workflows
- Assign inspection tasks with priority and due dates
- Document field observations, corrective actions, lab references
- Status workflow: Open → Assigned → In Progress → Awaiting Lab → Resolved

### Laboratory Results Module
- Log accredited NABL/State lab certificates
- Record microbiological (coliform, E. coli) and heavy metals results
- Enforce the sensor-vs-lab boundary clearly in the UI

### Analytics & Reports
- Measurement trend charts (Recharts)
- Screening status distribution
- Alert severity breakdown
- CSV exports for all modules

---

## 🔬 Safety Disclaimer (By Design)

> **JalRakshak AI provides preliminary risk screening only.**  
> Physical/chemical sensors (pH, turbidity, TDS, EC, temperature) **cannot detect pathogens, E. coli, heavy metals, or pesticides**.  
> Any abnormal reading mandates confirmatory laboratory testing by an accredited facility.  
> This system supports human decision-making — it never certifies water as safe to consume.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| UI Components | Lucide React, Recharts, Leaflet (OpenStreetMap) |
| Backend | Python, FastAPI, Pydantic v2, SQLAlchemy 2.0 |
| Database | SQLite (dev), PostgreSQL-compatible (prod) |
| AI/Analytics | NumPy, pandas, scikit-learn (Isolation Forest) |
| Auth | JWT (PyJWT), PBKDF2 password hashing (passlib/bcrypt) |
| Deployment | Docker, Docker Compose (see `docker-compose.yml`) |

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/dashboard` | Dashboard metrics |
| GET/POST | `/api/sources` | Water sources CRUD |
| GET/POST | `/api/measurements` | Measurements CRUD |
| POST | `/api/measurements/simulate` | Run simulation scenario |
| POST | `/api/screenings/evaluate` | Dry-run screening |
| GET/PATCH | `/api/alerts` | Alerts + acknowledge/resolve |
| GET/POST/PATCH | `/api/inspections` | Inspection workflows |
| GET/POST | `/api/laboratory-results` | Lab certificates |
| GET | `/api/reports/summary` | Analytics summary |
| GET | `/api/reports/export?type=...` | CSV export |

Full interactive docs: `http://localhost:8000/docs`

---

## 📁 Project Structure

```
water/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, startup seeder
│   │   ├── config.py            # Settings, IS 10500:2012 thresholds
│   │   ├── database.py          # SQLAlchemy engine, session
│   │   ├── models.py            # ORM models (9 tables)
│   │   ├── schemas.py           # Pydantic v2 schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── sources.py
│   │   │   ├── measurements.py
│   │   │   ├── screening.py
│   │   │   ├── alerts.py
│   │   │   ├── inspections.py
│   │   │   ├── laboratory.py
│   │   │   └── reports.py
│   │   └── services/            # Business logic
│   │       ├── screening_engine.py   # IS 10500 + Isolation Forest
│   │       ├── alert_dispatcher.py   # Alert dedup + notifications
│   │       ├── auth_service.py       # JWT + role auth
│   │       └── seed_data.py          # Demo data seeder
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router setup
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   ├── services/api.ts      # Centralized API client
│   │   ├── context/AuthContext.tsx
│   │   ├── components/          # Reusable UI components
│   │   ├── layouts/             # DashboardLayout
│   │   └── pages/               # All page components
│   ├── vite.config.ts
│   └── package.json
├── .env.example
└── README.md
```

---

## 🐳 Docker (Optional)

```powershell
# From project root
docker-compose up --build
```

Requires `docker-compose.yml` in root. SQLite data persisted via Docker volume.

---

## 📝 Environment Variables

Copy `.env.example` to `.env` in the backend directory:

```ini
SECRET_KEY=your-production-secret-key-here
DATABASE_URL=sqlite:///./jalrakshak.db
# For PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/jalrakshak
```

---

## 🔮 Future Roadmap

- IoT MQTT sensor integration (ESP32 / Raspberry Pi)
- SMS/WhatsApp alert notifications via Twilio or local gateway
- GIS heat maps for multi-district water quality monitoring
- Predictive trend analysis for seasonal contamination
- Mobile-first PWA for field officers
- Multi-language support (Hindi, Marathi, Tamil)

---

*Built for the Build To Ship Innovation Challenge · JalRakshak AI · 2026*
