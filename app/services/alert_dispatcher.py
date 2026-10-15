import datetime
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from ..models import Alert, NotificationEvent, WaterSource, Measurement, User

class AlertDispatcher:
    def process_screening_alert(
        self,
        db: Session,
        source: WaterSource,
        measurement: Measurement,
        status: str,
        triggers: list,
        explanation: str,
        recommended_action: str
    ) -> Optional[Alert]:
        """
        Create alert if status warrants one, with deduplication against existing active alerts.
        """
        if status == "Within Desirable Thresholds (Preliminary)":
            return None

        # Determine Category & Severity
        if status == "Urgent Investigation Recommended":
            category = "Configured Threshold Exceeded"
            severity = "Critical"
            title = f"CRITICAL: Severe Threshold Exceedance at {source.name}"
        elif status == "Threshold Exceeded - Additional Testing Recommended":
            category = "Configured Threshold Exceeded"
            severity = "High"
            title = f"WARNING: Water Quality Threshold Exceeded at {source.name}"
        elif status == "Unusual Pattern Detected":
            category = "Sudden Measurement Change"
            severity = "Medium"
            title = f"NOTICE: Unusual Measurement Pattern at {source.name}"
        elif status == "Stale / Insufficient Data":
            category = "Missing Measurements"
            severity = "Low"
            title = f"DATA GAP: Incomplete Sensor Data for {source.name}"
        else:
            category = "Configured Threshold Exceeded"
            severity = "Medium"
            title = f"Water Quality Notice for {source.name}"

        # DEDUPLICATION: Check if active alert already exists with same category & source
        existing_active = db.query(Alert).filter(
            Alert.source_id == source.id,
            Alert.category == category,
            Alert.status == "Active"
        ).first()

        if existing_active:
            # Update existing active alert timestamp and triggering description without creating duplicates
            existing_active.description = (
                f"Updated Reading: {explanation}\nTriggers: {', '.join(triggers)}"
            )
            existing_active.measurement_id = measurement.id
            db.commit()
            return existing_active

        # Generate unique readable alert code
        alert_code = f"ALT-{datetime.datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        new_alert = Alert(
            alert_code=alert_code,
            source_id=source.id,
            measurement_id=measurement.id,
            category=category,
            severity=severity,
            title=title,
            description=f"{explanation}\nTriggers: {', '.join(triggers)}",
            recommended_action=recommended_action,
            status="Active",
            assigned_to_user_id=source.responsible_officer_id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        # Create In-App Notification Event
        notif = NotificationEvent(
            recipient_role="Field Officer",
            title=f"[{severity.upper()} ALERT] {source.name}",
            message=f"{title}: {explanation[:120]}...",
            channel="In-App",
            delivery_status="Delivered In-App"
        )
        db.add(notif)
        
        # Simulated SMS / Email event log (explicitly identified as local simulation)
        sim_notif = NotificationEvent(
            recipient_role="District Health Admin",
            title=f"SMS Gateway (Simulated): {alert_code}",
            message=f"Simulated dispatch to registered field team for source {source.source_code} ({source.locality})",
            channel="Simulated SMS",
            delivery_status="Simulated Event Logged (No External API Required)"
        )
        db.add(sim_notif)
        db.commit()

        return new_alert

    def check_stale_sources(self, db: Session, max_days: int = 7):
        """
        Check for sources that haven't received a measurement in max_days and raise alert if needed.
        """
        now = datetime.datetime.utcnow()
        cutoff = now - datetime.timedelta(days=max_days)
        sources = db.query(WaterSource).filter(WaterSource.is_active == True).all()

        for source in sources:
            latest_meas = db.query(Measurement).filter(
                Measurement.source_id == source.id
            ).order_by(Measurement.timestamp.desc()).first()

            is_stale = False
            days_ago = None
            if not latest_meas:
                is_stale = True
            elif latest_meas.timestamp < cutoff:
                is_stale = True
                days_ago = (now - latest_meas.timestamp).days

            if is_stale:
                existing = db.query(Alert).filter(
                    Alert.source_id == source.id,
                    Alert.category == "Stale Measurements",
                    Alert.status == "Active"
                ).first()

                if not existing:
                    alert_code = f"ALT-STL-{uuid.uuid4().hex[:6].upper()}"
                    msg = (
                        f"No water quality readings have been recorded for source '{source.name}' in over {days_ago or 'all'} days. "
                        "Sources without fresh surveillance cannot be screened for emergent risks."
                    )
                    alert = Alert(
                        alert_code=alert_code,
                        source_id=source.id,
                        category="Stale Measurements",
                        severity="Medium",
                        title=f"Surveillance Gap: Stale Data at {source.name}",
                        description=msg,
                        recommended_action="Dispatch field monitoring agent to test water source and log sensor parameters.",
                        status="Active",
                        assigned_to_user_id=source.responsible_officer_id,
                        created_at=now
                    )
                    db.add(alert)
                    db.commit()


alert_dispatcher = AlertDispatcher()
