import React from 'react';
import { CheckCircle2, Award } from 'lucide-react';
import './CandidateSubmitted.css';

export const CandidateSubmitted: React.FC = () => {
  const candidateName = localStorage.getItem('candidate_name') || 'Candidate';

  return (
    <div className="cs-container">
      <div className="cs-card">
        <div className="cs-icon-wrapper">
          <CheckCircle2 size={56} color="#ef4623" />
        </div>

        <h1 className="cs-title">Assessment Submitted!</h1>
        <p className="cs-subtitle">
          Thank you, <strong>{candidateName}</strong>. Your answers have been safely recorded and submitted to the recruiting team for evaluation.
        </p>

        <div className="cs-info-box">
          <Award size={20} color="#ea580c" />
          <div>
            <strong>What happens next?</strong>
            <p>The recruiter will review your code submissions and test score. You will be notified via email regarding the next steps.</p>
          </div>
        </div>

        <div className="cs-footer-text">
          You may now safely close this browser window.
        </div>
      </div>
    </div>
  );
};
