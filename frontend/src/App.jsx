import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardLayout from './layout/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import DashboardPage from './pages/DashboardPage';
import SearchMedicinePage from './pages/SearchMedicinePage';
import MedicineComparisonPage from './pages/MedicineComparisonPage';
import UploadPrescriptionPage from './pages/UploadPrescriptionPage';
import MedicineHistoryPage from './pages/MedicineHistoryPage';
import RemindersPage from './pages/RemindersPage';
import AdherenceTrackingPage from './pages/AdherenceTrackingPage';
import LabReportAnalysisPage from './pages/LabReportAnalysisPage';
import AiAssistantPage from './pages/AiAssistantPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import NearbyPharmacyPage from './pages/NearbyPharmacyPage';

function App() {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth — full-screen, no marketing chrome */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* App dashboard */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="search" element={<SearchMedicinePage />} />
          <Route path="compare" element={<MedicineComparisonPage />} />
          <Route path="upload" element={<UploadPrescriptionPage />} />
          <Route path="history" element={<MedicineHistoryPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="adherence" element={<AdherenceTrackingPage />} />
          <Route path="reports" element={<LabReportAnalysisPage />} />
          <Route path="assistant" element={<AiAssistantPage />} />
          <Route path="pharmacies" element={<NearbyPharmacyPage />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
