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
    { name: 'Privacy Notice', path: '/privacy' },
  ];

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I would like to inquire about admissions.'
  )}`;

  return (
    <footer className="bg-[#0F172A] text-slate-300 text-left pt-12 pb-24 md:pb-10 border-t border-[#1E293B]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#1E293B]">
          <div className="md:col-span-5">
            <Link to="/" onClick={handleBackToTop} className="flex items-center space-x-3 group">
              <img
                src="/logo-80.png"
                alt="Focus Academy logo"
                width="80"
                height="80"
                className="w-10 h-10 object-contain rounded-md bg-white p-0.5"
              />
              <div>
                <span className="text-xl font-extrabold text-white tracking-tight block">
                  Focus Academy
                </span>
                <span className="text-xs uppercase tracking-wider text-orange-300 font-semibold block">
                  Thoramangalam • Perambalur
                </span>
              </div>
            </Link>
            <p className="mt-3.5 text-sm text-slate-400 max-w-sm leading-relaxed">
              Evening coaching for Classes 6–12 (State Board, CBSE, ICSE) at Thiripura Complex. Strictly capped 12-student batches with personalized teacher attention.
            </p>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-white font-bold uppercase tracking-wider text-xs sm:text-sm mb-4">
              Navigation
            </h2>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-slate-300 hover:text-white transition-colors py-0.5"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 space-y-3 text-sm">
            <h2 className="text-white font-bold uppercase tracking-wider text-xs sm:text-sm mb-4">
              Campus & Contact
            </h2>
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <a
                href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors leading-relaxed"
              >
                {CAMPUS_CONFIG.location.complex}, {CAMPUS_CONFIG.location.doorNo}, {CAMPUS_CONFIG.location.area}, Perambalur – 621220
              </a>
            </div>
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-brand shrink-0" />
              <a href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} className="text-slate-300 hover:text-white font-semibold transition-colors">
                {CAMPUS_CONFIG.contact.primaryPhone}
              </a>
            </div>
            <div className="flex items-center space-x-2.5">
              <MessageCircle className="w-4 h-4 text-whatsapp shrink-0" />
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Direct WhatsApp Helpdesk
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-400 gap-3">
          <p>© {CURRENT_YEAR} Focus Academy, Thoramangalam, Perambalur. All rights reserved.</p>
          <button
            type="button"
            onClick={handleBackToTop}
            className="text-orange-300 hover:underline cursor-pointer"
          >
            Back to Top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
