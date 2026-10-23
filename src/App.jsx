import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileQuickBar from './components/common/MobileQuickBar';
import LoadingScreen from './components/common/LoadingScreen';

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
  return <LoadingScreen message="Loading Focus Academy portal..." />;
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans-body flex flex-col selection:bg-[#EA580C] selection:text-white overflow-x-hidden">
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
  const [showInitialSplash, setShowInitialSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      const exitTimer = setTimeout(() => {
        setShowInitialSplash(false);
      }, 450);
      return () => clearTimeout(exitTimer);
    }, 2100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary title="Focus Academy Application">
      <BrowserRouter>
        <AppProvider>
          {showInitialSplash && (
            <div 
              className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
                splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <LoadingScreen message="Preparing small-batch academic portal..." initialMode />
            </div>
          )}
          <MainLayout />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
