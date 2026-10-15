import csv
import io
import datetime
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Measurement, WaterSource, Alert, Inspection, LaboratoryResult, ScreeningResult
from ..config import settings

router = APIRouter(prefix="/reports", tags=["Analytics & Reports"])

@router.get("/summary")
def get_reports_summary(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    Returns aggregated metrics and chronological trends for analytics charts.
    """
    query = db.query(Measurement).order_by(Measurement.timestamp.asc())
    measurements = query.all()

    # Time series of readings for trend graphs
    trend_series = []
    for m in measurements:
        trend_series.append({
            "timestamp": m.timestamp.strftime("%Y-%m-%d %H:%M"),
            "date": m.timestamp.strftime("%b %d"),
            "source_code": m.source.source_code if m.source else "N/A",
            "source_name": m.source.name if m.source else "Unknown",
            "ph": m.ph,
            "turbidity": m.turbidity,
            "tds": m.tds,
            "temperature": m.temperature,
            "electrical_conductivity": m.electrical_conductivity,
            "status": m.screening_result.status if m.screening_result else "Normal"
        })

    # Inspection resolution rate
    total_inspections = db.query(Inspection).count()
    resolved_inspections = db.query(Inspection).filter(Inspection.status == "Resolved").count()
    resolution_rate = round((resolved_inspections / total_inspections * 100), 1) if total_inspections > 0 else 100.0

    # Source breakdown
    sources_summary = []
    for s in db.query(WaterSource).all():
        meas_count = db.query(Measurement).filter(Measurement.source_id == s.id).count()
        latest = db.query(Measurement).filter(Measurement.source_id == s.id).order_by(Measurement.timestamp.desc()).first()
        active_al = db.query(Alert).filter(Alert.source_id == s.id, Alert.status == "Active").count()
        sources_summary.append({
            "source_id": s.id,
            "source_code": s.source_code,
            "name": s.name,
            "source_type": s.source_type,
            "locality": s.locality,
            "district": s.district,
            "readings_count": meas_count,
            "active_alerts": active_al,
            "latest_reading_date": latest.timestamp.strftime("%Y-%m-%d") if latest else "None",
            "latest_ph": latest.ph if latest else None,
            "latest_turbidity": latest.turbidity if latest else None,
            "latest_tds": latest.tds if latest else None,
            "latest_status": latest.screening_result.status if latest and latest.screening_result else "No Data"
        })

    return {
        "trend_series": trend_series,
        "total_readings": len(measurements),
        "total_sources": len(sources_summary),
        "inspection_metrics": {
            "total": total_inspections,
            "resolved": resolved_inspections,
            "resolution_rate_percent": resolution_rate
        },
        "sources_summary": sources_summary,
        "standards_reference": settings.STANDARDS.standard_name,
        "safety_disclaimer": settings.SAFETY_DISCLAIMER
    }

@router.get("/export")
def export_csv(
    type: str = Query("measurements", pattern="^(measurements|sources|alerts|inspections|laboratory)$"),
    db: Session = Depends(get_db)
):
    """
    Export database records as clean CSV formatted stream.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    if type == "measurements":
        writer.writerow([
            "ID", "Source Code", "Source Name", "Timestamp", "pH",
            "Turbidity (NTU)", "Temperature (C)", "TDS (mg/L)",
            "EC (uS/cm)", "Method", "Provenance", "Screening Status", "Notes"
        ])
        meas_list = db.query(Measurement).order_by(Measurement.timestamp.desc()).all()
        for m in meas_list:
            writer.writerow([
                m.id,
                m.source.source_code if m.source else "",
                m.source.name if m.source else "",
                m.timestamp.isoformat(),
                m.ph,
                m.turbidity,
                m.temperature,
                m.tds,
                m.electrical_conductivity,
                m.measurement_method,
                m.provenance,
                m.screening_result.status if m.screening_result else "Unscreened",
                m.notes or ""
            ])
        filename = f"jalrakshak_measurements_{datetime.datetime.utcnow().strftime('%Y%m%d')}.csv"

    elif type == "sources":
        writer.writerow([
            "ID", "Source Code", "Name", "Type", "Locality", "District",
            "State", "Latitude", "Longitude", "Active", "Registration Date", "Last Inspection"
        ])
        src_list = db.query(WaterSource).all()
        for s in src_list:
            writer.writerow([
                s.id, s.source_code, s.name, s.source_type, s.locality, s.district,
                s.state, s.latitude, s.longitude, s.is_active,
                s.registration_date.isoformat() if s.registration_date else "",
                s.last_inspection_date.isoformat() if s.last_inspection_date else ""
            ])
        filename = f"jalrakshak_sources_{datetime.datetime.utcnow().strftime('%Y%m%d')}.csv"

    elif type == "alerts":
        writer.writerow([
            "ID", "Alert Code", "Source Code", "Source Name", "Category",
            "Severity", "Status", "Title", "Created At", "Resolved At", "Resolution Notes"
        ])
        alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
        for a in alerts:
            writer.writerow([
                a.id, a.alert_code,
                a.source.source_code if a.source else "",
                a.source.name if a.source else "",
                a.category, a.severity, a.status, a.title,
                a.created_at.isoformat(),
                a.resolved_at.isoformat() if a.resolved_at else "",
                a.resolution_notes or ""
            ])
        filename = f"jalrakshak_alerts_{datetime.datetime.utcnow().strftime('%Y%m%d')}.csv"

    elif type == "inspections":
        writer.writerow([
            "ID", "Inspection Code", "Source Code", "Source Name", "Priority",
            "Status", "Due Date", "Assigned Officer", "Observations", "Corrective Actions", "Resolution Summary"
        ])
        insps = db.query(Inspection).order_by(Inspection.created_at.desc()).all()
        for i in insps:
            writer.writerow([
                i.id, i.inspection_code,
                i.source.source_code if i.source else "",
                i.source.name if i.source else "",
                i.priority, i.status,
                i.due_date.isoformat() if i.due_date else "",
                i.assigned_officer.full_name if i.assigned_officer else "Unassigned",
                i.observations or "",
                i.corrective_actions or "",
                i.resolution_summary or ""
            ])
        filename = f"jalrakshak_inspections_{datetime.datetime.utcnow().strftime('%Y%m%d')}.csv"

    else:  # laboratory
        writer.writerow([
            "ID", "Sample ID", "Source Code", "Source Name", "Collection Date",
            "Testing Date", "Laboratory", "Standard", "Coliform", "E. Coli",
            "Heavy Metals", "Status", "Reviewer", "Notes"
        ])
        labs = db.query(LaboratoryResult).order_by(LaboratoryResult.testing_date.desc()).all()
        for l in labs:
            writer.writerow([
                l.id, l.lab_sample_id,
                l.source.source_code if l.source else "",
                l.source.name if l.source else "",
                l.collection_date.isoformat(),
                l.testing_date.isoformat(),
                l.laboratory_name, l.accredited_standard,
                l.coliform_bacteria, l.e_coli, l.heavy_metals_status,
                l.verification_status, l.reviewer_name, l.notes or ""
            ])
        filename = f"jalrakshak_lab_results_{datetime.datetime.utcnow().strftime('%Y%m%d')}.csv"

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
