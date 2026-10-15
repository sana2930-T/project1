import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Inspection, WaterSource, Alert, AuditLog, User
from ..schemas import InspectionCreate, InspectionUpdate, InspectionResponse
from ..services.auth_service import get_current_user_optional, require_roles

router = APIRouter(prefix="/inspections", tags=["Field Inspections"])

@router.get("", response_model=List[InspectionResponse])
def get_inspections(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    source_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)

    if status:
        query = query.filter(Inspection.status == status)

    if priority:
        query = query.filter(Inspection.priority == priority)

    if source_id is not None:
        query = query.filter(Inspection.source_id == source_id)

    inspections = query.order_by(Inspection.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for insp in inspections:
        results.append(
            InspectionResponse(
                id=insp.id,
                inspection_code=insp.inspection_code,
                source_id=insp.source_id,
                alert_id=insp.alert_id,
                title=insp.title,
                assigned_officer_id=insp.assigned_officer_id,
                priority=insp.priority,
                due_date=insp.due_date,
                status=insp.status,
                observations=insp.observations,
                corrective_actions=insp.corrective_actions,
                notes=insp.notes,
                lab_report_ref=insp.lab_report_ref,
                closed_at=insp.closed_at,
                resolution_summary=insp.resolution_summary,
                created_at=insp.created_at,
                updated_at=insp.updated_at,
                source_name=insp.source.name if insp.source else "Unknown",
                assigned_officer_name=insp.assigned_officer.full_name if insp.assigned_officer else "Unassigned"
            )
        )
    return results

@router.post("", response_model=InspectionResponse)
def create_inspection(
    payload: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    source = db.query(WaterSource).filter(WaterSource.id == payload.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    inspection_code = f"INSP-{datetime.datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"

    insp = Inspection(
        inspection_code=inspection_code,
        source_id=payload.source_id,
        alert_id=payload.alert_id,
        title=payload.title,
        assigned_officer_id=payload.assigned_officer_id or (current_user.id if current_user else None),
        priority=payload.priority,
        due_date=payload.due_date or (datetime.datetime.utcnow() + datetime.timedelta(days=3)),
        status="Assigned" if payload.assigned_officer_id else "Open",
        observations=payload.observations
    )
    db.add(insp)
    db.commit()
    db.refresh(insp)

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="CREATE_INSPECTION",
        entity_type="INSPECTION",
        entity_id=insp.inspection_code,
        details=f"Created inspection task {insp.inspection_code} for {source.name}"
    )
    db.add(audit)
    db.commit()

    return InspectionResponse(
        id=insp.id,
        inspection_code=insp.inspection_code,
        source_id=insp.source_id,
        alert_id=insp.alert_id,
        title=insp.title,
        assigned_officer_id=insp.assigned_officer_id,
        priority=insp.priority,
        due_date=insp.due_date,
        status=insp.status,
        observations=insp.observations,
        corrective_actions=insp.corrective_actions,
        notes=insp.notes,
        lab_report_ref=insp.lab_report_ref,
        closed_at=insp.closed_at,
        resolution_summary=insp.resolution_summary,
        created_at=insp.created_at,
        updated_at=insp.updated_at,
        source_name=source.name,
        assigned_officer_name=insp.assigned_officer.full_name if insp.assigned_officer else "Unassigned"
    )

@router.patch("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(
    inspection_id: int,
    payload: InspectionUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    update_dict = payload.dict(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(insp, field, val)

    if payload.status == "Resolved" and not insp.closed_at:
        insp.closed_at = datetime.datetime.utcnow()
        # Also update water source last_inspection_date
        if insp.source:
            insp.source.last_inspection_date = datetime.datetime.utcnow()

    insp.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(insp)

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="UPDATE_INSPECTION",
        entity_type="INSPECTION",
        entity_id=insp.inspection_code,
        details=f"Updated inspection {insp.inspection_code}. Status: {insp.status}"
    )
    db.add(audit)
    db.commit()

    return InspectionResponse(
        id=insp.id,
        inspection_code=insp.inspection_code,
        source_id=insp.source_id,
        alert_id=insp.alert_id,
        title=insp.title,
        assigned_officer_id=insp.assigned_officer_id,
        priority=insp.priority,
        due_date=insp.due_date,
        status=insp.status,
        observations=insp.observations,
        corrective_actions=insp.corrective_actions,
        notes=insp.notes,
        lab_report_ref=insp.lab_report_ref,
        closed_at=insp.closed_at,
        resolution_summary=insp.resolution_summary,
        created_at=insp.created_at,
        updated_at=insp.updated_at,
        source_name=insp.source.name if insp.source else "Unknown",
        assigned_officer_name=insp.assigned_officer.full_name if insp.assigned_officer else "Unassigned"
    )
