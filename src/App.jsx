import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { StudentAuthProvider } from './context/StudentAuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileQuickBar from './components/common/MobileQuickBar';

import HomePage from './pages/HomePage';

const StudentDetailsPage = lazy(() => import('./pages/StudentDetailsPage'));
const StudentLoginPage = lazy(() => import('./pages/StudentLoginPage'));
const StudentRegisterPage = lazy(() => import('./pages/StudentRegisterPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const StudentProtectedRoute = lazy(() => import('./components/common/StudentProtectedRoute'));
const ExamPrepPage = lazy(() => import('./pages/ExamPrepPage'));
const BatchesPage = lazy(() => import('./pages/BatchesPage'));
const BatchDetailPage = lazy(() => import('./pages/BatchDetailPage'));
const EnrollPage = lazy(() => import('./pages/EnrollPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const FeesPage = lazy(() => import('./pages/FeesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#F8FAFC]"
    >
      <span
        aria-hidden="true"
        className="h-9 w-9 rounded-full border-2 border-[#E2E8F0] border-t-brand animate-spin"
      />
      <p className="text-sm font-semibold text-ink-soft">Loading this page…</p>
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans-body flex flex-col selection:bg-brand selection:text-white">
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
        <StudentAuthProvider>
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
                  <Route path="events" element={<AdminAuditLogsPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="*" element={<Navigate to="/admin-portal" replace />} />
                </Route>

                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/student-details" element={<StudentDetailsPage />} />
                  <Route path="/login" element={<StudentLoginPage />} />
                  <Route path="/student/login" element={<StudentLoginPage />} />
                  <Route path="/student-login" element={<StudentLoginPage />} />
                  <Route path="/student-portal/login" element={<StudentLoginPage />} />
                  <Route path="/portal/login" element={<Navigate to="/login" replace />} />
                  <Route path="/signup" element={<StudentRegisterPage />} />
                  <Route path="/register" element={<StudentRegisterPage />} />
                  <Route path="/student/register" element={<StudentRegisterPage />} />
                  <Route path="/student-register" element={<StudentRegisterPage />} />
                  <Route path="/student-portal/register" element={<StudentRegisterPage />} />
                  <Route
                    path="/student-dashboard"
                    element={
                      <StudentProtectedRoute>
                        <StudentDashboardPage />
                      </StudentProtectedRoute>
                    }
                  />
                  <Route
                    path="/student-portal"
                    element={
                      <StudentProtectedRoute>
                        <StudentDashboardPage />
                      </StudentProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/dashboard"
                    element={<Navigate to="/student-dashboard" replace />}
                  />
                  <Route
                    path="/student-portal/dashboard"
                    element={<Navigate to="/student-dashboard" replace />}
                  />
                  <Route
                    path="/student/portal"
                    element={<Navigate to="/student-dashboard" replace />}
                  />
                  <Route
                    path="/portal"
                    element={<Navigate to="/student-dashboard" replace />}
                  />
                  <Route
                    path="/portal/dashboard"
                    element={<Navigate to="/student-dashboard" replace />}
                  />
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
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </AppProvider>
        </StudentAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
