import os
from pydantic import BaseModel

class WaterStandardsConfig(BaseModel):
    standard_name: str = "IS 10500:2012 (Indian Standard Drinking Water Specification - Second Revision)"
    
    # pH Limits
    ph_min_acceptable: float = 6.5
    ph_max_acceptable: float = 8.5
    ph_min_permissible: float = 6.5
    ph_max_permissible: float = 8.5
    
    # Turbidity Limits (NTU)
    turbidity_acceptable_ntu: float = 1.0
    turbidity_permissible_ntu: float = 5.0
    
    # Total Dissolved Solids (mg/L)
    tds_acceptable_mg_l: float = 500.0
    tds_permissible_mg_l: float = 2000.0
    
    # Electrical Conductivity (µS/cm) typical threshold
    ec_warning_threshold: float = 1500.0
    
    # Temperature limits (°C)
    temp_min_normal: float = 10.0
    temp_max_normal: float = 38.0
    temp_sudden_delta: float = 5.0
    
    # Freshness threshold (days)
    stale_data_days: int = 7
    critical_stale_days: int = 14

class Settings:
    PROJECT_NAME: str = "JalRakshak AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "jalrakshak-ai-super-secret-key-2026-build-to-ship")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database URL: default SQLite, supports Postgres with env variable
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./jalrakshak.db")
    
    STANDARDS: WaterStandardsConfig = WaterStandardsConfig()
    
    SAFETY_DISCLAIMER: str = (
        "OFFICIAL WATER SCREENING DISCLAIMER: JalRakshak AI provides preliminary risk screening "
        "and anomaly detection based on physical/chemical sensor indicators (pH, Turbidity, TDS, EC, Temperature). "
        "These measurements CANNOT detect pathogens, microbial bacteria (E. coli, coliform), viruses, toxic pesticides, "
        "or heavy metals (Arsenic, Lead). Sensor screenings NEVER certify drinking water as safe to consume. "
        "Any abnormal reading or high-risk alert mandates confirmatory laboratory testing by an accredited testing facility."
    )

settings = Settings()
