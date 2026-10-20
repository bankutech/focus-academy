import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Focus Academy', path: '/about' },
    { name: 'Academic Courses (Classes 6–12)', path: '/courses' },
    { name: 'Evening Batch Timings (4–9 PM)', path: '/timings' },
    { name: 'Student Registration (Step 1)', path: '/student-details' },
    { name: 'Tuition Fee Structure', path: '/fees' },
    { name: 'Campus Location & Contact Desk', path: '/contact' },
  ];

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy Perambalur! I would like to inquire about evening batch admissions at Thiripura Complex, Thoramangalam.'
  )}`;

  return (
    <footer className="bg-[#181614] text-[#A8A29E] text-left pt-16 pb-12 border-t border-[#2A2623]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#2A2623]">
          <div className="md:col-span-5">
            <Link to="/" onClick={handleBackToTop} className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#181614] flex items-center justify-center font-editorial font-bold text-lg group-hover:bg-[#C2410C] group-hover:text-white transition-colors">
                F
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight">
                  Focus Academy
                </span>
                <span className="font-code-mono text-[9px] uppercase tracking-wider text-[#FED7AA]">
                  Thoramangalam • Perambalur
                </span>
              </div>
            </Link>

            <p className="mt-4 text-xs sm:text-sm text-[#A8A29E] max-w-sm leading-relaxed">
              Dedicated evening academic coaching, small 1:12 batches, and Board exam preparation for school students in Thoramangalam, Perambalur. Located at Thiripura Complex.
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-[#E7E5E4]">
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                <div>
                  <a
                    href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A8A29E] hover:text-white block transition-colors leading-relaxed"
                  >
                    {CAMPUS_CONFIG.location.doorNo}, {CAMPUS_CONFIG.location.complex}, {CAMPUS_CONFIG.location.street}, {CAMPUS_CONFIG.location.area}, {CAMPUS_CONFIG.location.city} – {CAMPUS_CONFIG.location.pincode}
                  </a>
                  <a
                    href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] font-code-mono text-[#FED7AA] hover:underline mt-0.5"
                  >
                    <span>Get Directions on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                <a href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} className="hover:text-white">
                  {CAMPUS_CONFIG.contact.primaryPhone}
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                <a href={`mailto:${CAMPUS_CONFIG.contact.email}`} className="font-code-mono text-[11px] hover:text-white">
                  {CAMPUS_CONFIG.contact.email}
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-white font-semibold"
                >
                  Chat with Academic Desk on WhatsApp
                </a>
              </div>

              <div className="pt-2 flex items-center space-x-2 text-xs">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Focus Academy WhatsApp Desk"
                  className="px-2.5 py-1 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 font-bold font-code-mono text-[10px] transition-colors"
                >
                  WhatsApp Desk
                </a>
                <a
                  href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Focus Academy on Google Maps"
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-[#FED7AA] hover:bg-white/20 font-bold font-code-mono text-[10px] transition-colors"
                >
                  Google Maps
                </a>
                <a
                  href={`mailto:${CAMPUS_CONFIG.contact.email}`}
                  aria-label="Email Focus Academy"
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-[#A8A29E] hover:text-white hover:bg-white/20 font-bold font-code-mono text-[10px] transition-colors"
                >
                  Email Desk
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white font-code-mono font-bold uppercase tracking-wider text-[11px] mb-4">
              Institute Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8A29E]">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="hover:text-white transition-colors text-left block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-white font-code-mono font-bold uppercase tracking-wider text-[11px] mb-4">
              Batch Timings & Operating Hours
            </h4>
            
            <div className="bg-[#24201D] p-4 rounded-2xl border border-[#332E2A] space-y-2.5 text-xs">
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">{CAMPUS_CONFIG.timings.workingDays}</p>
                  <p className="font-code-mono text-[#FED7AA] text-[11px]">{CAMPUS_CONFIG.timings.dailyHours}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#332E2A] flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Sunday</p>
                  <p className="text-[11px] text-[#A8A29E]">Closed for regular classes</p>
                  <p className="text-[10px] text-[#FED7AA]">Special Doubt Sessions & Mocks by Appointment</p>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[10px] font-code-mono text-[#78716C] leading-snug">
              {CAMPUS_CONFIG.location.fullAddress}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-code-mono text-[#78716C] gap-4">
          <p>
            © {CURRENT_YEAR} Focus Academy, Perambalur. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              to="/contact"
              className="hover:text-[#FED7AA] transition-colors"
            >
              Admissions Policy
            </Link>
            <Link
              to="/about"
              className="hover:text-[#FED7AA] transition-colors"
            >
              Student Guidelines
            </Link>
            <button 
              type="button"
              onClick={handleBackToTop} 
              className="text-[#FED7AA] hover:underline cursor-pointer"
            >
              Back to Top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
