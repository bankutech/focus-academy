import React from 'react';
import { Link } from 'react-router-dom';
import ContactSection from '../components/ContactSection';
import { Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
            <Link to="/" className="hover:text-[#EA580C]">Home</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-bold">Campus Location & Contact</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight">
                Visit Our Campus & Classrooms
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Parents are warmly invited to visit our classrooms, inspect our study facilities, and discuss batch admissions between 4:00 PM and 9:00 PM.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs flex items-center space-x-3 shrink-0">
              <Clock className="w-6 h-6 text-emerald-600" />
              <div className="text-xs">
                <span className="font-bold text-[#0F172A] block">Mon – Sat: 4:00 PM – 9:00 PM</span>
                <span className="text-slate-500">Sunday: By Appointment</span>
              </div>
            </div>
          </div>
        </div>

        <ContactSection isPage={true} />
      </div>
    </div>
  );
}
