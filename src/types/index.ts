export type UserRole = "Admin" | "Field Officer" | "Community Viewer";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export type SourceType =
  | "Borewell"
  | "Hand Pump"
  | "Public Tap"
  | "Storage Tank"
  | "Pipeline"
  | "Other";

export type ScreeningStatus =
  | "Within Desirable Thresholds (Preliminary)"
  | "Unusual Pattern Detected"
  | "Threshold Exceeded - Additional Testing Recommended"
  | "Urgent Investigation Recommended"
  | "Stale / Insufficient Data"
  | "No Data";

export interface WaterSource {
  id: number;
  source_code: string;
  name: string;
  source_type: SourceType;
  description?: string;
  locality: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  registration_date: string;
  last_inspection_date?: string;
  is_active: boolean;
  responsible_officer_id?: number;
  created_at: string;
  latest_screening_status?: ScreeningStatus | string;
  latest_measurement?: {
    id: number;
    timestamp: string;
    ph?: number;
    turbidity?: number;
    tds?: number;
    temperature?: number;
    electrical_conductivity?: number;
    is_simulated: boolean;
    provenance: string;
  } | null;
  active_alerts_count: number;
}

export interface Measurement {
  id: number;
  source_id: number;
  timestamp: string;
  ph?: number;
  turbidity?: number;
  temperature?: number;
  tds?: number;
  electrical_conductivity?: number;
  measurement_method: string;
  sensor_id?: string;
  operator_name?: string;
  calibration_info?: string;
  notes?: string;
  is_simulated: boolean;
  provenance: string;
  screening_status?: string;
  source_name?: string;
  source_code?: string;
}

export interface ScreeningResult {
  id: number;
  measurement_id: number;
  source_id: number;
  timestamp: string;
  status: ScreeningStatus;
  triggering_parameters?: string;
  explanation: string;
  rules_evaluated: string;
  recommended_action: string;
  data_quality_warning?: string;
  anomaly_score?: number;
  model_method: string;
  created_at: string;
  safety_disclaimer?: string;
}

export type AlertSeverity = "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "Active" | "Acknowledged" | "Resolved";

export interface Alert {
  id: number;
  alert_code: string;
  source_id: number;
  measurement_id?: number;
  category: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommended_action: string;
  status: AlertStatus;
  assigned_to_user_id?: number;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  source_name?: string;
  source_code?: string;
}

export type InspectionPriority = "Low" | "Medium" | "High" | "Urgent";
export type InspectionStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Awaiting Laboratory Result"
  | "Resolved"
  | "Cancelled";

export interface Inspection {
  id: number;
  inspection_code: string;
  source_id: number;
  alert_id?: number;
  title: string;
  assigned_officer_id?: number;
  priority: InspectionPriority;
  due_date?: string;
  status: InspectionStatus;
  observations?: string;
  corrective_actions?: string;
  notes?: string;
  lab_report_ref?: string;
  closed_at?: string;
  resolution_summary?: string;
  created_at: string;
  updated_at: string;
  source_name?: string;
  assigned_officer_name?: string;
}

export interface LaboratoryResult {
  id: number;
  lab_sample_id: string;
  source_id: number;
  collection_date: string;
  testing_date: string;
  laboratory_name: string;
  accredited_standard: string;
  coliform_bacteria: string;
  e_coli: string;
  heavy_metals_status: string;
  chemical_parameters?: string;
  verification_status: "Verified" | "Pending Review" | "Inconclusive";
  reviewer_name: string;
  notes?: string;
  report_file_ref?: string;
  created_at: string;
  source_name?: string;
}

export interface DashboardStats {
  total_sources: number;
  active_sources: number;
  sources_with_recent_readings: number;
  sources_requiring_followup: number;
  unresolved_alerts_count: number;
  critical_alerts_count: number;
  pending_inspections_count: number;
  total_measurements: number;
  stale_sources_count: number;
  screening_distribution: Record<string, number>;
  source_type_distribution: Record<string, number>;
  alert_severity_distribution: Record<string, number>;
  recent_readings: Array<{
    id: number;
    source_id: number;
    source_name: string;
    source_code: string;
    locality: string;
    timestamp: string;
    ph?: number;
    turbidity?: number;
    tds?: number;
    temperature?: number;
    screening_status: string;
    is_simulated: boolean;
    provenance: string;
  }>;
  recent_alerts: Array<{
    id: number;
    alert_code: string;
    source_id: number;
    source_name: string;
    category: string;
    severity: AlertSeverity;
    title: string;
    status: AlertStatus;
    created_at: string;
  }>;
  pending_inspections: Array<{
    id: number;
    inspection_code: string;
    title: string;
    source_name: string;
    priority: string;
    status: string;
    due_date?: string;
    assigned_officer: string;
  }>;
  compliance_summary: {
    rate_percentage: number;
    compliant_sources: number;
    total_active_screened: number;
    standard_reference: string;
  };
  safety_disclaimer: string;
}
