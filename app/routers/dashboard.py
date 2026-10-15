import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import WaterSource, Measurement, ScreeningResult, Alert, Inspection
from ..schemas import DashboardStatsResponse
from ..config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    seven_days_ago = now - datetime.timedelta(days=7)

    # 1. Total & Active Sources
    total_sources = db.query(WaterSource).count()
    active_sources = db.query(WaterSource).filter(WaterSource.is_active == True).count()

    # 2. Freshness & Stale Counts
    # Sources with reading within last 7 days
    recent_source_ids = db.query(Measurement.source_id).filter(
        Measurement.timestamp >= seven_days_ago
    ).distinct().all()
    sources_with_recent_readings = len(recent_source_ids)
    stale_sources_count = max(0, total_sources - sources_with_recent_readings)

    # 3. Alerts counts
    unresolved_alerts_count = db.query(Alert).filter(Alert.status.in_(["Active", "Acknowledged"])).count()
    critical_alerts_count = db.query(Alert).filter(
        Alert.status.in_(["Active", "Acknowledged"]),
        Alert.severity == "Critical"
    ).count()

    # 4. Sources requiring follow-up (sources with active alerts OR latest screening not compliant)
    sources_with_active_alerts = db.query(Alert.source_id).filter(
        Alert.status == "Active"
    ).distinct().all()
    sources_requiring_followup = len(sources_with_active_alerts)

    # 5. Pending inspections
    pending_inspections_count = db.query(Inspection).filter(
        Inspection.status.in_(["Open", "Assigned", "In Progress", "Awaiting Laboratory Result"])
    ).count()

    # 6. Total measurements
    total_measurements = db.query(Measurement).count()

    # 7. Screening Distribution
    # Query latest screening result for each water source
    screening_distribution = {
        "Within Desirable Thresholds (Preliminary)": 0,
        "Threshold Exceeded - Additional Testing Recommended": 0,
        "Urgent Investigation Recommended": 0,
        "Unusual Pattern Detected": 0,
        "Stale / Insufficient Data": 0
    }
    sources = db.query(WaterSource).all()
    for s in sources:
        latest_meas = db.query(Measurement).filter(
            Measurement.source_id == s.id
        ).order_by(Measurement.timestamp.desc()).first()
        
        if not latest_meas or latest_meas.timestamp < seven_days_ago:
            screening_distribution["Stale / Insufficient Data"] += 1
        elif latest_meas.screening_result:
            st = latest_meas.screening_result.status
            screening_distribution[st] = screening_distribution.get(st, 0) + 1
        else:
            screening_distribution["Within Desirable Thresholds (Preliminary)"] += 1

    # 8. Source Type Distribution
    source_type_distribution = {}
    type_counts = db.query(WaterSource.source_type, func.count(WaterSource.id)).group_by(WaterSource.source_type).all()
    for stype, count in type_counts:
        source_type_distribution[stype] = count

    # 9. Alert Severity Distribution
    alert_severity_distribution = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    severity_counts = db.query(Alert.severity, func.count(Alert.id)).filter(
        Alert.status.in_(["Active", "Acknowledged"])
    ).group_by(Alert.severity).all()
    for sev, count in severity_counts:
        alert_severity_distribution[sev] = count

    # 10. Recent Readings
    recent_measurements_orm = db.query(Measurement).order_by(Measurement.timestamp.desc()).limit(6).all()
    recent_readings = []
    for m in recent_measurements_orm:
        recent_readings.append({
            "id": m.id,
            "source_id": m.source_id,
            "source_name": m.source.name if m.source else "Unknown",
            "source_code": m.source.source_code if m.source else "N/A",
            "locality": m.source.locality if m.source else "N/A",
            "timestamp": m.timestamp.isoformat(),
            "ph": m.ph,
            "turbidity": m.turbidity,
            "tds": m.tds,
            "temperature": m.temperature,
            "screening_status": m.screening_result.status if m.screening_result else "Pending",
            "is_simulated": m.is_simulated,
            "provenance": m.provenance
        })

    # 11. Recent Alerts
    recent_alerts_orm = db.query(Alert).order_by(Alert.created_at.desc()).limit(5).all()
    recent_alerts = []
    for a in recent_alerts_orm:
        recent_alerts.append({
            "id": a.id,
            "alert_code": a.alert_code,
            "source_id": a.source_id,
            "source_name": a.source.name if a.source else "Unknown",
            "category": a.category,
            "severity": a.severity,
            "title": a.title,
            "status": a.status,
            "created_at": a.created_at.isoformat()
        })

    # 12. Pending Inspections
    pending_inspections_orm = db.query(Inspection).filter(
        Inspection.status.in_(["Open", "Assigned", "In Progress", "Awaiting Laboratory Result"])
    ).order_by(Inspection.due_date.asc()).limit(5).all()
    pending_inspections = []
    for insp in pending_inspections_orm:
        pending_inspections.append({
            "id": insp.id,
            "inspection_code": insp.inspection_code,
            "title": insp.title,
            "source_name": insp.source.name if insp.source else "Unknown",
            "priority": insp.priority,
            "status": insp.status,
            "due_date": insp.due_date.isoformat() if insp.due_date else None,
            "assigned_officer": insp.assigned_officer.full_name if insp.assigned_officer else "Unassigned"
        })

    # 13. Compliance Summary
    compliant_count = screening_distribution.get("Within Desirable Thresholds (Preliminary)", 0)
    total_screened = sum(screening_distribution.values()) - screening_distribution.get("Stale / Insufficient Data", 0)
    compliance_rate = round((compliant_count / total_screened * 100), 1) if total_screened > 0 else 0.0

    return {
        "total_sources": total_sources,
        "active_sources": active_sources,
        "sources_with_recent_readings": sources_with_recent_readings,
        "sources_requiring_followup": sources_requiring_followup,
        "unresolved_alerts_count": unresolved_alerts_count,
        "critical_alerts_count": critical_alerts_count,
        "pending_inspections_count": pending_inspections_count,
        "total_measurements": total_measurements,
        "stale_sources_count": stale_sources_count,
        "screening_distribution": screening_distribution,
        "source_type_distribution": source_type_distribution,
        "alert_severity_distribution": alert_severity_distribution,
        "recent_readings": recent_readings,
        "recent_alerts": recent_alerts,
        "pending_inspections": pending_inspections,
        "compliance_summary": {
            "rate_percentage": compliance_rate,
            "compliant_sources": compliant_count,
            "total_active_screened": total_screened,
            "standard_reference": settings.STANDARDS.standard_name
        },
        "safety_disclaimer": settings.SAFETY_DISCLAIMER
    }
