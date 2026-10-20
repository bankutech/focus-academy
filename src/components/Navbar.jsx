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
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      <div className="bg-[#181614] text-[#FAF7F2] text-[11px] font-code-mono py-2 px-4 border-b border-[#2A2623] tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#C2410C]/25 text-[#FED7AA] text-[10px] uppercase font-bold border border-[#C2410C]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse"></span>
              <span>Evening Batches</span>
            </span>
            <span className="text-[#E7E5E4] font-medium hidden sm:inline">
              Mon – Sat: 4:00 PM – 9:00 PM
            </span>
            <span className="text-[#A8A29E] hidden md:inline">
              Thiripura Complex, Thoramangalam, Perambalur
            </span>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-6 text-[#A8A29E]">
            <a 
              href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} 
              aria-label={`Call Focus Academy Campus Desk at ${CAMPUS_CONFIG.contact.primaryPhone}`}
              className="flex items-center space-x-1.5 text-[#FED7AA] hover:text-white transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
            >
              <Phone className="w-3 h-3 text-[#C2410C]" />
              <span className="font-semibold">{CAMPUS_CONFIG.contact.primaryPhone}</span>
            </a>
            <span className="text-[#44403C] hidden sm:inline">•</span>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Direct chat on WhatsApp with Focus Academy coordinator"
              className="hidden sm:flex items-center space-x-1 text-emerald-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              <MessageSquare className="w-3 h-3 text-[#25D366]" />
              <span className="font-semibold">WhatsApp Desk</span>
            </a>
            <span className="text-[#44403C] hidden lg:inline">•</span>
            <Link 
              to="/fees"
              className="hidden lg:flex items-center space-x-1 hover:text-[#FAF7F2] transition-colors underline underline-offset-4 decoration-[#44403C] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
            >
              <Calculator className="w-3 h-3 text-[#C2410C]" />
              <span>Fees</span>
            </Link>
          </div>
        </div>
      </div>

      <nav aria-label="Main Navigation" className={`w-full bg-[#FAF7F2]/95 backdrop-blur-md transition-all duration-300 border-b ${
        isScrolled 
          ? 'border-[#E8E2D8] shadow-editorial py-3' 
          : 'border-[#E8E2D8]/80 py-3.5 sm:py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                onClick={handleBrandClick}
                className="flex items-center space-x-3 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded-2xl"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#181614] flex items-center justify-center text-[#FAF7F2] shadow-sm group-hover:bg-[#C2410C] transition-colors duration-200">
                  <span className="font-editorial text-xl italic font-bold">F</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#181614] leading-tight">
                    Focus Academy
                  </span>
                  <span className="font-code-mono text-[9px] uppercase tracking-wider text-[#78716C] leading-none mt-0.5 font-semibold">
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
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C] ${
                      active
                        ? 'bg-[#181614] text-white shadow-xs'
                        : 'text-[#57534E] hover:text-[#181614] hover:bg-[#F4EFEA]'
                    }`}
                  >
                    {link.name}
                  </NavLink>
                );
              })}
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to="/student-details"
                className="inline-flex items-center space-x-2 px-4 sm:px-5 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-editorial hover:shadow-editorial-lg transition-all duration-200 cursor-pointer active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
              >
                <span>Check Batch Seats</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FED7AA]" />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="lg:hidden p-2.5 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[#181614] hover:bg-[#F4EFEA] border border-[#E8E2D8] transition-colors cursor-pointer bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
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
            className="fixed inset-0 bg-[#181614]/60 backdrop-blur-xs z-40 lg:hidden"
          />

          <div 
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="fixed top-[102px] left-0 right-0 max-h-[calc(100vh-102px)] overflow-y-auto z-50 lg:hidden bg-[#FAF7F2] border-b border-[#E8E2D8] shadow-editorial-lg px-4 pt-3 pb-8 animate-in slide-in-from-top duration-200 space-y-4 text-left"
          >
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] shadow-editorial-inset">
              <div className="flex items-center space-x-2 text-[10px] font-code-mono uppercase text-[#C2410C] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Evening Batches: 4:00 PM – 9:00 PM</span>
              </div>
              <p className="text-xs text-[#57534E] mt-1 leading-snug">
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
                    className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#181614] text-white border-[#181614]'
                        : 'bg-white hover:bg-[#F4EFEA] text-[#181614] border-[#E8E2D8]'
                    } focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]`}
                  >
                    <span className="text-sm font-bold">{link.name}</span>
                    <ArrowRight className={`w-4 h-4 ${active ? 'text-[#FED7AA]' : 'text-[#C2410C]'}`} />
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#E8E2D8] space-y-2">
              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                aria-label={`Call Campus Desk at ${CAMPUS_CONFIG.contact.primaryPhone}`}
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-3 py-3 bg-white text-[#181614] font-semibold rounded-xl text-xs border border-[#E8E2D8] shadow-editorial-inset active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
              >
                <Phone className="w-4 h-4 text-[#C2410C]" />
                <span>Call Campus Desk: {CAMPUS_CONFIG.contact.primaryPhone}</span>
              </a>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Direct chat on WhatsApp with Focus Academy coordinator"
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-3 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-xl text-xs shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp Directly</span>
              </a>
              
              <Link
                to="/student-details"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-3 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold rounded-xl text-xs shadow-editorial active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
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
