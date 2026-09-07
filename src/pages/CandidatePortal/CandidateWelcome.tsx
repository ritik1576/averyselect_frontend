import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { startAssessmentRequest } from '../../store/slices/sessionSlice';
import { candidateService } from '../../services/api/candidate.service';
import { Clock, HelpCircle, ShieldAlert, Camera, MonitorX, AlertCircle, ArrowRight } from 'lucide-react';
import './CandidateWelcome.css';

export const CandidateWelcome: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Track success to navigate
  const { loading, error: reduxError } = useAppSelector((state) => state.session);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  // We can use a local state to see if we just submitted
  const [submitted, setSubmitted] = useState(false);
  const [assessmentInfo, setAssessmentInfo] = useState<any>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token) return;
      try {
        const res = await candidateService.getAssessmentInfo(token);
        if (res.success) setAssessmentInfo(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load assessment details');
      } finally {
        setInfoLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  useEffect(() => {
    // If we submitted and it's no longer loading and there is no error, it was a success!
    if (submitted && !loading && !reduxError) {
      navigate(`/take/${token || 'demo'}/runner`);
    }
    if (reduxError) {
      setError(reduxError);
      setSubmitted(false);
    }
  }, [loading, reduxError, submitted, navigate, token]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email address.');
      return;
    }
    if (!agreed) {
      setError('You must agree to the assessment guidelines to proceed.');
      return;
    }
    setError('');
    setSubmitted(true);
    
    // Dispatch the start assessment action which will fetch the token
    if (token) {
      dispatch(startAssessmentRequest({ token, name, email }));
    } else {
      setError('Invalid test link (missing token)');
      setSubmitted(false);
    }
  };

  return (
    <div className="cw-page-container">
      <div className="cw-card">
        {/* Header Branding */}
        <div className="cw-header">
          <div className="cw-badge-brand">{assessmentInfo?.companyName || 'AverySelect Assessments'}</div>
          <h1 className="cw-title">{assessmentInfo?.title || 'Frontend Developer Technical Assessment'}</h1>
          <p className="cw-subtitle">{assessmentInfo?.description || 'Please confirm your details and review the proctoring guidelines before starting.'}</p>
        </div>

        {/* Test Overview Chips */}
        <div className="cw-meta-row">
          <div className="cw-meta-chip">
            <Clock size={16} color="#ef4623" />
            <span>Duration: <strong>{assessmentInfo?.durationMinutes || 60} minutes</strong></span>
          </div>
          <div className="cw-meta-chip">
            <HelpCircle size={16} color="#ef4623" />
            <span>Questions: <strong>{assessmentInfo?.questionCount || 12} Total</strong></span>
          </div>
          <div className="cw-meta-chip">
            <ShieldAlert size={16} color="#ef4623" />
            <span>Proctoring: <strong>{assessmentInfo?.securitySetting?.proctoringLevel === 'STRICT' ? 'Strict Mode' : 'Standard'}</strong></span>
          </div>
        </div>

        {/* Proctoring Rules Box */}
        <div className="cw-rules-box">
          <div className="cw-rules-header">
            <ShieldAlert size={18} color="#ef4623" />
            <h3>Assessment Guidelines & Security</h3>
          </div>
          <div className="cw-rules-grid">
            <div className="cw-rule-item">
              <Camera size={16} className="cw-rule-icon" />
              <div>
                <strong>Webcam Proctoring</strong>
                <p>Periodic snapshots will be captured for anti-cheating verification.</p>
              </div>
            </div>
            <div className="cw-rule-item">
              <MonitorX size={16} className="cw-rule-icon" />
              <div>
                <strong>Tab Switch Tracking</strong>
                <p>Leaving the test window or switching browser tabs is recorded.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleStart} className="cw-form">
          {error && (
            <div className="cw-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!infoLoading && (
            <>

          <div className="cw-field">
            <label htmlFor="cand-name">Full Name *</label>
            <input 
              id="cand-name"
              type="text" 
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="cw-field-row">
            <div className="cw-field">
              <label htmlFor="cand-email">Email Address *</label>
              <input 
                id="cand-email"
                type="email" 
                placeholder="e.g. jane.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="cw-field">
              <label htmlFor="cand-phone">Phone Number (Optional)</label>
              <input 
                id="cand-phone"
                type="tel" 
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="cw-checkbox-row">
            <input 
              id="agree-check" 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="cand-agree">
              I agree to the <a href="#">Terms & Conditions</a> and consent to the proctoring guidelines.
            </label>
          </div>

          <button 
            type="submit" 
            className="cw-start-btn" 
            disabled={loading || !assessmentInfo}
          >
            {loading ? 'Preparing Test...' : 'Start Assessment'}
            {!loading && <ArrowRight size={18} />}
          </button>
          </>
          )}
        </form>
      </div>
    </div>
  );
};
