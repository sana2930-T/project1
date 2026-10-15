import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SourcesPage } from "./pages/SourcesPage";
import { SourceDetailPage } from "./pages/SourceDetailPage";
import { MapPage } from "./pages/MapPage";
import { MeasurementsPage } from "./pages/MeasurementsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { InspectionsPage } from "./pages/InspectionsPage";
import { LaboratoryPage } from "./pages/LaboratoryPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Main Application with DashboardLayout */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/sources/:id" element={<SourceDetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/laboratory" element={<LaboratoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
