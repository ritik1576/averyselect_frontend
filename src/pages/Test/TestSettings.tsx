import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { AssessmentSecuritySettings } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateAssessmentRequest } from '../../store/slices/assessmentSlice';
import './TestSettings.css';

// MVP-scoped security settings state (6 fields only)
interface SecurityState extends Omit<AssessmentSecuritySettings,
  'id' | 'assessment_id' | 'created_at' | 'updated_at'
> {}

import type { Assessment } from '../../types';

interface TestSettingsProps {
  assessment?: Assessment;
}

export const TestSettings: React.FC<TestSettingsProps> = ({ assessment: currentAssessment }) => {
  const dispatch = useAppDispatch();
  // currentAssessment passed as prop
  const loading = useAppSelector(s => s.assessment.loading);

  const [title, setTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(45);
  const [passingPercentage, setPassingPercentage] = useState<number | ''>(60);

  const [security, setSecurity] = useState<SecurityState>({
    fullscreen_required: true,
    tab_switch_detection: true,
    window_focus_detection: false,
    copy_paste_blocking: true,
    large_paste_detection: false,
    unusual_activity_alerts: true,
  } as any);

  useEffect(() => {
    if (currentAssessment) {
      setTitle(currentAssessment.title || '');
      setDurationMinutes((currentAssessment as any).durationMinutes ?? 45);
      setPassingPercentage((currentAssessment as any).passingPercentage ?? 60);
      
      if ((currentAssessment as any).securitySetting) {
        setSecurity({
            fullscreen_required: (currentAssessment as any).securitySetting.fullscreen_required ?? true,
            tab_switch_detection: (currentAssessment as any).securitySetting.tab_switch_detection ?? true,
            window_focus_detection: (currentAssessment as any).securitySetting.window_focus_detection ?? false,
            copy_paste_blocking: (currentAssessment as any).securitySetting.copy_paste_blocking ?? true,
            large_paste_detection: (currentAssessment as any).securitySetting.large_paste_detection ?? false,
            unusual_activity_alerts: (currentAssessment as any).securitySetting.unusual_activity_alerts ?? true,
        } as any);
      }
    }
  }, [currentAssessment]);

  const handleSave = () => {
    if (!currentAssessment) return;
    dispatch(updateAssessmentRequest({
      id: currentAssessment.id,
      data: {
        title,
        durationMinutes: durationMinutes === '' ? 45 : durationMinutes,
        passingPercentage: passingPercentage === '' ? 60 : passingPercentage,
        securitySetting: security as any
      } as any
    }));
  };


  const toggleSecurity = (key: keyof SecurityState) => {
    setSecurity((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="ts-container">


      <div className="ts-content-scroll">
        {/* ── Section 1: Test Settings ─────────────────────── */}
        <div className="ts-section">
          <div className="ts-form-group">
            <label>Name your test</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ts-input"
            />
          </div>
          
          

          <div className="ts-form-group">
            <label>Passing percentage (%)</label>
            <input
              type="number"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))))}
              className="ts-input"
            />
          </div>

          {/* MVP: Language selection hidden — future phase
          <div className="ts-form-group">
            <label>
              In which language should questions be asked to the candidates?
            </label>
            <div className="ts-radio-group">
              {(['English', 'French', 'Spanish'] as AssessmentLanguage[]).map((lang) => (
                <label
                  key={lang}
                  className={`ts-radio ${language === lang ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    checked={language === lang}
                    onChange={() => setLanguage(lang)}
                  />
                  <span className="ts-radio-custom"></span>
                  {lang}
                </label>
              ))}
            </div>
          </div>
          */}
        </div>

        {/* ── Section 2: Test Integrity ─────────────────────── */}
        {/* MVP: 6 security settings only. Follow-up, Webcam, AI Assist removed. */}
        <div className="ts-section">
          <h2 className="ts-section-title">Test integrity</h2>



          <div className="ts-toggles-list">
            {/* unusual_activity_alerts */}
            <div className="ts-toggle-row">
              <div
                className={`ts-toggle-switch ${security.unusual_activity_alerts ? 'active' : ''}`}
                onClick={() => toggleSecurity('unusual_activity_alerts')}
              >
                <div className="ts-toggle-knob">
                  {security.unusual_activity_alerts && <Check size={10} color="#fff" strokeWidth={4} />}
                </div>
              </div>
              <div className="ts-toggle-info">
                <h4>Unusual activity alerts</h4>
                <p>
                  Candidate reports will include alerts if suspicious activity is
                  detected when analyzing the candidate's code.
                </p>
              </div>
            </div>

            {/* copy_paste_blocking */}
            <div className="ts-toggle-row">
              <div
                className={`ts-toggle-switch ${security.copy_paste_blocking ? 'active' : ''}`}
                onClick={() => toggleSecurity('copy_paste_blocking')}
              >
                <div className="ts-toggle-knob">
                  {security.copy_paste_blocking && <Check size={10} color="#fff" strokeWidth={4} />}
                </div>
              </div>
              <div className="ts-toggle-info">
                <h4>Copy/paste blocking</h4>
                <p>Candidates can't paste text from outside the environment.</p>
              </div>
            </div>

            {/* large_paste_detection */}
            <div className="ts-toggle-row">
              <div
                className={`ts-toggle-switch ${security.large_paste_detection ? 'active' : ''}`}
                onClick={() => toggleSecurity('large_paste_detection')}
              >
                <div className="ts-toggle-knob">
                  {security.large_paste_detection && <Check size={10} color="#fff" strokeWidth={4} />}
                </div>
              </div>
              <div className="ts-toggle-info">
                <h4>Large paste detection</h4>
                <p>
                  Alerts are triggered when candidates paste large blocks of code
                  that exceed a reasonable typing threshold.
                </p>
              </div>
            </div>

            {/* tab_switch_detection */}
            <div className="ts-toggle-row">
              <div
                className={`ts-toggle-switch ${security.tab_switch_detection ? 'active' : ''}`}
                onClick={() => toggleSecurity('tab_switch_detection')}
              >
                <div className="ts-toggle-knob">
                  {security.tab_switch_detection && <Check size={10} color="#fff" strokeWidth={4} />}
                </div>
              </div>
              <div className="ts-toggle-info">
                <h4>Tab switch detection</h4>
                <p>
                  An alert is triggered when a candidate switches to another
                  browser tab during the test.
                </p>
              </div>
            </div>

            {/* window_focus_detection */}
            <div className="ts-toggle-row">
              <div
                className={`ts-toggle-switch ${security.window_focus_detection ? 'active' : ''}`}
                onClick={() => toggleSecurity('window_focus_detection')}
              >
                <div className="ts-toggle-knob">
                  {security.window_focus_detection && <Check size={10} color="#fff" strokeWidth={4} />}
                </div>
              </div>
              <div className="ts-toggle-info">
                <h4>Window focus detection</h4>
                <p>
                  An alert is triggered when the test window loses focus, such
                  as switching to another application.
                </p>
              </div>
            </div>

            {/* fullscreen_required */}
            <div className="ts-toggle-row">
              <div
                className={`ts-toggle-switch ${security.fullscreen_required ? 'active' : ''}`}
                onClick={() => toggleSecurity('fullscreen_required')}
              >
                <div className="ts-toggle-knob">
                  {security.fullscreen_required && <Check size={10} color="#fff" strokeWidth={4} />}
                </div>
              </div>
              <div className="ts-toggle-info">
                <h4>Full-screen mode</h4>
                <p>
                  Candidates must enter full-screen mode before starting the
                  test. Exiting full-screen mode or switching to another monitor
                  will trigger an alert.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Timer ─────────────────────────────── */}
        {/* DB: assessments.duration_minutes (NOT NULL INT)
            Only Global Timer is supported for MVP.
            Timer Per Question requires questions.time_limit_seconds — not yet in schema.
            No time limit requires duration_minutes to be nullable — not yet supported.
        */}
        <div className="ts-section ts-pb-100">
          <h2 className="ts-section-title">Timer</h2>
          <div className="ts-form-group">
            <label>How would you like to time the candidate?</label>
            <div className="ts-timer-cards">

              {/* MVP: Timer Per Question — not in DB schema yet (requires questions.time_limit_seconds)
              <div className="ts-timer-card ts-timer-card--disabled">
                <div className="ts-timer-card-title">TIMER PER QUESTION</div>
                <div className="ts-timer-card-desc">
                  <p>Each question is timed. When the timer for a question ends,
                    the candidate automatically moves to the next question.</p>
                  <p>Candidates can't revisit previous questions, even if they
                    didn't use the full time allotted.</p>
                </div>
              </div>
              */}

              {/* Global Timer — maps to assessments.duration_minutes */}
              <div className="ts-timer-card active ts-timer-card--full">
                <div className="ts-timer-card-title">GLOBAL TIMER</div>
                <div className="ts-timer-card-desc">
                  <p className="ts-danger-text">
                    Candidates have a set amount of time to complete the entire
                    test and can pace themselves as they wish.
                  </p>
                  <p>
                    Candidates can revisit previous questions to check or update
                    answers before submitting.
                  </p>
                </div>
                <div className="ts-timer-input-group">
                  <label htmlFor="ts-duration">Allotted time (minutes)</label>
                  <input
                    id="ts-duration"
                    type="number"
                    min={1}
                    max={480}
                    className="ts-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Math.min(480, Math.max(1, Number(e.target.value))))}
                  />
                </div>
                {/* MVP: "No time limit" requires duration_minutes to be nullable in DB — not supported yet
                <label className="ts-checkbox-label">
                  <div className="ts-custom-checkbox"></div>
                  No time limit
                </label>
                */}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="ts-sticky-footer">
        <button className="btn-secondary">Preview</button>
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};
