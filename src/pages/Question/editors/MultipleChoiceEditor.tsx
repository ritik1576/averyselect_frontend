import React, { useId } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Check } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../store/hooks';
import { createMCQSchema } from '../../../validation/schemas';
import type { MCQFormValues } from '../../../validation/schemas';
import { Heading, Text, Button } from '@/components/ui';
import { EditorSettingsPanel } from '../../../components/layout/EditorSettingsPanel';
import { createQuestionRequest, updateQuestionRequest, fetchQuestionByIdRequest } from '../../../store/slices/questionSlice';
import '../QuestionEditor.css';

export const MultipleChoiceEditor: React.FC = () => {
  const fieldId = useId();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { loading, currentQuestion } = useAppSelector((state) => state.question);

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = useForm<MCQFormValues>({
    resolver: zodResolver(createMCQSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 3,
      estimated_time: '00:05',
      points: 10,
      options: [
        { id: 'opt-1', text: '', is_correct: false },
        { id: 'opt-2', text: '', is_correct: false },
      ],
    },
  });

  const { fields, append, remove, replace: replaceFieldArray } = useFieldArray({ control, name: 'options' });

  

  const handleSelectCorrect = (index: number) => {
    const currentOptions = getValues('options');
    const isCurrentlyCorrect = currentOptions[index]?.is_correct;
    
    const updatedOptions = currentOptions.map((opt, i) => ({
      ...opt,
      is_correct: i === index ? !isCurrentlyCorrect : false
    }));
    
    replaceFieldArray(updatedOptions);
  };


  React.useEffect(() => {
    fields.forEach((_, index) => {
      register(`options.${index}.is_correct`);
    });
  }, [fields, register]);

  React.useEffect(() => {
    if (id) {
      dispatch(fetchQuestionByIdRequest(id));
    }
  }, [id, dispatch]);

  React.useEffect(() => {
    if (id && currentQuestion && currentQuestion.id === id) {
      reset({
        ...currentQuestion,
        options: currentQuestion.options?.length 
          ? currentQuestion.options.map((opt: any, idx: number) => ({
              ...opt,
              id: opt.id || `opt-${idx + 1}`,
              text: opt.text || '',
              is_correct: opt.is_correct || false,
            }))
          : [
              { id: 'opt-1', text: '', is_correct: false },
              { id: 'opt-2', text: '', is_correct: false }
            ],

        estimated_time: currentQuestion.estimated_time_seconds 
          ? new Date(currentQuestion.estimated_time_seconds * 1000).toISOString().substring(11, 16) 
          : '00:05'
      });
    }
  }, [id, currentQuestion, reset]);

  const onSubmit = (data: MCQFormValues) => {
    const [hh, mm] = data.estimated_time.split(':').map(Number);
    const estimated_time_seconds = (hh * 3600) + (mm * 60);

    const payload = {
      ...data,
      question_type: 'mcq' as const,
      estimated_time_seconds
    };
    
    if (id) {
      dispatch(updateQuestionRequest({
        id,
        data: payload as any,
        onSuccess: () => navigate('/dashboard/questions')
      }));
    } else {
      dispatch(createQuestionRequest({
        data: payload as any,
        onSuccess: () => navigate('/dashboard/questions')
      }));
    }
  };

  return (
    <form className="page-question-editor" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="editor-top-bar">
        <Link to="/dashboard/questions" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </Link>
        <div className="editor-actions">
          <Button variant="ghost" type="button">Cancel</Button>
          <Button icon={<Save size={16} />} type="submit" disabled={loading} className={loading ? "opacity-50 cursor-not-allowed" : ""}>
            {loading ? 'Saving...' : 'Save Question'}
          </Button>
        </div>
      </div>

      <div className="editor-content-wrapper">
        {/* ── Main Panel ─────────────────────────────────── */}
        <div className="editor-main-panel">
          <Heading level={1} variant="headlineLg">Multiple Choice Question</Heading>

          {/* Question Info Card */}
          <div className="editor-card mt-md">
            <div className="form-group">
              <input
                type="text"
                id={`${fieldId}-title`}
                className={`title-input-seamless ${errors.title ? 'input-error-border' : ''}`}
                placeholder="Question Title..."
                {...register('title')}
              />
              {errors.title && <span className="tc-error-msg">{errors.title.message}</span>}
            </div>

            <div className="form-group mt-md">
              <Text variant="labelSm" color="neutral">Description / Context (Optional)</Text>
              <textarea
                className="ui-textarea"
                rows={4}
                placeholder="Add additional context, code snippets, or images..."
                {...register('description')}
              />
            </div>
          </div>

          {/* Options Card */}
          <Heading level={2} variant="titleMd" className="mt-lg mb-sm">Answer Options</Heading>
          {errors.options?.root && (
            <span className="tc-error-msg mb-sm">{errors.options.root.message}</span>
          )}
          <div className="editor-card editor-options-card">
            <div className="editor-options-list">
              {fields.map((field, index) => {
                const isCorrect = watch(`options.${index}.is_correct`);
                return (
                  <div key={field.id} className={`option-row ${isCorrect ? 'is-correct' : ''}`}>
                    {/* Custom radio toggle */}
                    <button
                      type="button"
                      className={`option-radio-btn ${isCorrect ? 'option-radio-btn--checked' : ''}`}
                      onClick={() => handleSelectCorrect(index)}
                      title={isCorrect ? 'Unmark as correct' : 'Mark as correct'}
                    >
                      {isCorrect && <Check size={14} />}
                    </button>
                    <input
                      type="text"
                      className={`option-input ${errors.options?.[index]?.text ? 'input-error-border' : ''}`}
                      placeholder={`Option ${index + 1}...`}
                      {...register(`options.${index}.text`)}
                    />
                    {fields.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        icon={<Trash2 size={16} className="text-error" />}
                        onClick={() => remove(index)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="add-option-btn-dashed"
              onClick={() => append({ id: `opt-${Date.now()}`, text: '', is_correct: false })}
            >
              <Plus size={16} /> Add Option
            </button>
          </div>
        </div>

        {/* ── Settings Sidebar ────────────────────────────── */}
        <div className="editor-settings-sidebar">
          <EditorSettingsPanel register={register} control={control as any} errors={errors} />
        </div>
      </div>
    </form>
  );
};
