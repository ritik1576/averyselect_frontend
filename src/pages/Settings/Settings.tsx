import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import toast from 'react-hot-toast';
import './Settings.css';
import { Mail, Building2, Shield, CreditCard } from 'lucide-react';
import { updateUser } from '../../store/slices/authSlice';
import { userService } from '../../services/api/user.service';

export const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || user?.userName || 'User',
    password: '',
    confirmPassword: ''
  });

  // Fetch latest user data on mount
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const freshData = await userService.getMe();
        dispatch(updateUser(freshData));
        setFormData(prev => ({ ...prev, name: freshData.name || prev.name }));
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, [dispatch]);

  const getInitials = (name: string) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';
  };

  const handleSaveName = async () => {
    try {
      const updatedUser = await userService.updateMe({ name: formData.name });
      dispatch(updateUser(updatedUser));
      setIsEditing(false);
      toast.success('Name updated successfully!');
    } catch (error) {
      toast.error('Failed to update name. Please try again.');
      console.error('Update name error:', error);
    }
  };

  const handleCancelName = () => {
    setIsEditing(false);
    setFormData({ ...formData, name: user?.name || user?.userName || 'User' });
  };

  const handleSavePassword = async () => {
    if (!formData.password || formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    
    try {
      await userService.updateMe({ password: formData.password });
      setIsEditingPassword(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error('Failed to update password. Please try again.');
      console.error('Update password error:', error);
    }
  };

  const handleCancelPassword = () => {
    setIsEditingPassword(false);
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="settings-page">
        <div className="settings-content">
          {/* Profile Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Profile Overview</h2>
            <p>Your personal account details</p>
          </div>
          <div className="settings-card-body">
            <div className="profile-header">
              <div className="profile-avatar">
                {getInitials(isEditing ? formData.name : (user?.name || user?.userName || ''))}
              </div>
              <div className="profile-info">
                {isEditing ? (
                  <div className="detail-text" style={{ marginBottom: '8px' }}>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Your Name"
                    />
                  </div>
                ) : (
                  <h3>{user?.name || user?.userName || 'User'}</h3>
                )}
                <p>{user?.role || 'Administrator'}</p>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <Mail size={18} />
                <div className="detail-text">
                  <label>Email Address</label>
                  <span style={{ color: 'var(--color-neutral-400)' }}>
                    {user?.email || 'Not provided'}
                    <span style={{ fontSize: '11px', marginLeft: '8px', display: 'block' }}>Email updates are currently disabled by the administrator.</span>
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <Building2 size={18} />
                <div className="detail-text">
                  <label>Company</label>
                  <span style={{ color: 'var(--color-neutral-400)' }}>
                    {user?.companyName || user?.company_name || 'AverySelect'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="settings-actions">
              {isEditing ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" onClick={handleSaveName}>Save Changes</button>
                  <button className="btn-secondary" onClick={handleCancelName}>Cancel</button>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => setIsEditing(true)}>Update Profile</button>
              )}
            </div>
          </div>
        </div>

        {/* Security & Billing placeholders */}
        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="sc-header-row">
                <Shield size={20} className="sc-icon" />
                <h2>Security</h2>
              </div>
            </div>
            <div className="settings-card-body">
              <p className="sc-desc">Manage your password and security preferences.</p>
              {isEditingPassword ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  <div className="detail-text">
                    <label>New Password</label>
                    <input 
                      type="password"
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="detail-text">
                    <label>Confirm Password</label>
                    <input 
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button className="btn-primary" onClick={handleSavePassword}>Save Password</button>
                    <button className="btn-secondary" onClick={handleCancelPassword}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => setIsEditingPassword(true)}>Change Password</button>
              )}
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <div className="sc-header-row">
                <CreditCard size={20} className="sc-icon" />
                <h2>Billing</h2>
              </div>
            </div>
            <div className="settings-card-body">
              <p className="sc-desc">Manage your subscription and billing methods.</p>
              <button className="btn-secondary">Manage Subscription</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
