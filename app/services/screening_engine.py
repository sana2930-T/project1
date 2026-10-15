import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from ..config import settings
from ..models import Measurement, WaterSource

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class ScreeningEngine:
    def __init__(self):
        self.standards = settings.STANDARDS

    def evaluate(
        self,
        measurement: Measurement,
        historical_measurements: List[Measurement]
    ) -> Dict[str, Any]:
        """
        Screen a water quality measurement using:
        1. Deterministic regulatory rules (IS 10500:2012)
        2. Sensor sanity / data quality checks
        3. Statistical anomaly detection (Isolation Forest / Z-score when historical N >= 5)
        """
        triggers = []
        rules_evaluated = []
        data_quality_warnings = []
        is_urgent = False
        is_warning = False
        is_anomaly = False
        anomaly_score = None
        method_used = "Deterministic IS 10500:2012 Rule Screening"

        ph = measurement.ph
        turb = measurement.turbidity
        temp = measurement.temperature
        tds = measurement.tds
        ec = measurement.electrical_conductivity

        # --- 1. SENSOR SANITY / DATA QUALITY CHECKS ---
        valid_params = [p for p in [ph, turb, temp, tds, ec] if p is not None]
        if not valid_params:
            return {
                "status": "Stale / Insufficient Data",
                "triggering_parameters": json.dumps(["No physical/chemical parameters recorded"]),
                "explanation": "No numeric water quality parameters were provided in this measurement.",
                "rules_evaluated": "Null data screening check",
                "recommended_action": "Resample water source using calibrated instruments.",
                "data_quality_warning": "Measurement record contains no valid sensor readings.",
                "anomaly_score": None,
                "model_method": "Data Completeness Check"
            }

        # Check for possible sensor malfunction / flatline
        if ph == 0.0 or turb == 0.0 and tds == 0.0:
            data_quality_warnings.append(
                "Potential sensor disconnect or zero-calibration fault detected (zero reading across multiple sensors)."
            )

        # Check delta against previous measurement if exists
        prev_reading = None
        if historical_measurements:
            # historical_measurements is sorted descending by timestamp
            sorted_history = sorted(historical_measurements, key=lambda x: x.timestamp, reverse=True)
            for h in sorted_history:
                if h.id != measurement.id:
                    prev_reading = h
                    break

        if prev_reading:
            if ph is not None and prev_reading.ph is not None:
                delta_ph = abs(ph - prev_reading.ph)
                if delta_ph >= 2.0:
                    triggers.append(f"Sudden pH shift of {delta_ph:.2f} units from previous reading ({prev_reading.ph})")
                    is_anomaly = True

            if turb is not None and prev_reading.turbidity is not None:
                delta_turb = abs(turb - prev_reading.turbidity)
                if delta_turb >= 15.0:
                    triggers.append(f"Sudden turbidity surge (+{delta_turb:.1f} NTU) compared to previous baseline")
                    is_anomaly = True

            if tds is not None and prev_reading.tds is not None:
                delta_tds = abs(tds - prev_reading.tds)
                if delta_tds >= 400.0:
                    triggers.append(f"Sudden TDS fluctuation of {delta_tds:.0f} mg/L from previous reading")
                    is_anomaly = True

        # --- 2. DETERMINISTIC REGULATORY THRESHOLDS (IS 10500:2012) ---
        # pH Evaluation: Desirable 6.5 - 8.5
        if ph is not None:
            rules_evaluated.append("IS 10500:2012 pH Acceptable (6.5 - 8.5)")
            if ph < self.standards.ph_min_acceptable:
                is_warning = True
                if ph < 5.5:
                    is_urgent = True
                    triggers.append(f"Severely Acidic pH: {ph:.2f} (Permissible limit: 6.5 - 8.5)")
                else:
                    triggers.append(f"Acidic pH below acceptable limit: {ph:.2f} (Limit: 6.5 - 8.5)")
            elif ph > self.standards.ph_max_acceptable:
                is_warning = True
                if ph > 9.5:
                    is_urgent = True
                    triggers.append(f"Highly Alkaline pH: {ph:.2f} (Permissible limit: 6.5 - 8.5)")
                else:
                    triggers.append(f"Alkaline pH exceeding acceptable limit: {ph:.2f} (Limit: 6.5 - 8.5)")

        # Turbidity Evaluation: Desirable < 1.0 NTU, Permissible < 5.0 NTU
        if turb is not None:
            rules_evaluated.append("IS 10500:2012 Turbidity (Desirable < 1.0 NTU, Max Permissible < 5.0 NTU)")
            if turb > self.standards.turbidity_permissible_ntu:
                is_urgent = True
                triggers.append(
                    f"Turbidity {turb:.2f} NTU significantly exceeds maximum permissible limit (5.0 NTU)"
                )
            elif turb > self.standards.turbidity_acceptable_ntu:
                is_warning = True
                triggers.append(
                    f"Turbidity {turb:.2f} NTU exceeds desirable limit (1.0 NTU)"
                )

        # TDS Evaluation: Desirable < 500 mg/L, Permissible < 2000 mg/L
        if tds is not None:
            rules_evaluated.append("IS 10500:2012 TDS (Desirable < 500 mg/L, Max Permissible < 2000 mg/L)")
            if tds > self.standards.tds_permissible_mg_l:
                is_urgent = True
                triggers.append(
                    f"TDS {tds:.0f} mg/L exceeds maximum permissible limit (2000 mg/L)"
                )
            elif tds > self.standards.tds_acceptable_mg_l:
                is_warning = True
                triggers.append(
                    f"TDS {tds:.0f} mg/L exceeds desirable limit (500 mg/L)"
                )

        # Electrical Conductivity: > 1500 µS/cm indicator
        if ec is not None:
            rules_evaluated.append("EC screening threshold (1500 µS/cm)")
            if ec > self.standards.ec_warning_threshold:
                is_warning = True
                triggers.append(f"High Electrical Conductivity: {ec:.1f} µS/cm (indicates high dissolved mineral concentration)")

        # Temperature: Check for abnormal high/low
        if temp is not None:
            rules_evaluated.append("Normal ambient water temperature range (10°C - 38°C)")
            if temp < self.standards.temp_min_normal or temp > self.standards.temp_max_normal:
                triggers.append(f"Atypical water temperature: {temp:.1f}°C")
                is_warning = True

        # --- 3. STATISTICAL MULTIVARIATE ANOMALY DETECTION ---
        # When historical data >= 5 records exist, train Isolation Forest on source history
        usable_history = [
            h for h in historical_measurements 
            if h.id != measurement.id and h.ph is not None and h.turbidity is not None and h.tds is not None
        ]
        
        if len(usable_history) >= 5 and SKLEARN_AVAILABLE and ph is not None and turb is not None and tds is not None:
            try:
                hist_features = [[h.ph, h.turbidity, h.tds] for h in usable_history]
                current_features = [[ph, turb, tds]]
                
                # Isolation Forest
                iso_forest = IsolationForest(
                    n_estimators=50,
                    contamination=0.1,
                    random_state=42
                )
                iso_forest.fit(hist_features)
                pred = iso_forest.predict(current_features)  # -1 for anomaly, 1 for inlier
                score = iso_forest.decision_function(current_features)[0]
                anomaly_score = round(float(-score), 4)  # higher = more anomalous

                method_used = f"Deterministic IS 10500:2012 Rules + Isolation Forest (N={len(usable_history)} historical baseline samples)"
                rules_evaluated.append(f"Isolation Forest Multivariate Anomaly Detector (Baseline N={len(usable_history)})")

                if pred[0] == -1 and anomaly_score > 0.15:
                    is_anomaly = True
                    triggers.append(f"Multivariate statistical outlier detected by Isolation Forest (anomaly score: {anomaly_score:.3f})")
            except Exception as e:
                method_used = f"Deterministic Rules (Isolation Forest skipped: {str(e)})"
        else:
            sample_count = len(usable_history)
            rules_evaluated.append(
                f"Statistical ML baseline note: N={sample_count} historical samples (minimum 5 required for Isolation Forest). Deterministic rule screening applied."
            )

        # --- 4. CLASSIFY FINAL SCREENING STATUS ---
        if is_urgent:
            status = "Urgent Investigation Recommended"
            explanation = (
                "One or more critical drinking water screening limits have been severely exceeded based on IS 10500:2012 standards. "
                "Immediate field inspection and sanitary survey are advised."
            )
            recommended_action = (
                "1. Temporarily advise community to boil or suspend raw consumption until confirmatory testing.\n"
                "2. Dispatch field officer for sanitary survey and source inspection.\n"
                "3. Collect water sample for accredited laboratory chemical and microbiological verification."
            )
        elif is_warning:
            status = "Threshold Exceeded - Additional Testing Recommended"
            explanation = (
                "One or more monitored parameters exceed desirable limits under IS 10500:2012. "
                "While not immediately hazardous, this indicates water quality deterioration."
            )
            recommended_action = (
                "1. Schedule source inspection within 48-72 hours.\n"
                "2. Check filtration and distribution infrastructure.\n"
                "3. Send water sample for full laboratory analysis."
            )
        elif is_anomaly:
            status = "Unusual Pattern Detected"
            explanation = (
                "Water parameters are within overall permissible bounds, but display a statistically unusual multivariate pattern "
                "or sudden shift compared to historical baseline."
            )
            recommended_action = (
                "1. Verify sensor calibration.\n"
                "2. Re-test within 24 hours to confirm whether deviation persists.\n"
                "3. Inspect vicinity for localized runoff or pipeline disturbance."
            )
        else:
            status = "Within Desirable Thresholds (Preliminary)"
            explanation = (
                "Monitored physical and chemical parameters (pH, Turbidity, TDS, Temp) comply with desirable drinking water thresholds "
                "of IS 10500:2012."
            )
            recommended_action = (
                "Continue routine surveillance. IMPORTANT: Physical sensor screening does NOT guarantee microbiological potability; "
                "maintain periodic scheduled laboratory testing."
            )

        return {
            "status": status,
            "triggering_parameters": json.dumps(triggers),
            "explanation": explanation,
            "rules_evaluated": "; ".join(rules_evaluated),
            "recommended_action": recommended_action,
            "data_quality_warning": "; ".join(data_quality_warnings) if data_quality_warnings else None,
            "anomaly_score": anomaly_score,
            "model_method": method_used
        }


screening_engine = ScreeningEngine()
