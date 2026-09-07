import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Heading } from '@/components/ui';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className="ui-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="ui-modal-header">
          <Heading level={3} variant="titleMd">{title}</Heading>
          <button className="ui-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="ui-modal-content">
          {children}
        </div>
        {footer && (
          <footer className="ui-modal-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
