import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, User, Phone, Play, ShieldAlert, Monitor, Copy, EyeOff } from 'lucide-react';
import './CandidatePortal.css';

export const CandidatePortal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    
    // In future: Create Candidate -> Create Session -> Redirect to test environment
    console.log('Starting assessment for:', { name, email, phone, assessmentId: id });
    alert('MVP: Candidate Session created. Proceeding to test environment...');
  };

  return (
    <div className="portal-container">
      <div className="portal-header">
        <div className="portal-brand">
          <div className="portal-logo"></div>
          <span>Acme Corp</span>
        </div>
      </div>
      
      <main className="portal-main">
        <div className="portal-card">
          <div className="portal-card-header">
            <h1 className="portal-title">Software Engineer Trainee - Node.js</h1>
            <p className="portal-subtitle">
              Welcome to the assessment. Please provide your details to begin.
            </p>
          </div>

          <form className="portal-form" onSubmit={handleStart}>
            <div className="portal-form-group">
              <label>Full Name *</label>
              <div className="portal-input-wrap">
                <User size={18} className="portal-input-icon" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="portal-form-group">
              <label>Email Address *</label>
              <div className="portal-input-wrap">
                <Mail size={18} className="portal-input-icon" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="portal-form-group">
              <label>Phone Number</label>
              <div className="portal-input-wrap">
                <Phone size={18} className="portal-input-icon" />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="portal-security-notice">
              <h4><ShieldAlert size={16} /> Security Requirements</h4>
              <ul>
                <li><Monitor size={14} /> Fullscreen mode will be required</li>
                <li><EyeOff size={14} /> Tab switching and window focus changes are monitored</li>
                <li><Copy size={14} /> Copy/pasting is restricted</li>
              </ul>
            </div>

            <button type="submit" className="portal-start-btn" disabled={!name || !email}>
              <Play size={18} fill="currentColor" />
              Start Assessment
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
