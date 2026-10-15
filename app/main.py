import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .services.seed_data import seed_database
from .services.alert_dispatcher import alert_dispatcher
from .routers import (
    auth, dashboard, sources, measurements, screening,
    alerts, inspections, laboratory, reports
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JalRakshak AI — Backend API",
    description=(
        "AI-Powered Water Quality Monitoring, Risk Detection, and Contamination Early-Warning System. "
        "Provides regulatory compliance screening (IS 10500:2012), Isolation Forest multivariate anomaly detection, "
        "automated alert dispatch, and field inspection management."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(sources.router, prefix=api_prefix)
app.include_router(measurements.router, prefix=api_prefix)
app.include_router(screening.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(inspections.router, prefix=api_prefix)
app.include_router(laboratory.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)

@app.on_event("startup")
def on_startup():
    """Seed sample data on first start and evaluate any stale water sources."""
    db = SessionLocal()
    try:
        seed_database(db)
        alert_dispatcher.check_stale_sources(db, max_days=settings.STANDARDS.stale_data_days)
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JalRakshak AI API",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "connected",
        "standards": settings.STANDARDS.standard_name,
        "disclaimer_active": True
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to JalRakshak AI API. Visit /docs for OpenAPI documentation.",
        "dashboard_api": f"{settings.API_V1_STR}/dashboard",
        "health_check": "/api/health"
    }
