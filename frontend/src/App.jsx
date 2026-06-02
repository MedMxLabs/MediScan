import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardLayout from './layout/DashboardLayout';
import PublicLayout from './layout/PublicLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

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
import JanAushadhiPage from './pages/JanAushadhiPage';

function PublicSearch() {
  return (
    <PublicLayout title="Search medicines" accent="teal">
      <SearchMedicinePage publicMode />
    </PublicLayout>
  );
}

function PublicUpload() {
  return (
    <PublicLayout title="Upload prescription" accent="lime">
      <UploadPrescriptionPage publicMode />
    </PublicLayout>
  );
}

function PublicCompare() {
  return (
    <PublicLayout title="Compare prices" accent="indigo">
      <MedicineComparisonPage publicMode />
    </PublicLayout>
  );
}

function PublicAssistant() {
  return (
    <PublicLayout title="AI assistant" accent="violet">
      <AiAssistantPage publicMode />
    </PublicLayout>
  );
}

function App() {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/search" element={<PublicSearch />} />
        <Route path="/upload" element={<PublicUpload />} />
        <Route path="/compare" element={<PublicCompare />} />
        <Route path="/assistant" element={<PublicAssistant />} />
        <Route path="/jan-aushadhi" element={<JanAushadhiPage publicMode />} />

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
          <Route path="jan-aushadhi" element={<JanAushadhiPage />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
