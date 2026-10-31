import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, Trash2, UserCheck, Phone, Mail, MessageSquare } from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { usePageMeta } from '../hooks/usePageMeta';

const LAST_UPDATED = '27 October 2026';

export default function PrivacyPage() {
  usePageMeta({
    title: 'Privacy Notice | Focus Academy',
    description: 'What Focus Academy collects during an admission, why it is needed, how long it is kept and how to ask for a correction or deletion.',
    path: '/privacy',
  });
  const { contact } = CAMPUS_CONFIG;
  const whatsappUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I would like to ask about my admission data / request deletion of my details.'
  )}`;

  const collected = [
    {
      group: 'Student details',
      items: 'Student name, class/grade, board (State Board, CBSE or ICSE), school name and shift, medium of instruction, previous exam score if you give it.',
      why: 'To place the student in a suitable batch and to prepare the correct syllabus.'
    },
    {
      group: 'Parent / guardian contact',
      items: 'Parent or guardian name, mobile number, optional WhatsApp number and an alternate number.',
      why: 'To confirm the admission, share timetable changes and reach the family if a class changes.'
    },
    {
      group: 'Safety information',
      items: 'Emergency contact name, relationship and number; medical alert, only if you choose to type it.',
      why: 'To contact the family and act correctly during a medical or safety emergency at the campus.'
    },
    {
      group: 'Optional delivery details',
      items: 'Postal address and pincode, collected only when you tick the printed study-material dispatch option.',
      why: 'To courier printed material. Leave the option unticked and no address is stored.'
    },
    {
      group: 'Optional billing detail',
      items: 'GSTIN, only when a business asks for a GST invoice.',
      why: 'To issue a GST-compliant fee receipt.'
    }
  ];

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Privacy notice for admissions
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Last updated {LAST_UPDATED}. This notice explains, in plain language, what Focus Academy collects when a
          parent or guardian submits an admission enquiry on this website, why it is collected, how long it is kept,
          and how to have it removed.
        </p>

        <div className="mt-6 p-4 bg-white border border-[#E2E8F0] rounded-lg flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-slate-700 leading-relaxed">
            Students here are children. We only ask for the parent or guardian's consent, we do not run advertising
            targeting at children, we never sell admission data, and we keep the medical and address fields optional.
          </p>
        </div>

        <h2 className="mt-8 text-lg font-bold text-[#0F172A]">1. What we collect and why</h2>
        <div className="mt-3 overflow-x-auto" role="region" aria-label="Table of collected admission data and its purpose" tabIndex={0}>
          <table className="w-full text-sm text-left border border-[#E2E8F0] rounded-lg">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 border-b border-[#E2E8F0]">Information</th>
                <th scope="col" className="py-3 px-4 border-b border-[#E2E8F0]">What it contains</th>
                <th scope="col" className="py-3 px-4 border-b border-[#E2E8F0]">Why we need it</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {collected.map((row) => (
                <tr key={row.group} className="align-top">
                  <th scope="row" className="py-3 px-4 border-b border-[#E2E8F0] font-bold text-[#0F172A]">
                    {row.group}
                  </th>
                  <td className="py-3 px-4 border-b border-[#E2E8F0]">{row.items}</td>
                  <td className="py-3 px-4 border-b border-[#E2E8F0]">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 text-lg font-bold text-[#0F172A]">2. Your consent</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
          <li>
            The guardian declaration on the enrollment form is <strong>unticked by default</strong> and required: it
            confirms you are the parent or legal guardian and that the admission may be processed.
          </li>
          <li>
            The WhatsApp updates consent is <strong>optional, separate and unticked by default</strong>. Leaving it
            unticked does not affect the admission.
          </li>
          <li>
            We record only the choice you actually made, with the time it was made, so an enquiry can never be treated
            as consent you did not give.
          </li>
          <li>
            You can withdraw the optional consent at any time by calling or messaging the campus desk. We will stop
            sending updates from that point.
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-bold text-[#0F172A]">3. Where the information is stored</h2>
        <div className="mt-3 p-4 bg-white border border-[#E2E8F0] rounded-lg flex items-start space-x-3">
          <Database className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Enquiries and reservations are sent to the academy's own admissions database and are visible only to
              signed-in academy staff. They are not published anywhere on this website.
            </p>
            <p>
              This browser keeps a short-lived copy of the form you are filling in so you can move between steps
              without retyping, and it holds a failed submission for up to 6 hours so it can be retried. That copy
              stays on your own device, and we deliberately leave medical alerts, addresses, emergency contacts and
              identity numbers out of it. Clearing your browser storage removes it immediately.
            </p>
            <p>
              If a submission fails, the form tells you plainly that the campus has <strong>not</strong> received it,
              so you are never shown a false confirmation.
            </p>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-bold text-[#0F172A]">4. How long we keep it</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
          <li>An enquiry that does not become an admission: kept for the current admission cycle, then removed on request or at the next cleanup.</li>
          <li>An enrolled student's record: kept while the student is with us, and afterwards only as long as fee receipts and statutory records must be retained.</li>
          <li>Failed submissions held in your browser: automatically dropped after 6 hours.</li>
        </ul>

        <h2 className="mt-8 text-lg font-bold text-[#0F172A]">5. Asking us to delete or correct your data</h2>
        <div className="mt-3 p-4 bg-white border border-[#E2E8F0] rounded-lg flex items-start space-x-3">
          <Trash2 className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-slate-700 leading-relaxed">
            A parent or guardian may ask for a copy, a correction, or a deletion of the admission details we hold by
            contacting the campus desk below. We will confirm in writing and action the request, normally within 30
            days. Deletion cannot remove records we are legally required to keep, such as issued fee receipts, and we
            will tell you exactly what has been kept and why.
          </p>
        </div>

        <h2 className="mt-8 text-lg font-bold text-[#0F172A]">6. Contact</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`tel:${contact.primaryPhoneRaw}`}
            aria-label={`Call Campus Desk at ${contact.primaryPhone}`}
            className="min-h-[48px] flex items-center justify-center space-x-2 px-4 py-3 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-bold rounded-md"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            <span>Call Campus Desk</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message on WhatsApp about admission data"
            className="min-h-[48px] flex items-center justify-center space-x-2 px-4 py-3 bg-whatsapp hover:bg-whatsapp-strong text-white text-sm font-bold rounded-md"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>Message on WhatsApp</span>
          </a>
          <a
            href={`mailto:${contact.email}`}
            aria-label={`Email the campus desk at ${contact.email}`}
            className="min-h-[48px] flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-slate-50 text-[#0F172A] text-sm font-bold rounded-md border border-[#E2E8F0]"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            <span>Email the Campus Desk</span>
          </a>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Campus desk: {contact.primaryPhone} · {contact.email} · Thiripura Complex, Main Road (via Four Roads),
          Rajanagar, Thoramangalam, Perambalur 621220.
        </p>

        <div className="mt-8 p-4 bg-white border border-[#E2E8F0] rounded-lg flex items-start space-x-3">
          <UserCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-slate-700 leading-relaxed">
            This notice describes the data handling actually implemented in this portal. It is written to align with
            India's Digital Personal Data Protection Act, 2023, in which a child's data may be processed only with
            verifiable parental or guardian consent. It is an operational description, not a legal opinion.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/student-details"
            className="min-h-[48px] inline-flex items-center px-5 py-3 bg-brand hover:bg-brand-strong text-white text-sm font-bold rounded-md"
          >
            Back to admission form
          </Link>
          <Link
            to="/contact"
            className="min-h-[48px] inline-flex items-center px-5 py-3 bg-white hover:bg-slate-50 text-[#0F172A] text-sm font-bold rounded-md border border-[#E2E8F0]"
          >
            Contact the academy
          </Link>
        </div>
      </div>
    </div>
  );
}
