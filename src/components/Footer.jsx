import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Courses', path: '/courses' },
    { name: 'Timings', path: '/timings' },
    { name: 'Fees', path: '/fees' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I would like to inquire about admissions.'
  )}`;

  return (
    <footer className="bg-[#0F172A] text-slate-400 text-left pt-10 pb-24 md:pb-8 border-t border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#1E293B]">
          <div className="md:col-span-5">
            <Link to="/" onClick={handleBackToTop} className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-lg bg-white text-[#0F172A] flex items-center justify-center font-editorial font-bold text-base group-hover:bg-[#EA580C] group-hover:text-white transition-colors">
                F
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight block">
                  Focus Academy
                </span>
                <span className="text-xs uppercase tracking-wider text-orange-200 font-semibold block">
                  Thoramangalam • Perambalur
                </span>
              </div>
            </Link>
            <p className="mt-3 text-xs text-slate-400 max-w-sm leading-relaxed">
              Evening coaching for Classes 6–12 (State Board, CBSE, ICSE) at Thiripura Complex. Small 12-student batches.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">
              Navigation
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 space-y-2.5 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">
              Contact
            </h4>
            <div className="flex items-start space-x-2">
              <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
              <a
                href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {CAMPUS_CONFIG.location.complex}, {CAMPUS_CONFIG.location.doorNo}, {CAMPUS_CONFIG.location.area}, Perambalur
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
              <a href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} className="hover:text-white transition-colors">
                {CAMPUS_CONFIG.contact.primaryPhone}
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-white transition-colors"
              >
                WhatsApp Desk
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© {CURRENT_YEAR} Focus Academy. All rights reserved.</p>
          <button
            type="button"
            onClick={handleBackToTop}
            className="text-orange-200 hover:underline cursor-pointer"
          >
            Back to Top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
