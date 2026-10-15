import json
import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Measurement, WaterSource, ScreeningResult, Alert, AuditLog, User
from ..schemas import (
    MeasurementCreate, MeasurementResponse, SimulatedReadingRequest
)
from ..services.screening_engine import screening_engine
from ..services.alert_dispatcher import alert_dispatcher
from ..services.auth_service import get_current_user_optional

router = APIRouter(prefix="/measurements", tags=["Measurements"])

@router.get("", response_model=List[MeasurementResponse])
def get_measurements(
    source_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    is_simulated: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Measurement)

    if source_id is not None:
        query = query.filter(Measurement.source_id == source_id)

    if is_simulated is not None:
        query = query.filter(Measurement.is_simulated == is_simulated)

    measurements = query.order_by(Measurement.timestamp.desc()).offset(offset).limit(limit).all()

    results = []
    for m in measurements:
        screening_st = m.screening_result.status if m.screening_result else "Unscreened"
        results.append(
            MeasurementResponse(
                id=m.id,
                source_id=m.source_id,
                timestamp=m.timestamp,
                ph=m.ph,
                turbidity=m.turbidity,
                temperature=m.temperature,
                tds=m.tds,
                electrical_conductivity=m.electrical_conductivity,
                measurement_method=m.measurement_method,
                sensor_id=m.sensor_id,
                operator_name=m.operator_name,
                calibration_info=m.calibration_info,
                notes=m.notes,
                is_simulated=m.is_simulated,
                provenance=m.provenance,
                screening_status=screening_st,
                source_name=m.source.name if m.source else "Unknown",
                source_code=m.source.source_code if m.source else "N/A"
            )
        )
    return results

