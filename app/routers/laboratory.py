from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import LaboratoryResult, WaterSource, AuditLog, User
from ..schemas import LaboratoryResultCreate, LaboratoryResultResponse
from ..services.auth_service import get_current_user_optional

router = APIRouter(prefix="/laboratory-results", tags=["Laboratory Results"])

@router.get("", response_model=List[LaboratoryResultResponse])
def get_laboratory_results(
    source_id: Optional[int] = None,
    verification_status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(LaboratoryResult)

    if source_id is not None:
        query = query.filter(LaboratoryResult.source_id == source_id)

    if verification_status:
        query = query.filter(LaboratoryResult.verification_status == verification_status)

    results = query.order_by(LaboratoryResult.testing_date.desc()).limit(limit).all()

    items = []
    for r in results:
        items.append(
            LaboratoryResultResponse(
                id=r.id,
                lab_sample_id=r.lab_sample_id,
                source_id=r.source_id,
                collection_date=r.collection_date,
                testing_date=r.testing_date,
                laboratory_name=r.laboratory_name,
                accredited_standard=r.accredited_standard,
                coliform_bacteria=r.coliform_bacteria,
                e_coli=r.e_coli,
                heavy_metals_status=r.heavy_metals_status,
                chemical_parameters=r.chemical_parameters,
                verification_status=r.verification_status,
                reviewer_name=r.reviewer_name,
                notes=r.notes,
                report_file_ref=r.report_file_ref,
                created_at=r.created_at,
                source_name=r.source.name if r.source else "Unknown"
            )
        )
    return items

@router.post("", response_model=LaboratoryResultResponse)
def create_laboratory_result(
    payload: LaboratoryResultCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    source = db.query(WaterSource).filter(WaterSource.id == payload.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    existing = db.query(LaboratoryResult).filter(
        LaboratoryResult.lab_sample_id == payload.lab_sample_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Sample ID {payload.lab_sample_id} already exists")

    lab_res = LaboratoryResult(
        lab_sample_id=payload.lab_sample_id,
        source_id=payload.source_id,
        collection_date=payload.collection_date,
        testing_date=payload.testing_date,
        laboratory_name=payload.laboratory_name,
        accredited_standard=payload.accredited_standard,
        coliform_bacteria=payload.coliform_bacteria,
        e_coli=payload.e_coli,
        heavy_metals_status=payload.heavy_metals_status,
        chemical_parameters=payload.chemical_parameters,
        verification_status=payload.verification_status,
        reviewer_name=payload.reviewer_name,
        notes=payload.notes,
        report_file_ref=payload.report_file_ref
    )
    db.add(lab_res)
    db.commit()
    db.refresh(lab_res)

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="LOG_LAB_RESULT",
        entity_type="LAB_RESULT",
        entity_id=lab_res.lab_sample_id,
        details=f"Logged laboratory test {lab_res.lab_sample_id} from {lab_res.laboratory_name} for source {source.name}"
    )
    db.add(audit)
    db.commit()

    return LaboratoryResultResponse(
        id=lab_res.id,
        lab_sample_id=lab_res.lab_sample_id,
        source_id=lab_res.source_id,
        collection_date=lab_res.collection_date,
        testing_date=lab_res.testing_date,
        laboratory_name=lab_res.laboratory_name,
        accredited_standard=lab_res.accredited_standard,
        coliform_bacteria=lab_res.coliform_bacteria,
        e_coli=lab_res.e_coli,
        heavy_metals_status=lab_res.heavy_metals_status,
        chemical_parameters=lab_res.chemical_parameters,
        verification_status=lab_res.verification_status,
        reviewer_name=lab_res.reviewer_name,
        notes=lab_res.notes,
        report_file_ref=lab_res.report_file_ref,
        created_at=lab_res.created_at,
        source_name=source.name
    )
