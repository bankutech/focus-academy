# Focus Academy — Known Limitations & Architectural Disclosures

**Date:** 26 October 2026  
**Status:** Certified with Disclosures  

---

## 1. Disclosed Technical Limitations

In accordance with Section 2 of the engineering guidelines, the following real-world limitations and operational boundaries are explicitly disclosed:

### 1.1 WhatsApp Outbound Linking vs. Delivery Receipts
- Generating a `https://wa.me/919842451220?text=...` URI is a client-side intent invocation. Opening WhatsApp on the student or parent's phone confirms that the application composed the enrollment docket, but **does not constitute cryptographic proof of message delivery** or confirmation of admission by the institute director. Final seat allocation requires direct communication with institute counselors.

### 1.2 Google Maps Embed & Offline Rendering
- The campus map on the Contact page utilizes a lazy-loaded Google Maps iframe (`maps.google.com/maps?q=Thiripura+Complex...`). When visitors are operating under completely offline conditions or with strict content-blockers, the embedded map cannot render tiles. A prominent, accessible text address and direct directions hyperlink (`https://maps.google.com/?q=...`) are provided as accessible fallbacks.

### 1.3 Offline Inquiries Synchronization
- The `LeadService` offline queue persists unsent inquiries in browser `localStorage`. While queued inquiries automatically sync upon network restoration, this relies on the user returning to or keeping the website tab open. If the browser cache is manually cleared while offline before returning online, queued inquiries will be purged.

### 1.4 Live Real-Time Seat Counters vs. Batch Capacity Policy
- Batch capacity is strictly capped at 12 students per batch according to institute policy. In the event that serverless backend connectivity is temporarily interrupted, the frontend defaults to verified static batch capacities rather than displaying artificial dynamic countdown timers.

### 1.5 Tuition Fee Projections as Non-Contractual Quotations
- The Tuition Fee Calculator provides provisional educational estimates based on standard hourly rates (₹180–₹340/hr) and documented sibling/quarterly concessions. The calculator is an informational planning tool and does not process direct monetary transactions. Official fee schedules are finalized during on-campus enrollment review at Thiripura Complex.

### 1.6 Production SMS Gateway
- Automated SMS dispatch via telecom DLT gateways (TRAI regulations) is currently not wired directly to the web client; lead notifications are routed via direct WhatsApp webhook and cellular telephone contact.
