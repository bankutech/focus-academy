import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CAMPUS_CONFIG } from '../src/config/campusConfig';
import { validateIndianMobile, validateLeadInquiry } from '../src/types/schemas';
import { LeadService } from '../src/services/leadService';

describe('Navigation, Triggers and Form Validation Audit', () => {
  it('validates telephone protocol format for direct dialing', () => {
    const rawPhone = CAMPUS_CONFIG.contact.primaryPhoneRaw;
    expect(rawPhone).toMatch(/^\+91\d{10}$/);
    const telHref = `tel:${rawPhone}`;
    expect(telHref).toBe('tel:+919842451220');
  });

  it('validates mailto protocol format for official campus inquiries', () => {
    const email = CAMPUS_CONFIG.contact.email;
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    const mailtoHref = `mailto:${email}`;
    expect(mailtoHref).toBe('mailto:contact@focusacademyperambalur.com');
  });

  it('validates WhatsApp API click-to-chat links and encoded text parameter', () => {
    const whatsappNum = CAMPUS_CONFIG.contact.whatsappNumber;
    expect(whatsappNum).toBe('919842451220');
    
    const prefilledText = 'Hello Focus Academy! I would like to inquire about admissions.';
    const encoded = encodeURIComponent(prefilledText);
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encoded}`;
    
    expect(whatsappUrl).toContain('https://wa.me/919842451220?text=');
    expect(whatsappUrl).toContain('Focus%20Academy');
  });

  it('validates Google Maps directions URL targets Thiripura Complex Thoramangalam and Rajanagar', () => {
    const dirUrl = CAMPUS_CONFIG.location.googleMapsDirectionUrl;
    expect(dirUrl).toContain('maps.google.com');
    expect(dirUrl).toContain('Thiripura+Complex');
    expect(dirUrl).toContain('Rajanagar');
    expect(dirUrl).toContain('Thoramangalam');
    expect(dirUrl).toContain('621220');
  });

  it('validates mobile number validator against various Indian formats', () => {
    expect(validateIndianMobile('9842451220').valid).toBe(true);
    expect(validateIndianMobile('98424 51220').valid).toBe(true);
    expect(validateIndianMobile('+91 98424 51220').valid).toBe(true);
    expect(validateIndianMobile('09842451220').valid).toBe(true);
    expect(validateIndianMobile('12345').valid).toBe(false);
    expect(validateIndianMobile('').valid).toBe(false);
  });

  it('validates admission inquiry form schema and required fields', () => {
    const validInquiry = {
      studentName: 'S. Kaviya',
      parentName: 'S. Sundaram',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      subjects: 'Maths & Science',
    };
    const validation = validateLeadInquiry(validInquiry);
    expect(validation.isValid).toBe(true);
    expect(validation.sanitized.phone).toBe('9842451220');
    expect(validation.sanitized.studentName).toBe('S. Kaviya');

    const invalidInquiry = {
      studentName: 'A',
      phone: '0000',
      grade: '',
      board: '',
    };
    const failedValidation = validateLeadInquiry(invalidInquiry);
    expect(failedValidation.isValid).toBe(false);
    expect(failedValidation.errors.studentName).toBeDefined();
    expect(failedValidation.errors.phone).toBeDefined();
    expect(failedValidation.errors.grade).toBeDefined();
    expect(failedValidation.errors.board).toBeDefined();
  });

  it('ensures lead service generates pre-filled whatsapp URL upon submission', async () => {
    const lead = {
      studentName: 'R. Rajesh',
      phone: '9842451220',
      grade: 'Class 12',
      board: 'State Board',
      subjects: 'Physics',
    };
    const res = await LeadService.submitLead(lead);
    expect(res.success).toBe(true);
    expect(res.whatsappUrl).toContain('https://wa.me/919842451220');
    expect(res.whatsappUrl).toContain(encodeURIComponent('R. Rajesh'));
    expect(res.whatsappUrl).toContain(encodeURIComponent('Class 12'));
  });

  it('ensures section anchor IDs exist in HomePage and ContactSection components without duplicate IDs', () => {
    const homePath = path.resolve(__dirname, '../src/pages/HomePage.jsx');
    const contactPath = path.resolve(__dirname, '../src/components/ContactSection.jsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');
    const contactContent = fs.readFileSync(contactPath, 'utf8');

    const expectedAnchors = [
      'hero',
      'about',
      'courses',
      'timings',
      'steps',
      'features',
      'campus',
      'contact',
      'enroll'
    ];

    for (const anchorId of expectedAnchors) {
      const inHome = new RegExp(`id=["']${anchorId}["']`).test(homeContent);
      const inContact = new RegExp(`id=["']${anchorId}["']`).test(contactContent);
      expect(inHome || inContact).toBe(true);
    }

    const campusInHome = (homeContent.match(/id=["']campus["']/g) || []).length;
    const campusInContact = (contactContent.match(/id=["']campus["']/g) || []).length;
    expect(campusInHome).toBe(1);
    expect(campusInContact).toBe(0);
  });

  it('verifies all external links have target="_blank" and rel="noopener noreferrer"', () => {
    const componentsDir = path.resolve(__dirname, '../src');
    const checkDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const anchorRegex = /<a\s+[^>]*href=[^>]*>/g;
          const matches = content.match(anchorRegex) || [];
          for (const match of matches) {
            if (match.includes('wa.me') || match.includes('maps.google.com')) {
              expect(match).toContain('target="_blank"');
              expect(match).toContain('rel="noopener noreferrer"');
            }
          }
        }
      }
    };
    checkDir(componentsDir);
  });

  it('asserts dedicated page routes in Navbar, Footer, and App router for multi-page architecture', () => {
    const navbarPath = path.resolve(__dirname, '../src/components/Navbar.jsx');
    const footerPath = path.resolve(__dirname, '../src/components/Footer.jsx');
    const appPath = path.resolve(__dirname, '../src/App.jsx');
    const coursesPath = path.resolve(__dirname, '../src/pages/CoursesPage.jsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    const footerContent = fs.readFileSync(footerPath, 'utf8');
    const appContent = fs.readFileSync(appPath, 'utf8');
    const coursesContent = fs.readFileSync(coursesPath, 'utf8');

    const expectedRoutes = ['/', '/about', '/courses', '/timings', '/fees', '/contact'];

    for (const route of expectedRoutes) {
      expect(navbarContent).toContain(`path: '${route}'`);
      expect(appContent).toContain(`path="${route}"`);
    }

    expect(navbarContent).toContain("end={link.path === '/'");
    expect(navbarContent).not.toContain("path: '/#");
    expect(coursesContent).not.toContain('to="/#');
    expect(coursesContent).toContain('to="/contact"');

    expect(appContent).toContain("import AboutPage from './pages/AboutPage'");
    expect(appContent).toContain('<Route path="/about" element={<AboutPage />} />');
    expect(appContent).toContain('<Route path="/timings" element={<BatchesPage />} />');
    expect(appContent).toContain('<Route path="/courses" element={<CoursesPage />} />');
    expect(appContent).toContain('<Route path="/fees" element={<FeesPage />} />');
    expect(appContent).toContain('<Route path="/contact" element={<ContactPage />} />');

    for (const route of expectedRoutes) {
      expect(footerContent).toContain(`path: '${route}'`);
    }
  });

  it('validates AboutPage includes 12-student batch philosophy, bus sync, trial, and facilities', () => {
    const aboutPath = path.resolve(__dirname, '../src/pages/AboutPage.jsx');
    expect(fs.existsSync(aboutPath)).toBe(true);
    const aboutContent = fs.readFileSync(aboutPath, 'utf8');

    expect(aboutContent).toContain('12');
    expect(aboutContent).toContain('Thiripura Complex');
    expect(aboutContent).toContain('Thoramangalam');
    expect(aboutContent).toContain('Perambalur');
    expect(aboutContent).toContain('Four Roads');
    expect(aboutContent).toContain('Free Trial');
    expect(aboutContent).toContain('Parking');
    expect(aboutContent).not.toContain('star rating');
    expect(aboutContent).not.toContain('★');
  });

  it('verifies deep links, trailing slash normalization, and default batch state for timings navigation', () => {
    const navbarPath = path.resolve(__dirname, '../src/components/Navbar.jsx');
    const batchesPath = path.resolve(__dirname, '../src/pages/BatchesPage.jsx');
    const homePath = path.resolve(__dirname, '../src/pages/HomePage.jsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    const batchesContent = fs.readFileSync(batchesPath, 'utf8');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    expect(batchesContent).toContain("searchParams.get('grade') || studentFlow.grade || 'all'");
    expect(navbarContent).toContain("location.pathname.replace");
    expect(navbarContent).toContain("aria-current={active ? 'page' : undefined}");
    expect(homeContent).toContain('to="/timings"');
    expect(homeContent).toContain('to="/about"');
    expect(homeContent).not.toContain("navigate(`/#");
  });

  it('enforces zero comments across all touched source files', () => {
    const files = [
      path.resolve(__dirname, '../src/pages/AboutPage.jsx'),
      path.resolve(__dirname, '../src/App.jsx'),
      path.resolve(__dirname, '../src/components/Navbar.jsx'),
      path.resolve(__dirname, '../src/components/Footer.jsx'),
      path.resolve(__dirname, '../src/pages/CoursesPage.jsx'),
      path.resolve(__dirname, '../src/pages/BatchesPage.jsx'),
      path.resolve(__dirname, '../src/pages/HomePage.jsx'),
      path.resolve(__dirname, '../src/components/common/Button.jsx'),
      path.resolve(__dirname, '../src/components/common/Badge.jsx'),
      path.resolve(__dirname, '../src/context/AppContext.jsx'),
      path.resolve(__dirname, '../src/services/leadService.js'),
      path.resolve(__dirname, '../src/types/schemas.js'),
      path.resolve(__dirname, './navigationAndTriggers.test.js')
    ];
    const slash = String.fromCharCode(47);
    const star = String.fromCharCode(42);
    const doubleSlash = slash + slash;
    const blockStart = slash + star;
    const blockEnd = star + slash;
    const htmlOpen = '<' + '!' + '-' + '-';
    const htmlClose = '-' + '-' + '>';

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const stripped = line.replace(/https?:[^\s'"`]+/g, '');
        if (filePath.endsWith('test.js')) {
          if (line.includes('String.fromCharCode') || line.includes('doubleSlash') || line.includes('blockStart')) {
            continue;
          }
        }
        expect(stripped.includes(doubleSlash)).toBe(false);
        expect(stripped.includes(blockStart)).toBe(false);
        expect(stripped.includes(blockEnd)).toBe(false);
        expect(stripped.includes(htmlOpen)).toBe(false);
        expect(stripped.includes(htmlClose)).toBe(false);
      }
    }
  });
});


