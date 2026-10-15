import pytest
import datetime
from app.models import Measurement
from app.services.screening_engine import screening_engine
from app.config import settings

def test_compliant_measurement_screening():
    """Test that a measurement within IS 10500 limits passes with preliminary compliant status."""
    meas = Measurement(
        id=100,
        source_id=1,
        timestamp=datetime.datetime.utcnow(),
        ph=7.2,
        turbidity=0.5,
        temperature=24.0,
        tds=250.0,
        electrical_conductivity=380.0
    )
    result = screening_engine.evaluate(meas, [])
    assert result["status"] == "Within Desirable Thresholds (Preliminary)"
    assert "IS 10500:2012" in result["rules_evaluated"]

def test_high_turbidity_spike():
    """Turbidity > 5.0 NTU must trigger Urgent Investigation Recommended."""
    meas = Measurement(
        id=101,
        source_id=1,
        timestamp=datetime.datetime.utcnow(),
        ph=7.3,
        turbidity=8.5,  # Exceeds max permissible limit 5.0
        temperature=25.0,
        tds=300.0
    )
    result = screening_engine.evaluate(meas, [])
    assert result["status"] == "Urgent Investigation Recommended"
    assert "exceeds maximum permissible limit" in result["triggering_parameters"]

def test_acidic_ph_screening():
    """Severely acidic pH (< 5.5) must trigger Urgent status."""
    meas = Measurement(
        id=102,
        source_id=1,
        timestamp=datetime.datetime.utcnow(),
        ph=5.1,
        turbidity=0.8,
        temperature=24.0,
        tds=200.0
    )
    result = screening_engine.evaluate(meas, [])
    assert result["status"] == "Urgent Investigation Recommended"
    assert "Severely Acidic pH" in result["triggering_parameters"]

def test_high_tds_threshold():
    """TDS between 500 and 2000 triggers Threshold Exceeded - Additional Testing Recommended."""
    meas = Measurement(
        id=103,
        source_id=1,
        timestamp=datetime.datetime.utcnow(),
        ph=7.5,
        turbidity=0.9,
        temperature=26.0,
        tds=850.0  # Exceeds 500 desirable limit
    )
    result = screening_engine.evaluate(meas, [])
    assert result["status"] == "Threshold Exceeded - Additional Testing Recommended"

def test_sensor_zero_fault():
    """All zeros indicate sensor disconnect or calibration loss."""
    meas = Measurement(
        id=104,
        source_id=1,
        timestamp=datetime.datetime.utcnow(),
        ph=0.0,
        turbidity=0.0,
        temperature=22.0,
        tds=0.0
    )
    result = screening_engine.evaluate(meas, [])
    assert result["data_quality_warning"] is not None
    assert "sensor disconnect" in result["data_quality_warning"].lower()
