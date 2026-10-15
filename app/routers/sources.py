from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import WaterSource, Measurement, ScreeningResult, Alert, Inspection, AuditLog, User
from ..schemas import (
    WaterSourceCreate, WaterSourceUpdate, WaterSourceResponse
)
from ..services.auth_service import get_current_user_optional, require_roles

router = APIRouter(prefix="/sources", tags=["Water Sources"])

@router.get("", response_model=List[WaterSourceResponse])
def get_sources(
    search: Optional[str] = None,
    source_type: Optional[str] = None,
    district: Optional[str] = None,
    is_active: Optional[bool] = None,
    screening_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WaterSource)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                WaterSource.name.ilike(search_fmt),
                WaterSource.source_code.ilike(search_fmt),
                WaterSource.locality.ilike(search_fmt),
                WaterSource.district.ilike(search_fmt)
            )
        )

    if source_type:
        query = query.filter(WaterSource.source_type == source_type)

    if district:
        query = query.filter(WaterSource.district == district)

    if is_active is not None:
        query = query.filter(WaterSource.is_active == is_active)

    sources = query.all()
    results = []

    for s in sources:
        # Latest measurement
        latest_m = db.query(Measurement).filter(
            Measurement.source_id == s.id
        ).order_by(Measurement.timestamp.desc()).first()

        status_str = "No Data"
        latest_dict = None
        if latest_m:
            latest_dict = {
                "id": latest_m.id,
                "timestamp": latest_m.timestamp.isoformat(),
                "ph": latest_m.ph,
                "turbidity": latest_m.turbidity,
                "tds": latest_m.tds,
                "temperature": latest_m.temperature,
                "electrical_conductivity": latest_m.electrical_conductivity,
                "is_simulated": latest_m.is_simulated,
                "provenance": latest_m.provenance
            }
            if latest_m.screening_result:
                status_str = latest_m.screening_result.status
            else:
                status_str = "Screened (Normal)"

        active_alerts_count = db.query(Alert).filter(
            Alert.source_id == s.id,
            Alert.status == "Active"
        ).count()

        if screening_status and screening_status != status_str:
            continue

        resp_item = WaterSourceResponse(
            id=s.id,
            source_code=s.source_code,
            name=s.name,
            source_type=s.source_type,
            description=s.description,
            locality=s.locality,
            district=s.district,
            state=s.state,
            latitude=s.latitude,
            longitude=s.longitude,
            registration_date=s.registration_date,
            last_inspection_date=s.last_inspection_date,
            is_active=s.is_active,
            responsible_officer_id=s.responsible_officer_id,
            created_at=s.created_at,
            latest_screening_status=status_str,
            latest_measurement=latest_dict,
            active_alerts_count=active_alerts_count
        )
        results.append(resp_item)

    return results

