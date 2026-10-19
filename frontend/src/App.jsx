import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PublicLayout from './layout/PublicLayout';
import LandingPage from './pages/LandingPage';
import PwaShell from './components/pwa/PwaShell';
import LoadingState from './components/dashboard/LoadingState';

const DashboardLayout = lazy(() => import('./layout/DashboardLayout'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchMedicinePage = lazy(() => import('./pages/SearchMedicinePage'));
const MedicineComparisonPage = lazy(() => import('./pages/MedicineComparisonPage'));
const UploadPrescriptionPage = lazy(() => import('./pages/UploadPrescriptionPage'));
const MedicineHistoryPage = lazy(() => import('./pages/MedicineHistoryPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const AdherenceTrackingPage = lazy(() => import('./pages/AdherenceTrackingPage'));
const LabReportAnalysisPage = lazy(() => import('./pages/LabReportAnalysisPage'));
const AiAssistantPage = lazy(() => import('./pages/AiAssistantPage'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'));
const NearbyPharmacyPage = lazy(() => import('./pages/NearbyPharmacyPage'));
const JanAushadhiPage = lazy(() => import('./pages/JanAushadhiPage'));

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
      <PwaShell />
      <Suspense fallback={<LoadingState />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
