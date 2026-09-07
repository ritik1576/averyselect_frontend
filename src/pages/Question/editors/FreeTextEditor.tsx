import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../store/hooks';
import { createFreeTextSchema } from '../../../validation/schemas';
import type { FreeTextFormValues } from '../../../validation/schemas';
import { Heading, Text } from '../../../components/ui/Typography';
import { Button } from '../../../components/ui';
import { EditorSettingsPanel } from '../../../components/layout/EditorSettingsPanel';
import { createQuestionRequest, updateQuestionRequest, fetchQuestionByIdRequest } from '../../../store/slices/questionSlice';
import '../QuestionEditor.css';

export const FreeTextEditor: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { loading, currentQuestion } = useAppSelector((state) => state.question);

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<FreeTextFormValues>({
    resolver: zodResolver(createFreeTextSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 3,
      estimated_time: '00:15',
      points: 20,
      model_answer: '',
    },
  });


  React.useEffect(() => {
    if (id) {
      dispatch(fetchQuestionByIdRequest(id));
    }
  }, [id, dispatch]);

  React.useEffect(() => {
    if (id && currentQuestion && currentQuestion.id === id) {
      reset({
        ...currentQuestion,
        estimated_time: currentQuestion.estimated_time_seconds 
          ? new Date(currentQuestion.estimated_time_seconds * 1000).toISOString().substring(11, 16) 
          : '00:05'
      });
    }
  }, [id, currentQuestion, reset]);

  const onSubmit = (data: FreeTextFormValues) => {
    const [hh, mm] = data.estimated_time.split(':').map(Number);
    const estimated_time_seconds = (hh * 3600) + (mm * 60);

    const payload = {
      ...data,
      question_type: 'free_text' as const,
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
          <Heading level={1} variant="headlineLg">FreeText Question</Heading>
          
          <div className="editor-card mt-md">
            <div className="form-group">
              <input 
                type="text" 
                className={`title-input-seamless ${errors.title ? 'error' : ''}`}
                placeholder="Question Title..." 
                {...register('title')}
              />
              {errors.title && <span className="field-error">{errors.title.message}</span>}
            </div>

            <div className="form-group mt-md">
              <Text variant="labelSm" color="neutral">Prompt / Context</Text>
              <textarea 
                className={`ui-textarea ${errors.description ? 'error' : ''}`}
                rows={8} 
                placeholder="Provide the detailed prompt that the candidate will respond to..."
                {...register('description')}
              />
              {errors.description && <span className="field-error">{errors.description.message}</span>}
            </div>
          </div>

          <Heading level={2} variant="titleMd" className="mt-lg mb-sm">Grading Rubric (Optional)</Heading>
          <div className="editor-card mt-md">
            <div className="form-group">
              <Text variant="labelSm" color="neutral">Model Answer / Key Points</Text>
              <textarea 
                className={`ui-textarea ${errors.model_answer ? 'error' : ''}`}
                rows={6} 
                placeholder="Define what a 100% score looks like. E.g. 'Must mention lexical scope, returning a function...'"
                {...register('model_answer')}
              />
              {errors.model_answer && <span className="field-error">{errors.model_answer.message}</span>}
            </div>
          </div>
        </div>
        {/* ── Settings Panel ────────────────────────────────── */}
        <div className="editor-settings-sidebar">
          <EditorSettingsPanel register={register} control={control as any} errors={errors} />
        </div>
      </div>
    </form>
  );
};