@router.post("", response_model=MeasurementResponse)
def create_measurement(
    payload: MeasurementCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    source = db.query(WaterSource).filter(WaterSource.id == payload.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    # Physical plausibility validation
    if payload.ph is not None and (payload.ph < 0.0 or payload.ph > 14.0):
        raise HTTPException(status_code=422, detail="pH value must be physically plausible between 0.0 and 14.0")

    if payload.turbidity is not None and payload.turbidity < 0.0:
        raise HTTPException(status_code=422, detail="Turbidity cannot be negative")

    if payload.tds is not None and payload.tds < 0.0:
        raise HTTPException(status_code=422, detail="TDS cannot be negative")

    meas = Measurement(
        source_id=payload.source_id,
        timestamp=datetime.datetime.utcnow(),
        ph=payload.ph,
        turbidity=payload.turbidity,
        temperature=payload.temperature,
        tds=payload.tds,
        electrical_conductivity=payload.electrical_conductivity,
        measurement_method=payload.measurement_method,
        sensor_id=payload.sensor_id,
        operator_name=payload.operator_name or (current_user.full_name if current_user else "Field Operator"),
        calibration_info=payload.calibration_info,
        notes=payload.notes,
        is_simulated=payload.is_simulated,
        provenance=payload.provenance
    )
    db.add(meas)
    db.commit()
    db.refresh(meas)

    # Historical records for baseline
    historical = db.query(Measurement).filter(
        Measurement.source_id == payload.source_id
    ).all()

    # Run AI / Regulatory screening engine
    screening_eval = screening_engine.evaluate(meas, historical)
    scr = ScreeningResult(
        measurement_id=meas.id,
        source_id=meas.source_id,
        timestamp=meas.timestamp,
        **screening_eval
    )
    db.add(scr)
    db.commit()

    # Trigger alert if non-compliant
    triggers_list = json.loads(screening_eval["triggering_parameters"]) if screening_eval.get("triggering_parameters") else []
    alert_dispatcher.process_screening_alert(
        db=db,
        source=source,
        measurement=meas,
        status=screening_eval["status"],
        triggers=triggers_list,
        explanation=screening_eval["explanation"],
        recommended_action=screening_eval["recommended_action"]
    )

    # Log audit
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="LOG_MEASUREMENT",
        entity_type="MEASUREMENT",
        entity_id=str(meas.id),
        details=f"Recorded reading on {source.source_code}: pH={meas.ph}, Turb={meas.turbidity}, TDS={meas.tds}. Status: {screening_eval['status']}"
    )
    db.add(audit)
    db.commit()

    return MeasurementResponse(
        id=meas.id,
        source_id=meas.source_id,
        timestamp=meas.timestamp,
        ph=meas.ph,
        turbidity=meas.turbidity,
        temperature=meas.temperature,
        tds=meas.tds,
        electrical_conductivity=meas.electrical_conductivity,
        measurement_method=meas.measurement_method,
        sensor_id=meas.sensor_id,
        operator_name=meas.operator_name,
        calibration_info=meas.calibration_info,
        notes=meas.notes,
        is_simulated=meas.is_simulated,
        provenance=meas.provenance,
        screening_status=screening_eval["status"],
        source_name=source.name,
        source_code=source.source_code
    )

@router.post("/simulate", response_model=MeasurementResponse)
def simulate_reading(
    payload: SimulatedReadingRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generate realistic simulated telemetry readings for live testing and demonstration.
    Scenarios:
    - normal: Balanced drinking water within IS 10500 limits
    - high_turbidity_monsoon: Post-rainfall runoff turbidity surge
    - acidic_industrial: Severe low pH alert scenario
    - high_tds_saline: Coastal / inland saline aquifer scenario
    - sensor_glitch: Flatlined zero values or disconnected probe
    """
    source = db.query(WaterSource).filter(WaterSource.id == payload.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")

    scenario = payload.scenario.lower()
    
    if scenario == "normal":
        ph = round(random.uniform(6.9, 7.6), 2)
        turb = round(random.uniform(0.3, 0.8), 2)
        temp = round(random.uniform(22.0, 26.5), 1)
        tds = round(random.uniform(180.0, 380.0), 1)
        ec = round(tds * 1.5, 1)
        notes = "Simulated normal telemetry transmission under stable operational conditions."
    elif scenario == "high_turbidity_monsoon":
        ph = round(random.uniform(7.1, 7.7), 2)
        turb = round(random.uniform(6.5, 12.0), 2)  # Exceeds 5.0 permissible limit
        temp = round(random.uniform(24.0, 27.0), 1)
        tds = round(random.uniform(320.0, 480.0), 1)
        ec = round(tds * 1.6, 1)
        notes = "Simulated monsoon surface runoff causing severe turbidity spike."
    elif scenario == "acidic_industrial":
        ph = round(random.uniform(4.8, 5.5), 2)  # Severe acidity below 6.5
        turb = round(random.uniform(1.2, 2.5), 2)
        temp = round(random.uniform(26.0, 30.0), 1)
        tds = round(random.uniform(550.0, 850.0), 1)
        ec = round(tds * 1.8, 1)
        notes = "Simulated acidic effluent seepage event requiring immediate protective advisory."
    elif scenario == "high_tds_saline":
        ph = round(random.uniform(7.8, 8.4), 2)
        turb = round(random.uniform(0.6, 1.2), 2)
        temp = round(random.uniform(27.0, 31.0), 1)
        tds = round(random.uniform(850.0, 1600.0), 1)  # Exceeds 500 desirable limit
        ec = round(tds * 1.7, 1)
        notes = "Simulated seasonal brackish water ingress and elevated mineral mineralization."
    elif scenario == "sensor_glitch":
        ph = 0.0
        turb = 0.0
        temp = 25.0
        tds = 0.0
        ec = 0.0
        notes = "Simulated sensor probe disconnect and analog-to-digital ground fault."
    else:
        raise HTTPException(status_code=400, detail="Invalid scenario name")

    create_payload = MeasurementCreate(
        source_id=source.id,
        ph=ph,
        turbidity=turb,
        temperature=temp,
        tds=tds,
        electrical_conductivity=ec,
        measurement_method="Simulated Sensor",
        sensor_id=f"SIM-PROBE-{source.source_code[-4:]}",
        operator_name="JalRakshak IoT Simulator",
        calibration_info="Simulated IEEE telemetry profile",
        notes=notes,
        is_simulated=True,
        provenance=f"IoT Telemetry Node Simulation ({scenario})"
    )

    return create_measurement(payload=create_payload, db=db, current_user=current_user)
