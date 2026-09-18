import React, { useState } from 'react';
import { X, Plus, Trash2, Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { assessmentService } from '../../../services/api/assessment.service';
import toast from 'react-hot-toast';
import './InviteCandidatesModal.css';

interface CandidateRow {
  id: string;
  name: string;
  email: string;
}

interface InviteCandidatesModalProps {
  assessmentId: string;
  assessmentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteCandidatesModal: React.FC<InviteCandidatesModalProps> = ({
  assessmentId,
  assessmentTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [candidates, setCandidates] = useState<CandidateRow[]>([
    { id: '1', name: '', email: '' },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setCandidates((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', email: '' },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (candidates.length <= 1) return;
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChange = (id: string, field: 'name' | 'email', value: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    if (error) setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // If user presses Enter on the last email field, automatically add another row
    if (e.key === 'Enter' && index === candidates.length - 1) {
      e.preventDefault();
      const current = candidates[index];
      if (current.email.trim()) {
        handleAddRow();
      }
    }
  };

  const validateEmails = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < candidates.length; i++) {
      const { email } = candidates[i];
      if (!email.trim()) {
        setError(`Candidate #${i + 1} is missing an email address.`);
        return false;
      }
      if (!emailRegex.test(email.trim())) {
        setError(`"${email}" is not a valid email address.`);
        return false;
      }
    }
    return true;
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmails()) return;

    setIsSending(true);
    setError(null);

    try {
      const payload = candidates.map((c) => ({
        name: c.name.trim() || undefined,
        email: c.email.trim(),
      }));

      const res = await assessmentService.inviteCandidates(assessmentId, payload);
      
      toast.success(res.message || `Successfully sent ${payload.length} invitation(s)!`);
      
      // Reset state
      setCandidates([{ id: Date.now().toString(), name: '', email: '' }]);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to dispatch invitations. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="invite-modal-header">
          <div className="invite-modal-title-wrap">
            <div className="invite-icon-badge">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="invite-modal-title">Invite Candidates</h2>
              <p className="invite-modal-subtitle">
                Send personalized assessment links for <strong>{assessmentTitle}</strong>
              </p>
            </div>
          </div>
          <button className="invite-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="invite-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSendInvites} className="invite-modal-form">
          <div className="invite-rows-header">
            <span>Candidates ({candidates.length})</span>
            <span className="invite-hint">Press enter in email to add next candidate</span>
          </div>

          <div className="invite-candidates-list">
            {candidates.map((cand, idx) => (
              <div key={cand.id} className="invite-candidate-row">
                <span className="invite-row-num">{idx + 1}</span>
                <div className="invite-input-col">
                  <input
                    type="text"
                    className="invite-input"
                    placeholder="Candidate Name (Optional)"
                    value={cand.name}
                    onChange={(e) => handleChange(cand.id, 'name', e.target.value)}
                    disabled={isSending}
                    autoFocus={idx === 0}
                  />
                </div>
                <div className="invite-input-col invite-input-col--email">
                  <input
                    type="email"
                    className="invite-input"
                    placeholder="Email Address *"
                    value={cand.email}
                    onChange={(e) => handleChange(cand.id, 'email', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    disabled={isSending}
                    required
                  />
                </div>
                {candidates.length > 1 && (
                  <button
                    type="button"
                    className="invite-remove-row-btn"
                    onClick={() => handleRemoveRow(cand.id)}
                    title="Remove candidate"
                    disabled={isSending}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Another Button */}
          <button
            type="button"
            className="invite-add-btn"
            onClick={handleAddRow}
            disabled={isSending}
          >
            <Plus size={16} />
            <span>Add another candidate</span>
          </button>

          {/* Notice Box */}
          <div className="invite-notice-box">
            <CheckCircle2 size={16} className="invite-notice-icon" />
            <p>
              Candidates will receive a branded invitation email with their individual link.
              Their status (Sent, Opened, In Progress, Completed) is tracked automatically.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="invite-modal-footer">
            <button
              type="button"
              className="invite-btn-cancel"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="invite-btn-submit"
              disabled={isSending || candidates.every((c) => !c.email.trim())}
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send {candidates.length} Invitation{candidates.length > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
