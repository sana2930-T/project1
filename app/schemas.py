from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "Community Viewer"
    department: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# --- WATER SOURCE SCHEMAS ---
class WaterSourceBase(BaseModel):
    source_code: str
    name: str
    source_type: str  # Borewell, Hand Pump, Public Tap, Storage Tank, Pipeline, Other
    description: Optional[str] = None
    locality: str
    district: str
    state: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    responsible_officer_id: Optional[int] = None

class WaterSourceCreate(WaterSourceBase):
    pass

class WaterSourceUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    description: Optional[str] = None
    locality: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None
    responsible_officer_id: Optional[int] = None

class WaterSourceResponse(WaterSourceBase):
    id: int
    registration_date: datetime
    last_inspection_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    latest_screening_status: Optional[str] = None
    latest_measurement: Optional[Dict[str, Any]] = None
    active_alerts_count: int = 0

    class Config:
        from_attributes = True


# --- MEASUREMENT SCHEMAS ---
class MeasurementCreate(BaseModel):
    source_id: int
    ph: Optional[float] = Field(None, ge=0.0, le=14.0, description="pH between 0.0 and 14.0")
    turbidity: Optional[float] = Field(None, ge=0.0, le=1000.0, description="Turbidity in NTU")
    temperature: Optional[float] = Field(None, ge=-10.0, le=80.0, description="Temperature in °C")
    tds: Optional[float] = Field(None, ge=0.0, le=10000.0, description="Total Dissolved Solids in mg/L")
    electrical_conductivity: Optional[float] = Field(None, ge=0.0, le=20000.0, description="EC in µS/cm")
    measurement_method: str = "Manual"
    sensor_id: Optional[str] = None
    operator_name: Optional[str] = None
    calibration_info: Optional[str] = None
    notes: Optional[str] = None
    is_simulated: bool = False
    provenance: str = "Field Handheld Instrument"

class MeasurementResponse(BaseModel):
    id: int
    source_id: int
    timestamp: datetime
    ph: Optional[float]
    turbidity: Optional[float]
    temperature: Optional[float]
    tds: Optional[float]
    electrical_conductivity: Optional[float]
    measurement_method: str
    sensor_id: Optional[str]
    operator_name: Optional[str]
    calibration_info: Optional[str]
    notes: Optional[str]
    is_simulated: bool
    provenance: str
    screening_status: Optional[str] = None
    source_name: Optional[str] = None
    source_code: Optional[str] = None

    class Config:
        from_attributes = True

class SimulatedReadingRequest(BaseModel):
    source_id: int
    scenario: str = "normal"  # "normal", "high_turbidity_monsoon", "acidic_industrial", "high_tds_saline", "sensor_glitch"


# --- SCREENING SCHEMAS ---
class ScreeningResultResponse(BaseModel):
    id: int
    measurement_id: int
    source_id: int
    timestamp: datetime
    status: str
    triggering_parameters: Optional[str]
    explanation: str
    rules_evaluated: str
    recommended_action: str
    data_quality_warning: Optional[str]
    anomaly_score: Optional[float]
    model_method: str
    created_at: datetime
    safety_disclaimer: str = ""

    class Config:
        from_attributes = True


# --- ALERT SCHEMAS ---
class AlertCreate(BaseModel):
    source_id: int
    measurement_id: Optional[int] = None
    category: str
    severity: str  # Low, Medium, High, Critical
    title: str
    description: str
    recommended_action: str

class AlertResolutionRequest(BaseModel):
    resolution_notes: str

class AlertResponse(BaseModel):
    id: int
    alert_code: str
    source_id: int
    measurement_id: Optional[int]
    category: str
    severity: str
    title: str
    description: str
    recommended_action: str
    status: str
    assigned_to_user_id: Optional[int]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime
    source_name: Optional[str] = None
    source_code: Optional[str] = None

    class Config:
        from_attributes = True


# --- INSPECTION SCHEMAS ---
class InspectionCreate(BaseModel):
    source_id: int
    alert_id: Optional[int] = None
    title: str
    assigned_officer_id: Optional[int] = None
    priority: str = "Medium"
    due_date: Optional[datetime] = None
    observations: Optional[str] = None

class InspectionUpdate(BaseModel):
    title: Optional[str] = None
    assigned_officer_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    observations: Optional[str] = None
    corrective_actions: Optional[str] = None
    notes: Optional[str] = None
    lab_report_ref: Optional[str] = None
    resolution_summary: Optional[str] = None

class InspectionResponse(BaseModel):
    id: int
    inspection_code: str
    source_id: int
    alert_id: Optional[int]
    title: str
    assigned_officer_id: Optional[int]
    priority: str
    due_date: Optional[datetime]
    status: str
    observations: Optional[str]
    corrective_actions: Optional[str]
    notes: Optional[str]
    lab_report_ref: Optional[str]
    closed_at: Optional[datetime]
    resolution_summary: Optional[str]
    created_at: datetime
    updated_at: datetime
    source_name: Optional[str] = None
    assigned_officer_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- LABORATORY RESULT SCHEMAS ---
class LaboratoryResultCreate(BaseModel):
    lab_sample_id: str
    source_id: int
    collection_date: datetime
    testing_date: datetime
    laboratory_name: str
    accredited_standard: str = "IS 10500:2012"
    coliform_bacteria: str = "Absent / 100ml"
    e_coli: str = "Absent / 100ml"
    heavy_metals_status: str = "Below Quantifiable Limits"
    chemical_parameters: Optional[str] = None
    verification_status: str = "Verified"
    reviewer_name: str
    notes: Optional[str] = None
    report_file_ref: Optional[str] = None

class LaboratoryResultResponse(BaseModel):
    id: int
    lab_sample_id: str
    source_id: int
    collection_date: datetime
    testing_date: datetime
    laboratory_name: str
    accredited_standard: str
    coliform_bacteria: str
    e_coli: str
    heavy_metals_status: str
    chemical_parameters: Optional[str]
    verification_status: str
    reviewer_name: str
    notes: Optional[str]
    report_file_ref: Optional[str]
    created_at: datetime
    source_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- DASHBOARD & ANALYTICS SCHEMAS ---
class DashboardStatsResponse(BaseModel):
    total_sources: int
    active_sources: int
    sources_with_recent_readings: int  # within 7 days
    sources_requiring_followup: int
    unresolved_alerts_count: int
    critical_alerts_count: int
    pending_inspections_count: int
    total_measurements: int
    stale_sources_count: int
    screening_distribution: Dict[str, int]
    source_type_distribution: Dict[str, int]
    alert_severity_distribution: Dict[str, int]
    recent_readings: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    pending_inspections: List[Dict[str, Any]]
    compliance_summary: Dict[str, Any]
    safety_disclaimer: str
