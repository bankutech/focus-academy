import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Settings as SettingsIcon, 
  LogOut, 
  ExternalLink, 
  ChevronDown, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { logOutAdmin } from '../../services/firebase';
import { getVerifiedAdmin, setVerifiedAdmin } from '../../services/adminIdentity';
import { AdminDataService } from '../../services/adminDataService';
import { processAvatarImage } from '../../utils/imageProcessor';
import { validatePhoneNumber } from '../../utils/phoneValidation';

export default function AdminProfileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [admin, setAdmin] = useState(getVerifiedAdmin());
  
  // Profile edit form state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Keep admin in sync
  useEffect(() => {
    const current = getVerifiedAdmin();
    setAdmin(current);
    if (current) {
      setDisplayName(current.displayName || '');
      setPhone(current.contactPhone || '');
      setAvatarBase64(current.avatarBase64 || '');
      setAvatarPreview(current.avatarBase64 || current.photoURL || '');
    }
  }, [profileModalOpen]);

  // Click-outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  // Escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (profileModalOpen) {
          setProfileModalOpen(false);
        } else if (menuOpen) {
          setMenuOpen(false);
          triggerRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, profileModalOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logOutAdmin();
    } catch {
      setVerifiedAdmin(null);
    }
    localStorage.removeItem('focus_demo_admin');
    setVerifiedAdmin(null);
    navigate('/admin-portal/login', { replace: true });
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    setAvatarError('');
    if (!file) return;

    try {
      const result = await processAvatarImage(file, { dimension: 128 });
      if (!result.ok) {
        setAvatarError(result.error || 'Failed to process image.');
        return;
      }
      setAvatarBase64(result.dataUrl);
      setAvatarPreview(result.dataUrl);
    } catch (err) {
      setAvatarError(err.message || 'Image processing failed.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setAvatarError('');
    setFeedback({ type: '', message: '' });

    if (!displayName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your administrator display name.' });
      return;
    }

    if (phone.trim()) {
      const phoneValidation = validatePhoneNumber(phone, { required: false });
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || 'Please enter a valid phone number.');
        return;
      }
    }

    setSaving(true);
    try {
      const updatedData = {
        uid: admin?.uid || 'admin-local',
        email: admin?.email || '',
        displayName: displayName.trim(),
        phone: phone.trim(),
        avatarBase64: avatarBase64 || null
      };

      await AdminDataService.saveAdminProfile(updatedData, admin?.email || 'admin');

      const updatedAdmin = {
        ...admin,
        displayName: displayName.trim(),
        contactPhone: phone.trim(),
        avatarBase64: avatarBase64 || null
      };
      setVerifiedAdmin(updatedAdmin);
      setAdmin(updatedAdmin);

      setFeedback({ type: 'success', message: 'Profile details and avatar saved successfully!' });
      setTimeout(() => {
        setProfileModalOpen(false);
        setFeedback({ type: '', message: '' });
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save administrator profile.' });
    } finally {
      setSaving(false);
    }
  };

  const role = AdminDataService.getUserRole(admin?.email || '');
  const userInitials = (admin?.displayName || admin?.email || 'Admin')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Top Header Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Administrator profile and account options"
        className="flex items-center space-x-2 sm:space-x-3 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-white transition-all cursor-pointer border border-slate-700/70 focus:outline-hidden focus:ring-2 focus:ring-brand"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-600 bg-slate-900 flex items-center justify-center">
          {avatarPreview ? (
            <img src={avatarPreview} alt={admin?.displayName || 'Administrator'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-orange-400">{userInitials}</span>
          )}
        </div>

        <div className="hidden sm:flex flex-col text-left leading-tight max-w-[130px] lg:max-w-[160px]">
          <span className="text-xs font-bold text-white truncate">
            {admin?.displayName || 'Administrator'}
          </span>
          <span className="text-[10px] text-slate-400 truncate">
            {admin?.email || ''}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Profile Dropdown Menu */}
      {menuOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/10 divide-y divide-slate-100 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-100 focus:outline-hidden"
        >
          {/* User info card */}
          <div className="p-3.5 bg-slate-50/70 rounded-t-xl">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-300 bg-slate-800 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-orange-400">{userInitials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#0F172A] truncate">
                  {admin?.displayName || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{admin?.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  role === 'owner' ? 'bg-purple-100 text-purple-800' :
                  role === 'administrator' ? 'bg-blue-100 text-blue-800' :
                  role === 'admissions' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setProfileModalOpen(true);
              }}
              className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] cursor-pointer"
            >
              <User className="w-4 h-4 text-brand shrink-0" />
              <span>Administrator Profile &amp; Avatar</span>
            </button>

            <Link
              to="/admin-portal/settings"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Academy Settings &amp; Roles</span>
            </Link>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                <span>View Public Website</span>
              </div>
              <span className="text-[10px] text-slate-400">New tab</span>
            </a>
          </div>

          {/* Sign Out Action */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 font-bold cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Administrator Profile & Avatar Modal */}
      {profileModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setProfileModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150 text-xs"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-dialog-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-brand" />
                <h2 id="profile-dialog-title" className="text-base font-extrabold text-[#0F172A]">
                  Administrator Profile &amp; Avatar
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setProfileModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback.message && (
              <div className={`p-3 rounded-lg mb-4 flex items-start space-x-2 ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <span className="font-medium">{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand/50 shadow-md bg-slate-900 mb-2">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-orange-400">
                      {userInitials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-brand" />
                  <span>Upload Picture</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  JPEG, PNG, or WebP. Cropped to 128×128 square and safely compressed (&lt;45 KB) for Firestore.
                </p>

                {avatarError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{avatarError}</p>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand font-medium"
                    placeholder="e.g. S. Sagnik"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Phone (Guardian / Staff Mobile)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError('');
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand font-mono"
                      placeholder="+91 98424 51220 or 9842451220"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-[10px] text-red-600 font-semibold mt-1">{phoneError}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">Supports Indian 10-digit mobile or international +country code.</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Administrator Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={admin?.email || ''}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Authorization Role (Governed by Academy Owner)
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      {role.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
