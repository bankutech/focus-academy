import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileQuickBar from './components/common/MobileQuickBar';

import HomePage from './pages/HomePage';

const StudentDetailsPage = lazy(() => import('./pages/StudentDetailsPage'));
const ExamPrepPage = lazy(() => import('./pages/ExamPrepPage'));
const BatchesPage = lazy(() => import('./pages/BatchesPage'));
const BatchDetailPage = lazy(() => import('./pages/BatchDetailPage'));
const EnrollPage = lazy(() => import('./pages/EnrollPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const FeesPage = lazy(() => import('./pages/FeesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminProtectedRoute = lazy(() => import('./pages/admin/AdminProtectedRoute'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminLeadsPage = lazy(() => import('./pages/admin/AdminLeadsPage'));
const AdminBatchesPage = lazy(() => import('./pages/admin/AdminBatchesPage'));
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage'));
const AdminFeesPage = lazy(() => import('./pages/admin/AdminFeesPage'));
const AdminLedgerPage = lazy(() => import('./pages/admin/AdminLedgerPage'));
const AdminRemindersPage = lazy(() => import('./pages/admin/AdminRemindersPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

function RouteLoadingFallback() {
  return null;
}

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans-body flex flex-col selection:bg-[#EA580C] selection:text-white">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0F172A] focus:text-white focus:rounded-xl focus:shadow-editorial text-xs font-bold"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <Navbar />

      <main id="main-content" tabIndex="-1" className="flex-1 focus:outline-hidden">
        <ErrorBoundary title="Focus Academy Page Router">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      <MobileQuickBar />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary title="Focus Academy Application">
      <BrowserRouter>
        <AppProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/admin-portal/login" element={<AdminLoginPage />} />
              <Route
                path="/admin-portal"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="batches" element={<AdminBatchesPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="fees" element={<AdminFeesPage />} />
                <Route path="ledger" element={<AdminLedgerPage />} />
                <Route path="reminders" element={<AdminRemindersPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="*" element={<Navigate to="/admin-portal" replace />} />
              </Route>

              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/student-details" element={<StudentDetailsPage />} />
                <Route path="/login" element={<StudentDetailsPage />} />
                <Route path="/signup" element={<StudentDetailsPage />} />
                <Route path="/exam-prep" element={<ExamPrepPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/batch/:batchId" element={<BatchDetailPage />} />
                <Route path="/timings" element={<BatchesPage />} />
                <Route path="/enroll" element={<EnrollPage />} />
                <Route path="/enroll/:batchId" element={<EnrollPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/classes" element={<CoursesPage />} />
                <Route path="/faculty" element={<Navigate to="/batches" replace />} />
                <Route path="/fees" element={<FeesPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
