import {
  User,
  WaterSource,
  Measurement,
  ScreeningResult,
  Alert,
  Inspection,
  LaboratoryResult,
  DashboardStats,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("jalrakshak_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // not JSON
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return {} as T;
}

export const api = {
  auth: {
    login: (payload: { username: string; password: string }) =>
      request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: () => request<User>("/auth/me"),
    getDemoUsers: () =>
      request<
        Array<{
          role: string;
          username: string;
          password: string;
          full_name: string;
          description: string;
        }>
      >("/auth/demo-users"),
  },

  dashboard: {
    get: () => request<DashboardStats>("/dashboard"),
  },

  sources: {
    getAll: (params?: {
      search?: string;
      source_type?: string;
      district?: string;
      screening_status?: string;
      is_active?: boolean;
    }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.source_type) q.append("source_type", params.source_type);
      if (params?.district) q.append("district", params.district);
      if (params?.screening_status) q.append("screening_status", params.screening_status);
      if (params?.is_active !== undefined) q.append("is_active", String(params.is_active));
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return request<WaterSource[]>(`/sources${queryStr}`);
    },
    getById: (id: number) => request<WaterSource>(`/sources/${id}`),
    create: (data: Partial<WaterSource>) =>
      request<WaterSource>("/sources", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<WaterSource>) =>
      request<WaterSource>(`/sources/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    archive: (id: number) =>
      request<{ message: string }>(`/sources/${id}`, {
        method: "DELETE",
      }),
    getMeasurements: (id: number) => request<Measurement[]>(`/sources/${id}/measurements`),
    getScreenings: (id: number) => request<ScreeningResult[]>(`/sources/${id}/screenings`),
  },

  measurements: {
    getAll: (params?: { source_id?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.source_id) q.append("source_id", String(params.source_id));
      if (params?.limit) q.append("limit", String(params.limit));
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return request<Measurement[]>(`/measurements${queryStr}`);
    },
    create: (data: any) =>
      request<Measurement>("/measurements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    simulate: (source_id: number, scenario: string) =>
      request<Measurement>("/measurements/simulate", {
        method: "POST",
        body: JSON.stringify({ source_id, scenario }),
      }),
  },

  screenings: {
    evaluate: (data: any) =>
      request<{
        status: string;
        explanation: string;
        rules_evaluated: string;
        recommended_action: string;
        data_quality_warning?: string;
        anomaly_score?: number;
        model_method: string;
        safety_disclaimer: string;
        triggering_parameters_list: string[];
      }>("/screenings/evaluate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getStandards: () => request<any>("/screenings/standards"),
  },

  alerts: {
    getAll: (params?: { severity?: string; status?: string; source_id?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.severity) q.append("severity", params.severity);
      if (params?.status) q.append("status", params.status);
      if (params?.source_id) q.append("source_id", String(params.source_id));
      if (params?.search) q.append("search", params.search);
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return request<Alert[]>(`/alerts${queryStr}`);
    },
    getById: (id: number) => request<Alert>(`/alerts/${id}`),
    acknowledge: (id: number) =>
      request<Alert>(`/alerts/${id}/acknowledge`, {
        method: "PATCH",
      }),
    resolve: (id: number, resolution_notes: string) =>
      request<Alert>(`/alerts/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution_notes }),
      }),
    getNotifications: () =>
      request<
        Array<{
          id: number;
          recipient_role: string;
          title: string;
          message: string;
          channel: string;
          delivery_status: string;
          created_at: string;
        }>
      >("/alerts/notifications"),
  },

  inspections: {
    getAll: (params?: { status?: string; priority?: string; source_id?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append("status", params.status);
      if (params?.priority) q.append("priority", params.priority);
      if (params?.source_id) q.append("source_id", String(params.source_id));
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return request<Inspection[]>(`/inspections${queryStr}`);
    },
    create: (data: Partial<Inspection>) =>
      request<Inspection>("/inspections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Inspection>) =>
      request<Inspection>(`/inspections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  laboratory: {
    getAll: (params?: { source_id?: number }) => {
      const q = new URLSearchParams();
      if (params?.source_id) q.append("source_id", String(params.source_id));
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return request<LaboratoryResult[]>(`/laboratory-results${queryStr}`);
    },
    create: (data: Partial<LaboratoryResult>) =>
      request<LaboratoryResult>("/laboratory-results", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  reports: {
    getSummary: () => request<any>("/reports/summary"),
    getExportUrl: (type: string) => `${API_BASE}/reports/export?type=${type}`,
  },
};
