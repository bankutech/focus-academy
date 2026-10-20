import React from 'react';
import { Link } from 'react-router-dom';
import ContactSection from '../components/ContactSection';
import { MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-screen text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs font-code-mono text-[#78716C] mb-2">
            <Link to="/" className="hover:text-[#C2410C]">Home</Link>
            <span>/</span>
            <span className="text-[#181614] font-bold">Campus Location & Contact</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#C2410C]/10 text-[#C2410C] rounded-lg text-xs font-code-mono font-bold mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Thiripura Complex • Thoramangalam, Perambalur</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#181614] tracking-tight">
                Visit Our Campus & Classrooms
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#57534E] max-w-2xl leading-relaxed">
                Parents are warmly invited to visit our classrooms, inspect our study facilities, and discuss batch admissions between 4:00 PM and 9:00 PM.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-editorial flex items-center space-x-3 shrink-0">
              <Clock className="w-6 h-6 text-emerald-600" />
              <div className="text-xs">
                <span className="font-bold text-[#181614] block">Mon – Sat: 4:00 PM – 9:00 PM</span>
                <span className="text-[#78716C]">Sunday: By Appointment</span>
              </div>
            </div>
          </div>
        </div>

        <ContactSection />
      </div>
    </div>
  );
}
