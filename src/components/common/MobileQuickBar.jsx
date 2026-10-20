import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { CAMPUS_CONFIG } from '../../config/campusConfig';

export default function MobileQuickBar() {
  const whatsappQuery = encodeURIComponent(
    'Hello Focus Academy Perambalur! 👋\nI would like to inquire about evening batch timings, fees, and 1-day free trial at Thiripura Complex.'
  );

  return (
    <aside 
      aria-label="Quick Mobile Contact Bar" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181614]/95 backdrop-blur-md border-t border-[#2A2623] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-editorial-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5">
        <a
          href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
          aria-label={`Call Focus Academy Campus Desk at ${CAMPUS_CONFIG.contact.primaryPhone}`}
          className="min-h-[48px] flex items-center justify-center space-x-2 px-3 bg-[#24201D] hover:bg-[#2F2B27] text-[#FAF7F2] border border-[#3E3834] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
        >
          <Phone className="w-4 h-4 text-[#FED7AA] shrink-0" />
          <span className="truncate">Call Campus Desk</span>
        </a>

        <a
          href={`https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${whatsappQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat directly with Focus Academy on WhatsApp"
          className="min-h-[48px] flex items-center justify-center space-x-2 px-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl text-xs font-bold transition-all shadow-editorial active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">Chat on WhatsApp</span>
        </a>
      </div>
    </aside>
  );
}
