import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FileText, Clock, Percent } from 'lucide-react';
import { createAssessmentSchema } from '../../validation/schemas';
import type { CreateAssessmentFormValues } from '../../validation/schemas';
import { assessmentService } from '../../services/api/assessment.service';
import './TestCreate.css';

export const TestCreate: React.FC = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssessmentFormValues>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      language: 'English',
      duration_minutes: 60,
      pass_percentage: 70,
    },
  });

  const onSubmit = async (data: CreateAssessmentFormValues) => {
    try {
      setApiError(null);
      const response = await assessmentService.create({
        title: data.title,
        description: data.description,
        durationMinutes: data.duration_minutes,
        passingPercentage: data.pass_percentage,
      });
      console.info('[TestCreate] Created assessment:', response.data);
      // Backend returns the created assessment inside response.data
      navigate(`/dashboard/tests/detail/${response.data.id}`);
    } catch (err: any) {
      console.error('Failed to create assessment:', err);
      setApiError(err.response?.data?.message || 'Failed to create assessment');
    }
  };

  return (
    <div className="tc-page">
      <div className="tc-header">
        <button className="tc-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
          <span>Back to Tests</span>
        </button>
        <div className="tc-header-title">
          <h1>Create New Test</h1>
          <p>Set up the basics — you'll add questions in the next step.</p>
        </div>
      </div>

      <form className="tc-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {apiError && (
          <div className="tc-error-banner" style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {apiError}
          </div>
        )}

        <div className="tc-form-grid">
          <div className="tc-card">
            <div className="tc-section-title">
              <FileText size={18} />
              <span>Basic Information</span>
            </div>

            {/* Title */}
            <div className="tc-form-group">
              <label className="tc-label" htmlFor="title">
                Test Name <span className="tc-required">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`tc-input ${errors.title ? 'tc-input--error' : ''}`}
                placeholder="e.g. Senior Frontend Developer Assessment"
                {...register('title')}
              />
              {errors.title && (
                <span className="tc-error-msg">{errors.title.message}</span>
              )}
            </div>

            {/* Description */}
            <div className="tc-form-group">
              <label className="tc-label" htmlFor="description">
                Description <span className="tc-optional">(Optional)</span>
              </label>
              <textarea
                id="description"
                className="tc-textarea"
                rows={4}
                placeholder="Describe what this test assesses..."
                {...register('description')}
              />
            </div>
          </div>

          <div className="tc-card" style={{ height: 'fit-content' }}>
            <div className="tc-section-title">
              <Clock size={18} />
              <span>Duration & Scoring</span>
            </div>

            {/* Duration */}
            <div className="tc-form-group">
              <label className="tc-label" htmlFor="duration_minutes">
                Duration (mins) <span className="tc-required">*</span>
              </label>
              <div className="tc-input-with-icon">
                <Clock size={16} className="tc-input-icon" />
                <input
                  id="duration_minutes"
                  type="number"
                  min={1}
                  max={480}
                  className={`tc-input tc-input--icon ${errors.duration_minutes ? 'tc-input--error' : ''}`}
                  {...register('duration_minutes', { valueAsNumber: true })}
                />
              </div>
              {errors.duration_minutes && (
                <span className="tc-error-msg">{errors.duration_minutes.message}</span>
              )}
            </div>

            {/* Pass Percentage */}
            <div className="tc-form-group">
              <label className="tc-label" htmlFor="pass_percentage">
                Pass Percentage <span className="tc-optional">(Optional)</span>
              </label>
              <div className="tc-input-with-icon">
                <Percent size={16} className="tc-input-icon" />
                <input
                  id="pass_percentage"
                  type="number"
                  min={0}
                  max={100}
                  className={`tc-input tc-input--icon ${errors.pass_percentage ? 'tc-input--error' : ''}`}
                  {...register('pass_percentage', { valueAsNumber: true })}
                />
              </div>
              {errors.pass_percentage && (
                <span className="tc-error-msg">{errors.pass_percentage.message}</span>
              )}
            </div>
          </div>
        </div>

        <div className="tc-form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Test & Add Questions →'}
          </button>
        </div>
      </form>
    </div>
  );
};
