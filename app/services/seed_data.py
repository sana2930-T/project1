import datetime
import json
from sqlalchemy.orm import Session
from ..models import (
    User, WaterSource, Measurement, ScreeningResult, Alert, Inspection,
    LaboratoryResult, NotificationEvent, AuditLog
)
from .auth_service import hash_password
from .screening_engine import screening_engine

def seed_database(db: Session):
    """Seed comprehensive demonstration data for JalRakshak AI."""
    
    # Check if already seeded
    if db.query(User).first():
        return

    print("Seeding JalRakshak AI database...")

    # 1. USERS
    admin_user = User(
        username="admin",
        email="admin@jalrakshak.org",
        hashed_password=hash_password("admin123"),
        full_name="Rajesh Sharma (Director)",
        role="Admin",
        department="Central Water Risk Commission",
        phone="+91 98765 43210"
    )
    db.add(admin_user)

    officer_user = User(
        username="officer",
        email="officer@jalrakshak.org",
        hashed_password=hash_password("officer123"),
        full_name="Ananya Desai (Field Officer)",
        role="Field Officer",
        department="Rural Water Supply Division",
        phone="+91 98111 22334"
    )
    db.add(officer_user)

    viewer_user = User(
        username="viewer",
        email="viewer@jalrakshak.org",
        hashed_password=hash_password("viewer123"),
        full_name="Sanjay Patel (Panchayat Member)",
        role="Community Viewer",
        department="Gram Panchayat Council",
        phone="+91 94222 33445"
    )
    db.add(viewer_user)
    db.commit()
    db.refresh(admin_user)
    db.refresh(officer_user)

    # 2. WATER SOURCES
    sources_data = [
        {
            "source_code": "JAL-MAH-001",
            "name": "Shivaji Nagar Public Borewell",
            "source_type": "Borewell",
            "description": "Primary deep groundwater borewell serving 450 households in Ward 4.",
            "locality": "Shivaji Nagar Gaothan",
            "district": "Pune",
            "state": "Maharashtra",
            "latitude": 18.5308,
            "longitude": 73.8474,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-UP-002",
            "name": "Dashashwamedh Community Tap",
            "source_type": "Public Tap",
            "description": "Municipal piped tap distribution near central ghat area.",
            "locality": "Dashashwamedh Chowk",
            "district": "Varanasi",
            "state": "Uttar Pradesh",
            "latitude": 25.3076,
            "longitude": 83.0084,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-RAJ-003",
            "name": "Amer Village Hand Pump #4",
            "source_type": "Hand Pump",
            "description": "Shallow aquifer community hand pump serving rural periphery.",
            "locality": "Amer Kalan",
            "district": "Jaipur",
            "state": "Rajasthan",
            "latitude": 26.9855,
            "longitude": 75.8513,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-TN-004",
            "name": "Singanallur Elevated Storage Tank",
            "source_type": "Storage Tank",
            "description": "50,000 Litre elevated chlorination and distribution reservoir.",
            "locality": "Singanallur Main Road",
            "district": "Coimbatore",
            "state": "Tamil Nadu",
            "latitude": 11.0016,
            "longitude": 77.0142,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-JHK-005",
            "name": "Morabadi Feeder Pipeline Valve #2",
            "source_type": "Pipeline",
            "description": "Transmission pipeline junction feeding Subarnarekha treated surface water.",
            "locality": "Morabadi Hills",
            "district": "Ranchi",
            "state": "Jharkhand",
            "latitude": 23.3888,
            "longitude": 85.3347,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-KAR-006",
            "name": "Whitefield Tubewell #12",
            "source_type": "Borewell",
            "description": "Peri-urban secondary borewell for school and public health clinic.",
            "locality": "Kadugodi Colony",
            "district": "Bengaluru",
            "state": "Karnataka",
            "latitude": 12.9698,
            "longitude": 77.7499,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-WB-007",
            "name": "Howrah Ferry Riverfront Tap",
            "source_type": "Public Tap",
            "description": "Public standpost near ferry transit hub.",
            "locality": "Ferry Ghat Rd",
            "district": "Howrah",
            "state": "West Bengal",
            "latitude": 22.5850,
            "longitude": 88.3426,
            "responsible_officer_id": officer_user.id
        },
        {
            "source_code": "JAL-MP-008",
            "name": "Narmada Canal Intake Station",
            "source_type": "Storage Tank",
            "description": "Raw water holding reservoir before filtration intake.",
            "locality": "Setani Ghat Outer",
            "district": "Hoshangabad",
            "state": "Madhya Pradesh",
            "latitude": 22.7533,
            "longitude": 77.7289,
            "responsible_officer_id": officer_user.id
        }
    ]

    created_sources = {}
    now = datetime.datetime.utcnow()

    for s_data in sources_data:
        src = WaterSource(
            **s_data,
            registration_date=now - datetime.timedelta(days=120),
            last_inspection_date=now - datetime.timedelta(days=15),
            is_active=True
        )
        db.add(src)
        db.commit()
        db.refresh(src)
        created_sources[src.source_code] = src

    # 3. MEASUREMENTS & SCREENING (Generate rich baseline history)
    # Source 1: Shivaji Nagar - Healthy Compliant Baseline
    s1 = created_sources["JAL-MAH-001"]
    for i in range(10, 0, -1):
        t = now - datetime.timedelta(days=i * 2, hours=3)
        meas = Measurement(
            source_id=s1.id,
            timestamp=t,
            ph=7.2 + (i % 3) * 0.1,
            turbidity=0.4 + (i % 2) * 0.15,
            temperature=24.5 + (i % 2) * 0.5,
            tds=280.0 + (i * 5),
            electrical_conductivity=420.0 + (i * 8),
            measurement_method="Simulated Sensor" if i > 3 else "Manual",
            sensor_id="SEN-MAH-01",
            operator_name="Ananya Desai",
            calibration_info="Calibrated with 7.0/4.0 buffer solutions",
            notes="Normal stable clear discharge.",
            is_simulated=True if i > 3 else False,
            provenance="Automated Telemetry Node"
        )
        db.add(meas)
        db.commit()
        db.refresh(meas)
        # Evaluate screening
        res = screening_engine.evaluate(meas, s1.measurements)
        scr = ScreeningResult(
            measurement_id=meas.id,
            source_id=s1.id,
            timestamp=meas.timestamp,
            **res
        )
        db.add(scr)
        db.commit()

    # Source 2: Dashashwamedh - Turbidity Monsoon Spike
    s2 = created_sources["JAL-UP-002"]
    for i in range(8, 0, -1):
        t = now - datetime.timedelta(days=i * 3)
        # Latest reading has heavy turbidity surge
        turb_val = 6.4 if i == 1 else (0.8 + (i % 3) * 0.2)
        meas = Measurement(
            source_id=s2.id,
            timestamp=t,
            ph=7.4,
            turbidity=turb_val,
            temperature=26.0,
            tds=340.0,
            electrical_conductivity=510.0,
            measurement_method="Manual",
            sensor_id="SEN-UP-02",
            operator_name="Devendra Kumar",
            notes="Turbidity spike observed following intense upstream rainfall." if i == 1 else "Normal piped delivery",
            is_simulated=False,
            provenance="Field Turbidimeter"
        )
        db.add(meas)
        db.commit()
        db.refresh(meas)
        res = screening_engine.evaluate(meas, s2.measurements)
        scr = ScreeningResult(
            measurement_id=meas.id,
            source_id=s2.id,
            timestamp=meas.timestamp,
            **res
        )
        db.add(scr)
        db.commit()

    # Source 3: Amer Hand Pump - High TDS Saline Aquifer
    s3 = created_sources["JAL-RAJ-003"]
    for i in range(6, 0, -1):
        t = now - datetime.timedelta(days=i * 4)
        meas = Measurement(
            source_id=s3.id,
            timestamp=t,
            ph=7.9,
            turbidity=1.2,
            temperature=28.0,
            tds=780.0 if i == 1 else 690.0,
            electrical_conductivity=1250.0,
            measurement_method="Manual",
            sensor_id="SEN-RAJ-03",
            operator_name="Ananya Desai",
            notes="Noticeable saline taste reported by villagers.",
            is_simulated=False,
            provenance="Field Conductivity/TDS Meter"
        )
        db.add(meas)
        db.commit()
        db.refresh(meas)
        res = screening_engine.evaluate(meas, s3.measurements)
        scr = ScreeningResult(
            measurement_id=meas.id,
            source_id=s3.id,
            timestamp=meas.timestamp,
            **res
        )
        db.add(scr)
        db.commit()

    # Source 4: Singanallur Storage Tank - Acidic Runoff Warning
    s4 = created_sources["JAL-TN-004"]
    for i in range(7, 0, -1):
        t = now - datetime.timedelta(days=i * 2)
        # Latest reading is acidic pH 5.4 (Critical)
        ph_val = 5.4 if i == 1 else (6.8 + (i % 2) * 0.2)
        meas = Measurement(
            source_id=s4.id,
            timestamp=t,
            ph=ph_val,
            turbidity=1.1,
            temperature=27.2,
            tds=410.0,
            electrical_conductivity=620.0,
            measurement_method="Simulated Sensor",
            sensor_id="SEN-TN-04",
            operator_name="K. Murugan",
            notes="Abnormal acidic pH recorded during morning distribution test." if i == 1 else "Routine chlorinated storage reading.",
            is_simulated=True,
            provenance="Online Multiparameter Probe"
        )
        db.add(meas)
        db.commit()
        db.refresh(meas)
        res = screening_engine.evaluate(meas, s4.measurements)
        scr = ScreeningResult(
            measurement_id=meas.id,
            source_id=s4.id,
            timestamp=meas.timestamp,
            **res
        )
        db.add(scr)
        db.commit()

    # Source 5: Morabadi Pipeline - Normal Treated Surface Water
    s5 = created_sources["JAL-JHK-005"]
    for i in range(5, 0, -1):
        t = now - datetime.timedelta(days=i * 3)
        meas = Measurement(
            source_id=s5.id,
            timestamp=t,
            ph=7.1,
            turbidity=0.6,
            temperature=22.5,
            tds=195.0,
            electrical_conductivity=310.0,
            measurement_method="Manual",
            sensor_id="SEN-JHK-05",
            operator_name="Pooja Tirkey",
            notes="Clean distribution line test.",
            is_simulated=False,
            provenance="Field Kit"
        )
        db.add(meas)
        db.commit()
        db.refresh(meas)
        res = screening_engine.evaluate(meas, s5.measurements)
        scr = ScreeningResult(
            measurement_id=meas.id,
            source_id=s5.id,
            timestamp=meas.timestamp,
            **res
        )
        db.add(scr)
        db.commit()

    # Source 6: Whitefield - Stale Data (Last reading 21 days ago)
    s6 = created_sources["JAL-KAR-006"]
    t_stale = now - datetime.timedelta(days=21)
    meas = Measurement(
        source_id=s6.id,
        timestamp=t_stale,
        ph=7.0,
        turbidity=0.9,
        temperature=25.0,
        tds=310.0,
        electrical_conductivity=480.0,
        measurement_method="Manual",
        sensor_id="SEN-KAR-06",
        operator_name="R. Gowda",
        notes="Older routine test; telemetry node has been offline.",
        is_simulated=False,
        provenance="Field Handheld"
    )
    db.add(meas)
    db.commit()
    db.refresh(meas)
    res = screening_engine.evaluate(meas, s6.measurements)
    scr = ScreeningResult(
        measurement_id=meas.id,
        source_id=s6.id,
        timestamp=meas.timestamp,
        **res
    )
    db.add(scr)
    db.commit()

    # 4. ALERTS
    # Critical Alert on Singanallur Storage Tank (Acidic pH)
    alt1 = Alert(
        alert_code="ALT-261014-TN04A1",
        source_id=s4.id,
        category="Configured Threshold Exceeded",
        severity="Critical",
        title=f"CRITICAL: Severely Acidic pH (5.40) at {s4.name}",
        description="Acidic pH of 5.40 breaches IS 10500:2012 permissible limits (6.5 - 8.5). Potential industrial contamination or chemical dosing malfunction.",
        recommended_action="1. Issue immediate advisory to withhold raw drinking.\n2. Dispatch inspection team to inspect chlorination dosing unit.\n3. Expedite confirmatory lab sample.",
        status="Active",
        assigned_to_user_id=officer_user.id,
        created_at=now - datetime.timedelta(hours=6)
    )
    db.add(alt1)

    # High Alert on Dashashwamedh Tap (Turbidity Exceeded)
    alt2 = Alert(
        alert_code="ALT-261013-UP02A2",
        source_id=s2.id,
        category="Configured Threshold Exceeded",
        severity="High",
        title=f"WARNING: Turbidity (6.4 NTU) exceeds limit at {s2.name}",
        description="Turbidity exceeds the IS 10500 maximum permissible limit of 5.0 NTU. Suspended particulates may shield waterborne bacteria from disinfection.",
        recommended_action="Flush distribution pipeline, check intake filtration screen, and recommend boiling for consumers.",
        status="Active",
        assigned_to_user_id=officer_user.id,
        created_at=now - datetime.timedelta(hours=22)
    )
    db.add(alt2)

    # Medium Alert on Amer Hand Pump (High TDS)
    alt3 = Alert(
        alert_code="ALT-261011-RJ03A3",
        source_id=s3.id,
        category="Configured Threshold Exceeded",
        severity="Medium",
        title=f"NOTICE: Elevated TDS (780 mg/L) at {s3.name}",
        description="Total Dissolved Solids exceeds desirable threshold (500 mg/L) though within max permissible limit (2000 mg/L).",
        recommended_action="Monitor seasonal aquifer salinity changes and conduct periodic fluoride testing.",
        status="Acknowledged",
        assigned_to_user_id=officer_user.id,
        acknowledged_at=now - datetime.timedelta(days=1),
        created_at=now - datetime.timedelta(days=2)
    )
    db.add(alt3)

    # Resolved Historical Alert
    alt4 = Alert(
        alert_code="ALT-261001-MH01R4",
        source_id=s1.id,
        category="Sudden Measurement Change",
        severity="Medium",
        title=f"Resolved: Transient Turbidity Spike at {s1.name}",
        description="Temporary cloudiness after borehole motor repair. Subsided to 0.45 NTU after 2 hours of well purging.",
        recommended_action="Purge well and verify stable readings.",
        status="Resolved",
        assigned_to_user_id=officer_user.id,
        acknowledged_at=now - datetime.timedelta(days=12),
        resolved_at=now - datetime.timedelta(days=11),
        resolution_notes="Well purging completed. Subsequent 3 tests confirmed turbidity < 0.5 NTU. Closed.",
        created_at=now - datetime.timedelta(days=13)
    )
    db.add(alt4)

    # Stale Alert on Whitefield
    alt5 = Alert(
        alert_code="ALT-261005-KR06S5",
        source_id=s6.id,
        category="Stale Measurements",
        severity="Medium",
        title=f"Surveillance Gap: No Fresh Readings at {s6.name}",
        description="Over 21 days have elapsed since last recorded measurement. Reliable screening cannot be maintained without active data.",
        recommended_action="Assign field visit to replace probe batteries and re-establish telemetry connection.",
        status="Active",
        assigned_to_user_id=officer_user.id,
        created_at=now - datetime.timedelta(days=7)
    )
    db.add(alt5)
    db.commit()

    # 5. INSPECTIONS
    insp1 = Inspection(
        inspection_code="INSP-2026-001",
        source_id=s4.id,
        alert_id=alt1.id,
        title="Sanitary Survey & Chemical Feed Inspection - Singanallur Reservoir",
        assigned_officer_id=officer_user.id,
        priority="Urgent",
        due_date=now + datetime.timedelta(days=1),
        status="In Progress",
        observations="Field team arrived at site. Visual inspection revealed corrosive chemical residue around dosing intake pump. Secondary inlet valve is partially corroded.",
        corrective_actions="Isolated dosing intake valve #3. Switched reservoir flow to backup clean line while repairs continue.",
        notes="Water sample collected at 09:30 AM and dispatched under ice pack to District Water Laboratory.",
        lab_report_ref="REF-LAB-CBE-2026-889"
    )
    db.add(insp1)

    insp2 = Inspection(
        inspection_code="INSP-2026-002",
        source_id=s2.id,
        alert_id=alt2.id,
        title="Piped Network Turbidity & Backwash Investigation",
        assigned_officer_id=officer_user.id,
        priority="High",
        due_date=now + datetime.timedelta(days=2),
        status="Assigned",
        observations="Assigned to municipal engineer to check rapid sand filters at water works.",
        corrective_actions="Scheduled pipe scouring and backwash cycle for Sector 2 mains.",
        notes="Coordination with Varanasi Jal Sansthan in progress."
    )
    db.add(insp2)

    insp3 = Inspection(
        inspection_code="INSP-2026-003",
        source_id=s1.id,
        alert_id=alt4.id,
        title="Post-Maintenance Sanitary Verification - Shivaji Nagar Borewell",
        assigned_officer_id=officer_user.id,
        priority="Medium",
        due_date=now - datetime.timedelta(days=10),
        status="Resolved",
        observations="Sanitary seal on borewell casing intact. Surrounding concrete apron clean with no stagnant surface pooling.",
        corrective_actions="Disinfected casing collar with 50 ppm hypochlorite solution. Purged discharge for 45 minutes.",
        notes="Follow-up measurements confirmed pH 7.25, Turbidity 0.42 NTU.",
        closed_at=now - datetime.timedelta(days=11),
        resolution_summary="Source apron verified clean, well disinfected, physical readings returned to baseline normal."
    )
    db.add(insp3)
    db.commit()

    # 6. LABORATORY RESULTS
    # Verified Laboratory Report for Shivaji Nagar (showing microbiological parameters)
    lab1 = LaboratoryResult(
        lab_sample_id="LAB-PUN-2026-4401",
        source_id=s1.id,
        collection_date=now - datetime.timedelta(days=10),
        testing_date=now - datetime.timedelta(days=9),
        laboratory_name="Maharashtra State Public Health Laboratory, Pune (NABL Accredited)",
        accredited_standard="IS 10500:2012",
        coliform_bacteria="Absent / 100ml (Compliant)",
        e_coli="Absent / 100ml (Compliant)",
        heavy_metals_status="Lead < 0.01 mg/L, Arsenic < 0.01 mg/L (All below limits)",
        chemical_parameters=json.dumps({
            "Fluoride": "0.6 mg/L (Limit 1.0 mg/L)",
            "Nitrate": "18.2 mg/L (Limit 45 mg/L)",
            "Chloride": "85.0 mg/L (Limit 250 mg/L)",
            "Total Hardness": "190 mg/L (Limit 200 mg/L)",
            "Iron": "0.12 mg/L (Limit 0.3 mg/L)"
        }),
        verification_status="Verified",
        reviewer_name="Dr. V. K. Gokhale (Senior Water Microbiologist)",
        notes="Official Laboratory Finding: Water sample conforms to microbiological and chemical specifications of IS 10500:2012 for drinking water purposes.",
        report_file_ref="DOC-CERT-NABL-2026-092.pdf"
    )
    db.add(lab1)

    # Laboratory Report for Amer Hand Pump (Elevated TDS, Fluoride testing)
    lab2 = LaboratoryResult(
        lab_sample_id="LAB-JPR-2026-1184",
        source_id=s3.id,
        collection_date=now - datetime.timedelta(days=20),
        testing_date=now - datetime.timedelta(days=18),
        laboratory_name="Rajasthan State Referral Water Testing Laboratory, Jaipur",
        accredited_standard="IS 10500:2012",
        coliform_bacteria="Absent / 100ml",
        e_coli="Absent / 100ml",
        heavy_metals_status="Below Detectable Limits",
        chemical_parameters=json.dumps({
            "Fluoride": "1.3 mg/L (Permissible limit 1.5 mg/L)",
            "Nitrate": "32.0 mg/L (Limit 45 mg/L)",
            "Chloride": "240 mg/L (Limit 250 mg/L)",
            "Total Hardness": "340 mg/L (Permissible limit 600 mg/L)"
        }),
        verification_status="Verified",
        reviewer_name="Dr. Sunita Rathore (Chief Chemist)",
        notes="Microbiologically safe at time of sampling. High TDS and moderately high fluoride noted. Periodic fluoride surveillance recommended.",
        report_file_ref="DOC-CERT-RAJ-2026-441.pdf"
    )
    db.add(lab2)
    db.commit()

    # 7. NOTIFICATION EVENTS
    notifs = [
        NotificationEvent(
            recipient_role="Field Officer",
            title="[CRITICAL ALERT] Singanallur Elevated Storage Tank",
            message="CRITICAL: Severely Acidic pH (5.40). Immediate field inspection dispatched.",
            channel="In-App",
            delivery_status="Delivered In-App"
        ),
        NotificationEvent(
            recipient_role="Field Officer",
            title="[WARNING] Dashashwamedh Community Tap",
            message="Turbidity 6.4 NTU exceeds permissible limit. Check filtration.",
            channel="In-App",
            delivery_status="Delivered In-App"
        ),
        NotificationEvent(
            recipient_role="Admin",
            title="Surveillance Gap Notification",
            message="Source Whitefield Tubewell #12 has had no measurement for 21 days.",
            channel="In-App",
            delivery_status="Delivered In-App"
        )
    ]
    for n in notifs:
        db.add(n)

    # 8. AUDIT LOGS
    audits = [
        AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            details="JalRakshak AI surveillance node initialized with IS 10500:2012 standard baseline."
        ),
        AuditLog(
            user_id=officer_user.id,
            action="SOURCE_REGISTER",
            entity_type="WATER_SOURCE",
            entity_id=s1.source_code,
            details="Registered Shivaji Nagar Public Borewell."
        ),
        AuditLog(
            user_id=officer_user.id,
            action="ALERT_ACKNOWLEDGE",
            entity_type="ALERT",
            entity_id=alt3.alert_code,
            details="Acknowledged elevated TDS alert."
        )
    ]
    for a in audits:
        db.add(a)

    db.commit()
    print("Database seeding completed successfully!")
