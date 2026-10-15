import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), default="Community Viewer")  # Admin, Field Officer, Community Viewer
    department = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    assigned_sources = relationship("WaterSource", back_populates="responsible_officer")
    assigned_alerts = relationship("Alert", back_populates="assigned_officer")
    assigned_inspections = relationship("Inspection", back_populates="assigned_officer")


class WaterSource(Base):
    __tablename__ = "water_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    source_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # Borewell, Hand Pump, Public Tap, Storage Tank, Pipeline, Other
    description = Column(Text, nullable=True)
    locality = Column(String(120), nullable=False)
    district = Column(String(80), nullable=False)
    state = Column(String(80), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    registration_date = Column(DateTime, default=datetime.datetime.utcnow)
    last_inspection_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    responsible_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    responsible_officer = relationship("User", back_populates="assigned_sources")
    measurements = relationship("Measurement", back_populates="source", cascade="all, delete-orphan")
    screening_results = relationship("ScreeningResult", back_populates="source", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="source", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="source", cascade="all, delete-orphan")
    lab_results = relationship("LaboratoryResult", back_populates="source", cascade="all, delete-orphan")


class Measurement(Base):
    __tablename__ = "measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Physical/Chemical Parameters
    ph = Column(Float, nullable=True)  # Standard 6.5 - 8.5
    turbidity = Column(Float, nullable=True)  # NTU (< 1 desirable, < 5 permissible)
    temperature = Column(Float, nullable=True)  # °C
    tds = Column(Float, nullable=True)  # mg/L (< 500 desirable, < 2000 permissible)
    electrical_conductivity = Column(Float, nullable=True)  # µS/cm
    
    # Provenance and Metadata
    measurement_method = Column(String(50), default="Manual")  # Manual, Simulated Sensor, IoT Device, Laboratory Verification
    sensor_id = Column(String(50), nullable=True)
    operator_name = Column(String(100), nullable=True)
    calibration_info = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=False)
    provenance = Column(String(100), default="Field Handheld Instrument")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    source = relationship("WaterSource", back_populates="measurements")
    screening_result = relationship("ScreeningResult", back_populates="measurement", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="measurement")


class ScreeningResult(Base):
    __tablename__ = "screening_results"
    
    id = Column(Integer, primary_key=True, index=True)
    measurement_id = Column(Integer, ForeignKey("measurements.id"), nullable=False, unique=True)
    source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Status categories:
    # "Within Desirable Thresholds (Preliminary)"
    # "Unusual Pattern Detected"
    # "Threshold Exceeded - Additional Testing Recommended"
    # "Urgent Investigation Recommended"
    # "Stale / Insufficient Data"
    status = Column(String(80), nullable=False, index=True)
    
    triggering_parameters = Column(Text, nullable=True)  # JSON-encoded array of triggers
    explanation = Column(Text, nullable=False)
    rules_evaluated = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    data_quality_warning = Column(Text, nullable=True)
    anomaly_score = Column(Float, nullable=True)  # Statistical / Isolation forest score
    model_method = Column(String(100), default="IS 10500:2012 Deterministic Rules + Z-Score/Isolation Forest")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    measurement = relationship("Measurement", back_populates="screening_result")
    source = relationship("WaterSource", back_populates="screening_results")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=False)
    source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False, index=True)
    measurement_id = Column(Integer, ForeignKey("measurements.id"), nullable=True)
    
    # Category:
    # "Configured Threshold Exceeded", "Sudden Measurement Change", "Stale Measurements",
    # "Missing Measurements", "Suspected Sensor Malfunction", "Inspection Overdue", "Laboratory Follow-up Required"
    category = Column(String(80), nullable=False)
    
    # Severity: "Low", "Medium", "High", "Critical"
    severity = Column(String(30), nullable=False, index=True)
    
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    
    # Status: "Active", "Acknowledged", "Resolved"
    status = Column(String(30), default="Active", index=True)
    
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    source = relationship("WaterSource", back_populates="alerts")
    measurement = relationship("Measurement", back_populates="alerts")
    assigned_officer = relationship("User", back_populates="assigned_alerts")
    inspections = relationship("Inspection", back_populates="alert")


class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_code = Column(String(50), unique=True, index=True, nullable=False)
    source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    
    title = Column(String(150), nullable=False)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Priority: "Low", "Medium", "High", "Urgent"
    priority = Column(String(30), default="Medium")
    due_date = Column(DateTime, nullable=True)
    
    # Status: "Open", "Assigned", "In Progress", "Awaiting Laboratory Result", "Resolved", "Cancelled"
    status = Column(String(40), default="Open", index=True)
    
    observations = Column(Text, nullable=True)
    corrective_actions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    lab_report_ref = Column(String(100), nullable=True)
    
    closed_at = Column(DateTime, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    source = relationship("WaterSource", back_populates="inspections")
    alert = relationship("Alert", back_populates="inspections")
    assigned_officer = relationship("User", back_populates="assigned_inspections")


class LaboratoryResult(Base):
    __tablename__ = "laboratory_results"
    
    id = Column(Integer, primary_key=True, index=True)
    lab_sample_id = Column(String(60), unique=True, index=True, nullable=False)
    source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False, index=True)
    
    collection_date = Column(DateTime, nullable=False)
    testing_date = Column(DateTime, nullable=False)
    laboratory_name = Column(String(150), nullable=False)
    accredited_standard = Column(String(100), default="IS 10500:2012")
    
    coliform_bacteria = Column(String(80), default="Absent / 100ml")
    e_coli = Column(String(80), default="Absent / 100ml")
    heavy_metals_status = Column(String(100), default="Below Quantifiable Limits")
    chemical_parameters = Column(Text, nullable=True)  # JSON string of detailed lab parameters
    
    # Verification: "Verified", "Pending Review", "Inconclusive"
    verification_status = Column(String(40), default="Verified")
    reviewer_name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    report_file_ref = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    source = relationship("WaterSource", back_populates="lab_results")


class NotificationEvent(Base):
    __tablename__ = "notification_events"
    
    id = Column(Integer, primary_key=True, index=True)
    recipient_role = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(String(40), default="In-App")  # In-App, Simulated SMS, Simulated Email
    delivery_status = Column(String(50), default="Delivered In-App")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String(80), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
