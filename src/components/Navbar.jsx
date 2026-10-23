import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Calculator, 
  Phone,
  Clock,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Courses', path: '/courses' },
    { name: 'Timings', path: '/timings' },
    { name: 'Fees', path: '/fees' },
    { name: 'Contact', path: '/contact' },
  ];

  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I would like to inquire about evening batch timings and admissions at Thiripura Complex, Thoramangalam.'
  )}`;

  const isNavActive = (path) => {
    const current = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') {
      return current === '/';
    }
    if (path === '/timings') {
      return current === '/timings' || current === '/batches' || current.startsWith('/batch/');
    }
    if (path === '/courses') {
      return current === '/courses' || current === '/classes';
    }
    return current === path;
  };

  const handleBrandClick = () => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="bg-[#0F172A] text-slate-200 text-xs py-2 px-4 border-b border-[#1E293B] tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-200 text-xs uppercase font-bold border border-orange-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse"></span>
              <span>Evening Batches</span>
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Mon – Sat: 4:00 PM – 9:00 PM
            </span>
            <span className="text-slate-400 hidden md:inline">
              Thiripura Complex, Thoramangalam, Perambalur
            </span>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-6 text-slate-300">
            <a 
              href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} 
              aria-label={`Call Focus Academy Campus Desk at ${CAMPUS_CONFIG.contact.primaryPhone}`}
              className="flex items-center space-x-1.5 text-orange-200 hover:text-white transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded"
            >
              <Phone className="w-3.5 h-3.5 text-[#EA580C]" />
              <span className="font-semibold">{CAMPUS_CONFIG.contact.primaryPhone}</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Direct chat on WhatsApp with Focus Academy coordinator"
              className="hidden sm:flex items-center space-x-1 text-emerald-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="font-semibold">WhatsApp Desk</span>
            </a>
            <span className="text-slate-600 hidden lg:inline">•</span>
            <Link 
              to="/fees"
              className="hidden lg:flex items-center space-x-1 hover:text-white transition-colors underline underline-offset-4 decoration-slate-600 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded"
            >
              <Calculator className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Fees</span>
            </Link>
          </div>
        </div>
      </div>

      <nav aria-label="Main Navigation" className={`w-full bg-white/95 backdrop-blur-md transition-all duration-300 border-b ${
        isScrolled 
          ? 'border-[#E2E8F0] shadow-xs py-3' 
          : 'border-[#E2E8F0]/80 py-3.5 sm:py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                onClick={handleBrandClick}
                className="flex items-center space-x-3 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-md"
              >
                <img 
                  src="/logo.png" 
                  alt="Focus Academy Logo" 
                  className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-md" 
                />
                <div className="flex flex-col text-left">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                    Focus Academy
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#64748B] leading-none mt-1 font-semibold">
                    Thoramangalam • Perambalur
                  </span>
                </div>
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-1 font-medium text-xs">
              {navLinks.map((link) => {
                const active = isNavActive(link.path);

                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    end={link.path === '/'}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] ${
                      active
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                    }`}
                  >
                    {link.name}
                  </NavLink>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/student-details"
                className="hidden sm:inline-flex items-center space-x-2 px-4 sm:px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs hover:bg-[#C2410C] transition-all duration-200 cursor-pointer active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
              >
                <span>Check Batch Seats</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-200" />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#0F172A] hover:bg-slate-100 border border-[#E2E8F0] transition-colors cursor-pointer bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs z-40 lg:hidden"
          />

          <div 
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="absolute top-full left-0 right-0 max-h-[calc(100vh-100%)] max-h-[calc(100dvh-100%)] overflow-y-auto overscroll-contain z-50 lg:hidden bg-[#F8FAFC] border-b border-[#E2E8F0] shadow-md px-4 pt-3 pb-28 sm:pb-12 animate-in slide-in-from-top duration-200 space-y-4 text-left"
          >
            <div className="p-3.5 bg-white rounded-md border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center space-x-2 text-xs uppercase text-[#EA580C] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Evening Batches: 4:00 PM – 9:00 PM</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                Thiripura Complex, Main Road (via Four Roads), Near Malar Hospital, Perambalur.
              </p>
            </div>

            <div className="space-y-1.5">
              {navLinks.map((link) => {
                const active = isNavActive(link.path);
                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    end={link.path === '/'}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-3 rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white hover:bg-slate-50 text-[#0F172A] border-[#E2E8F0]'
                    } focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]`}
                  >
                    <span className="text-sm font-bold">{link.name}</span>
                    <ArrowRight className={`w-4 h-4 ${active ? 'text-orange-200' : 'text-[#EA580C]'}`} />
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                aria-label={`Call Campus Desk at ${CAMPUS_CONFIG.contact.primaryPhone}`}
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-3 py-3 bg-white text-[#0F172A] font-semibold rounded-md text-xs border border-[#E2E8F0] shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
              >
                <Phone className="w-4 h-4 text-[#EA580C]" />
                <span>Call Campus Desk: {CAMPUS_CONFIG.contact.primaryPhone}</span>
              </a>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Direct chat on WhatsApp with Focus Academy coordinator"
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-3 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-md text-xs shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp Directly</span>
              </a>
              
              <Link
                to="/student-details"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-4 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-md text-xs sm:text-sm shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] text-center mb-2"
              >
                <span>Check Batch Seats & Timings →</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
