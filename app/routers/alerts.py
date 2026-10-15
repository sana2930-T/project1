import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Alert, WaterSource, NotificationEvent, AuditLog, User
from ..schemas import AlertResponse, AlertResolutionRequest
from ..services.auth_service import get_current_user_optional

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    source_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if severity:
        query = query.filter(Alert.severity == severity)

    if status:
        query = query.filter(Alert.status == status)

    if source_id is not None:
        query = query.filter(Alert.source_id == source_id)

    if search:
        query = query.filter(
            (Alert.title.ilike(f"%{search}%")) |
            (Alert.alert_code.ilike(f"%{search}%")) |
            (Alert.description.ilike(f"%{search}%"))
        )

    alerts = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for a in alerts:
        results.append(
            AlertResponse(
                id=a.id,
                alert_code=a.alert_code,
                source_id=a.source_id,
                measurement_id=a.measurement_id,
                category=a.category,
                severity=a.severity,
                title=a.title,
                description=a.description,
                recommended_action=a.recommended_action,
                status=a.status,
                assigned_to_user_id=a.assigned_to_user_id,
                acknowledged_at=a.acknowledged_at,
                resolved_at=a.resolved_at,
                resolution_notes=a.resolution_notes,
                created_at=a.created_at,
                source_name=a.source.name if a.source else "Unknown",
                source_code=a.source.source_code if a.source else "N/A"
            )
        )
    return results

@router.get("/notifications")
def get_notification_events(limit: int = 20, db: Session = Depends(get_db)):
    events = db.query(NotificationEvent).order_by(
        NotificationEvent.created_at.desc()
    ).limit(limit).all()

    items = []
    for e in events:
        items.append({
            "id": e.id,
            "recipient_role": e.recipient_role,
            "title": e.title,
            "message": e.message,
            "channel": e.channel,
            "delivery_status": e.delivery_status,
            "created_at": e.created_at.isoformat()
        })
    return items

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse(
        id=a.id,
        alert_code=a.alert_code,
        source_id=a.source_id,
        measurement_id=a.measurement_id,
        category=a.category,
        severity=a.severity,
        title=a.title,
        description=a.description,
        recommended_action=a.recommended_action,
        status=a.status,
        assigned_to_user_id=a.assigned_to_user_id,
        acknowledged_at=a.acknowledged_at,
        resolved_at=a.resolved_at,
        resolution_notes=a.resolution_notes,
        created_at=a.created_at,
        source_name=a.source.name if a.source else "Unknown",
        source_code=a.source.source_code if a.source else "N/A"
    )

@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    if a.status == "Resolved":
        raise HTTPException(status_code=400, detail="Cannot acknowledge an already resolved alert")

    a.status = "Acknowledged"
    a.acknowledged_at = datetime.datetime.utcnow()
    if current_user:
        a.assigned_to_user_id = current_user.id

    db.commit()
    db.refresh(a)

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="ALERT_ACKNOWLEDGE",
        entity_type="ALERT",
        entity_id=a.alert_code,
        details=f"Alert {a.alert_code} acknowledged by {current_user.username if current_user else 'Officer'}"
    )
    db.add(audit)
    db.commit()

    return get_alert_detail(alert_id=a.id, db=db)

@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    payload: AlertResolutionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    if not payload.resolution_notes or len(payload.resolution_notes.strip()) < 5:
        raise HTTPException(status_code=422, detail="Valid resolution notes describing corrective action are required")

    a.status = "Resolved"
    a.resolved_at = datetime.datetime.utcnow()
    a.resolution_notes = payload.resolution_notes
    db.commit()
    db.refresh(a)

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="ALERT_RESOLVE",
        entity_type="ALERT",
        entity_id=a.alert_code,
        details=f"Alert {a.alert_code} resolved. Notes: {payload.resolution_notes}"
    )
    db.add(audit)
    db.commit()

    return get_alert_detail(alert_id=a.id, db=db)