@router.post("", response_model=WaterSourceResponse)
def create_source(
    payload: WaterSourceCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    existing = db.query(WaterSource).filter(WaterSource.source_code == payload.source_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Source code '{payload.source_code}' already exists.")

    new_source = WaterSource(
        source_code=payload.source_code,
        name=payload.name,
        source_type=payload.source_type,
        description=payload.description,
        locality=payload.locality,
        district=payload.district,
        state=payload.state,
        latitude=payload.latitude,
        longitude=payload.longitude,
        responsible_officer_id=payload.responsible_officer_id,
        registration_date=datetime.datetime.utcnow(),
        is_active=True
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)

    # Log audit
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="CREATE_SOURCE",
        entity_type="WATER_SOURCE",
        entity_id=str(new_source.id),
        details=f"Created water source {new_source.source_code} ({new_source.name})"
    )
    db.add(audit)
    db.commit()

    return WaterSourceResponse(
        id=new_source.id,
        source_code=new_source.source_code,
        name=new_source.name,
        source_type=new_source.source_type,
        description=new_source.description,
        locality=new_source.locality,
        district=new_source.district,
        state=new_source.state,
        latitude=new_source.latitude,
        longitude=new_source.longitude,
        registration_date=new_source.registration_date,
        last_inspection_date=new_source.last_inspection_date,
        is_active=new_source.is_active,
        responsible_officer_id=new_source.responsible_officer_id,
        created_at=new_source.created_at,
        latest_screening_status="No Data",
        latest_measurement=None,
        active_alerts_count=0
    )

@router.get("/{source_id}", response_model=WaterSourceResponse)
def get_source_detail(source_id: int, db: Session = Depends(get_db)):
    source = db.query(WaterSource).filter(WaterSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    latest_m = db.query(Measurement).filter(
        Measurement.source_id == source.id
    ).order_by(Measurement.timestamp.desc()).first()

    status_str = "No Data"
    latest_dict = None
    if latest_m:
        latest_dict = {
            "id": latest_m.id,
            "timestamp": latest_m.timestamp.isoformat(),
            "ph": latest_m.ph,
            "turbidity": latest_m.turbidity,
            "tds": latest_m.tds,
            "temperature": latest_m.temperature,
            "electrical_conductivity": latest_m.electrical_conductivity,
            "is_simulated": latest_m.is_simulated,
            "provenance": latest_m.provenance
        }
        if latest_m.screening_result:
            status_str = latest_m.screening_result.status

    active_alerts_count = db.query(Alert).filter(
        Alert.source_id == source.id,
        Alert.status == "Active"
    ).count()

    return WaterSourceResponse(
        id=source.id,
        source_code=source.source_code,
        name=source.name,
        source_type=source.source_type,
        description=source.description,
        locality=source.locality,
        district=source.district,
        state=source.state,
        latitude=source.latitude,
        longitude=source.longitude,
        registration_date=source.registration_date,
        last_inspection_date=source.last_inspection_date,
        is_active=source.is_active,
        responsible_officer_id=source.responsible_officer_id,
        created_at=source.created_at,
        latest_screening_status=status_str,
        latest_measurement=latest_dict,
        active_alerts_count=active_alerts_count
    )

@router.patch("/{source_id}", response_model=WaterSourceResponse)
def update_source(
    source_id: int,
    payload: WaterSourceUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    source = db.query(WaterSource).filter(WaterSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(source, field, val)
    source.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(source)

    return get_source_detail(source_id=source.id, db=db)

@router.delete("/{source_id}")
def deactivate_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Safely archive / deactivate source while preserving all measurements and alert history."""
    source = db.query(WaterSource).filter(WaterSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    source.is_active = False
    source.updated_at = datetime.datetime.utcnow()
    db.commit()

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="ARCHIVE_SOURCE",
        entity_type="WATER_SOURCE",
        entity_id=str(source.id),
        details=f"Archived water source {source.source_code}. Historical data preserved."
    )
    db.add(audit)
    db.commit()

    return {"message": f"Source {source.source_code} has been archived successfully while preserving measurement records."}

@router.get("/{source_id}/measurements")
def get_source_measurements(source_id: int, limit: int = 50, db: Session = Depends(get_db)):
    source = db.query(WaterSource).filter(WaterSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    measurements = db.query(Measurement).filter(
        Measurement.source_id == source_id
    ).order_by(Measurement.timestamp.desc()).limit(limit).all()

    items = []
    for m in measurements:
        items.append({
            "id": m.id,
            "source_id": m.source_id,
            "timestamp": m.timestamp.isoformat(),
            "ph": m.ph,
            "turbidity": m.turbidity,
            "temperature": m.temperature,
            "tds": m.tds,
            "electrical_conductivity": m.electrical_conductivity,
            "measurement_method": m.measurement_method,
            "sensor_id": m.sensor_id,
            "operator_name": m.operator_name,
            "calibration_info": m.calibration_info,
            "notes": m.notes,
            "is_simulated": m.is_simulated,
            "provenance": m.provenance,
            "screening_status": m.screening_result.status if m.screening_result else "Unscreened"
        })
    return items

@router.get("/{source_id}/screenings")
def get_source_screenings(source_id: int, limit: int = 20, db: Session = Depends(get_db)):
    screenings = db.query(ScreeningResult).filter(
        ScreeningResult.source_id == source_id
    ).order_by(ScreeningResult.timestamp.desc()).limit(limit).all()

    items = []
    for s in screenings:
        items.append({
            "id": s.id,
            "measurement_id": s.measurement_id,
            "source_id": s.source_id,
            "timestamp": s.timestamp.isoformat(),
            "status": s.status,
            "triggering_parameters": s.triggering_parameters,
            "explanation": s.explanation,
            "rules_evaluated": s.rules_evaluated,
            "recommended_action": s.recommended_action,
            "data_quality_warning": s.data_quality_warning,
            "anomaly_score": s.anomaly_score,
            "model_method": s.model_method,
            "safety_disclaimer": "Physical screening only. Never certifies drinking safety without lab testing."
        })
    return items
