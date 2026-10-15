import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Measurement, WaterSource
from ..schemas import MeasurementCreate
from ..services.screening_engine import screening_engine
from ..config import settings

router = APIRouter(prefix="/screenings", tags=["Screening Engine"])

@router.post("/evaluate")
def evaluate_measurement_dry_run(
    payload: MeasurementCreate,
    db: Session = Depends(get_db)
):
    """
    Evaluates water parameters against IS 10500:2012 thresholds & historical anomaly baselines
    WITHOUT committing to the database. Useful for real-time field preview before saving.
    """
    temp_meas = Measurement(
        source_id=payload.source_id,
        ph=payload.ph,
        turbidity=payload.turbidity,
        temperature=payload.temperature,
        tds=payload.tds,
        electrical_conductivity=payload.electrical_conductivity,
        measurement_method=payload.measurement_method,
        sensor_id=payload.sensor_id,
        provenance=payload.provenance
    )

    historical = db.query(Measurement).filter(
        Measurement.source_id == payload.source_id
    ).all()

    result = screening_engine.evaluate(temp_meas, historical)
    result["safety_disclaimer"] = settings.SAFETY_DISCLAIMER
    result["triggering_parameters_list"] = json.loads(result["triggering_parameters"]) if result.get("triggering_parameters") else []
    return result

@router.get("/standards")
def get_screening_standards():
    """Return documented regulatory standards used for screening."""
    std = settings.STANDARDS
    return {
        "standard_name": std.standard_name,
        "authoritative_body": "Bureau of Indian Standards (BIS)",
        "jurisdiction": "India / Public Health Engineering Departments",
        "thresholds": {
            "ph": {
                "unit": "pH scale (0-14)",
                "acceptable_limit": f"{std.ph_min_acceptable} - {std.ph_max_acceptable}",
                "permissible_limit": f"{std.ph_min_permissible} - {std.ph_max_permissible}",
                "significance": "Acidity damages plumbing and increases toxic heavy metal leaching; high alkalinity causes scale and bitter taste."
            },
            "turbidity": {
                "unit": "NTU (Nephelometric Turbidity Units)",
                "acceptable_limit": f"< {std.turbidity_acceptable_ntu} NTU",
                "permissible_limit": f"< {std.turbidity_permissible_ntu} NTU",
                "significance": "Suspended colloidal particles shield microbial pathogens from chemical disinfection and promote bacterial regrowth."
            },
            "total_dissolved_solids": {
                "unit": "mg/L (ppm)",
                "acceptable_limit": f"< {std.tds_acceptable_mg_l} mg/L",
                "permissible_limit": f"< {std.tds_permissible_mg_l} mg/L",
                "significance": "High mineral concentration impacts palatability, gastrointestinal comfort, and boiler/cookware scaling."
            },
            "electrical_conductivity": {
                "unit": "µS/cm at 25°C",
                "acceptable_limit": f"< {std.ec_warning_threshold} µS/cm",
                "permissible_limit": "Correlation proxy for dissolved ionic species",
                "significance": "Indicator of ionic charge carriers from dissolved salts."
            },
            "water_temperature": {
                "unit": "°C",
                "normal_range": f"{std.temp_min_normal}°C - {std.temp_max_normal}°C",
                "significance": "Abrupt shifts signal thermal discharge, shallow aquifer exposure, or sensor baseline drift."
            }
        },
        "ai_anomaly_method": "Isolation Forest (unsupervised outlier detection) applied when historical sample N >= 5",
        "safety_disclaimer": settings.SAFETY_DISCLAIMER
    }
