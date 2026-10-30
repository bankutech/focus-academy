import { describe, it, expect } from 'vitest';
import { CAMPUS_CONFIG } from '../src/config/campusConfig';

describe('Focus Academy Campus Configuration & Client Profile', () => {
  it('has verified institute branding and Thoramangalam location credentials', () => {
    expect(CAMPUS_CONFIG.brand.name).toBe('Focus Academy');
    expect(CAMPUS_CONFIG.brand.legalName).toBe('Focus Academy Educational Coaching Institute');
    expect(CAMPUS_CONFIG.location.campusName).toContain('Thoramangalam');
    expect(CAMPUS_CONFIG.location.complex).toBe('Thiripura Complex');
    expect(CAMPUS_CONFIG.location.doorNo).toBe('No. 50, First Floor');
    expect(CAMPUS_CONFIG.location.city).toBe('Perambalur');
    expect(CAMPUS_CONFIG.location.pincode).toBe('621220');
    expect(CAMPUS_CONFIG.location.state).toBe('Tamil Nadu');
    expect(CAMPUS_CONFIG.location.fullAddress).toBe(
      'No. 50, First Floor, Thiripura Complex, Main Road (via Four Roads), Rajanagar, Thoramangalam, Perambalur – 621220, Tamil Nadu.'
    );
  });

  it('provides precise Google Maps embed and directions pointing to Thiripura Complex', () => {
    expect(CAMPUS_CONFIG.location.googleMapsEmbedUrl).toContain('Thiripura+Complex');
    expect(CAMPUS_CONFIG.location.googleMapsEmbedUrl).toContain('Thoramangalam');
    expect(CAMPUS_CONFIG.location.googleMapsEmbedUrl).toContain('621220');
    expect(CAMPUS_CONFIG.location.googleMapsDirectionUrl).toContain('Thiripura+Complex');
    expect(CAMPUS_CONFIG.location.googleMapsDirectionUrl).toContain('Thoramangalam');
    expect(CAMPUS_CONFIG.location.googleMapsDirectionUrl).toContain('621220');
  });

  it('has validated contact phone and WhatsApp desk information', () => {
    expect(CAMPUS_CONFIG.contact.primaryPhone).toBe('+91 98424 51220');
    expect(CAMPUS_CONFIG.contact.primaryPhoneRaw).toBe('+919842451220');
    expect(CAMPUS_CONFIG.contact.whatsappNumber).toBe('919842451220');
    expect(CAMPUS_CONFIG.contact.email).toBe('contact@focusacademyperambalur.com');
  });

  it('specifies the 3 disciplined evening batch slots and strict 12-student limit', () => {
    expect(CAMPUS_CONFIG.timings.workingDays).toBe('Monday – Saturday');
    expect(CAMPUS_CONFIG.timings.dailyHours).toBe('4:30 PM – 9:00 PM');
    expect(CAMPUS_CONFIG.academicStats.batchSizeLimit).toBe('Max 12 Students');
    expect(CAMPUS_CONFIG.academicStats.studentTeacherRatio).toBe('1 : 12');

    expect(CAMPUS_CONFIG.timings.slots.length).toBe(3);
    expect(CAMPUS_CONFIG.timings.slots[0].time).toBe('4:30 PM – 6:00 PM');
    expect(CAMPUS_CONFIG.timings.slots[1].time).toBe('6:00 PM – 7:30 PM');
    expect(CAMPUS_CONFIG.timings.slots[2].time).toBe('7:30 PM – 9:00 PM');
  });
});
