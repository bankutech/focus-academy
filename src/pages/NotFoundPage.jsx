import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFoundPage() {
  usePageMeta({
    title: 'Page Not Found | Focus Academy',
    description: 'The page you asked for does not exist. Use the links below to reach admissions, batch timings, fees or the campus contact details.',
    path: '/404',
    robots: 'noindex,follow',
  });

  const whatsappUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I followed a link on your website that did not work.'
  )}`;

  return (
    <div className="py-16 sm:py-24 bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-tint border border-orange-200 text-brand flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          That page is not here
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          The link may be out of date, or the address may have a typo. The pages below cover everything parents ask us
          about — batch timings, fees, the syllabus and how to start an admission.
        </p>

        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-sm font-bold">
          <Link to="/" className="min-h-[48px] flex items-center justify-center px-3 py-3 bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] hover:bg-slate-50">Home</Link>
          <Link to="/timings" className="min-h-[48px] flex items-center justify-center px-3 py-3 bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] hover:bg-slate-50">Batch Timings</Link>
          <Link to="/fees" className="min-h-[48px] flex items-center justify-center px-3 py-3 bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] hover:bg-slate-50">Fees</Link>
          <Link to="/contact" className="min-h-[48px] flex items-center justify-center px-3 py-3 bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] hover:bg-slate-50">Contact</Link>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/student-details"
            className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-6 py-3 bg-brand hover:bg-brand-strong text-white text-sm font-bold rounded-md"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Start an admission</span>
          </Link>
          <a
            href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
            aria-label={`Call Campus Desk at ${CAMPUS_CONFIG.contact.primaryPhone}`}
            className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-5 py-3 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-bold rounded-md"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            <span>Call Campus Desk</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp with the Focus Academy campus desk"
            className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-5 py-3 bg-whatsapp hover:bg-whatsapp-strong text-white text-sm font-bold rounded-md"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
