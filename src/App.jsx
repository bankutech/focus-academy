import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function RouteLoadingFallback() {
  return null;
}

function MainLayout() {
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
            <Routes>
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
            </Routes>
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
          <MainLayout />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
