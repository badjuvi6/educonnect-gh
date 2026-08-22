import { useState } from 'react';
import { LoaderCircle, CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone || '',
    program: user.program || '',
    department: user.department || '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/me', profileForm);
      updateUser(data.data);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">My Profile</h1>
        <p className="mt-1 text-sm text-navy-400">Manage your account details and password.</p>
      </div>

      <div className="card flex items-center gap-4 p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-gold-400">
          {initials(user.name)}
        </span>
        <div>
          <p className="font-semibold text-navy-900">{user.name}</p>
          <p className="text-sm text-navy-400">{user.email}</p>
          <p className="mt-0.5 text-xs capitalize text-navy-300">
            {user.role} {user.indexNumber ? `· ${user.indexNumber}` : user.staffId ? `· ${user.staffId}` : ''}
          </p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="card space-y-4 p-6">
        <h3 className="font-display text-base font-bold text-navy-900">Account details</h3>

        {profileError && (
          <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-success-500/20 bg-success-50 px-4 py-3 text-sm text-success-600">
            <CheckCircle2 className="h-4 w-4" /> {profileSuccess}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">Full name</label>
          <input
            value={profileForm.name}
            onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">Phone number</label>
          <input
            value={profileForm.phone}
            onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
            className="input-field"
            placeholder="e.g. 024 123 4567"
          />
        </div>

        {user.role === 'student' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Program of study
            </label>
            <input
              value={profileForm.program}
              onChange={(e) => setProfileForm((f) => ({ ...f, program: e.target.value }))}
              className="input-field"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">Department</label>
          <input
            value={profileForm.department}
            onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
            className="input-field"
          />
        </div>

        <button type="submit" disabled={savingProfile} className="btn-gold">
          {savingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Save changes'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="card space-y-4 p-6">
        <h3 className="font-display text-base font-bold text-navy-900">Change password</h3>

        {passwordError && (
          <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-success-500/20 bg-success-50 px-4 py-3 text-sm text-success-600">
            <CheckCircle2 className="h-4 w-4" /> {passwordSuccess}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">
            Current password
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">New password</label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700">
            Confirm new password
          </label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <button type="submit" disabled={savingPassword} className="btn-secondary">
          {savingPassword ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Update password'}
        </button>
      </form>
    </div>
  );
}
