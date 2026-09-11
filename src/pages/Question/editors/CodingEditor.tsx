import React, { Suspense, lazy } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, Terminal, Code2, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../store/hooks';
import { createCodingSchema } from '../../../validation/schemas';
import type { CodingFormValues } from '../../../validation/schemas';
import { Heading, Text, Button } from '@/components/ui';
import { createQuestionRequest, updateQuestionRequest, fetchQuestionByIdRequest } from '../../../store/slices/questionSlice';
import { EditorSettingsPanel } from '../../../components/layout/EditorSettingsPanel';
import '../QuestionEditor.css';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((m) => ({ default: m.default }))
);

type SupportedLanguage = 'javascript' | 'python' | 'typescript' | 'java' | 'cpp';

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string; monacoLang: string; tabIcon: string }[] = [
  { value: 'javascript', label: 'JavaScript (Node.js)', monacoLang: 'javascript', tabIcon: 'js' },
  { value: 'python', label: 'Python 3', monacoLang: 'python', tabIcon: 'py' },
  { value: 'typescript', label: 'TypeScript', monacoLang: 'typescript', tabIcon: 'ts' },
  { value: 'java', label: 'Java', monacoLang: 'java', tabIcon: 'java' },
  { value: 'cpp', label: 'C++', monacoLang: 'cpp', tabIcon: 'cpp' },
];

const STARTER_CODE_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `/**
 * @param {any} input
 * @return {any}
 */
function solution(input) {
  // Write your solution here

}

module.exports = solution;`,
  python: `def solution(input):
    # Write your solution here
    pass`,
  typescript: `function solution(input: any): any {
  // Write your solution here
}

export default solution;`,
  java: `public class Solution {
    public static Object solution(Object input) {
        // Write your solution here
        return null;
    }
}`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
using namespace std;

// Write your solution here
string solution(string input) {
    return input;
}`,
};

export const CodingEditor: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { loading, currentQuestion } = useAppSelector((state) => state.question);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CodingFormValues>({
    resolver: zodResolver(createCodingSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      difficulty: 3,
      estimated_time: '00:20',
      points: 50,
      language: 'javascript',
      starter_code: STARTER_CODE_TEMPLATES.javascript,
      test_cases: [
        { id: 'tc-1', title: 'Test Case 1', input: '', expected_output: '', is_hidden: false },
      ],
      executionMode: 'FULL_PROGRAM',
      functionContract: null,
    },
  });

  const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({
    control,
    name: 'test_cases',
  });

  const { fields: paramFields, append: appendParam, remove: removeParam } = useFieldArray({
    control,
    name: 'functionContract.parameters' as any, // dynamic array for function contract
  });

  const currentExecutionMode = watch('executionMode');
  const functionContract = watch('functionContract');

  const previewSignature = React.useMemo(() => {
    if (!functionContract?.functionName) return null;
    const params = (functionContract.parameters || [])
      .map((p: any) => `${p?.name || 'arg'}: ${p?.type || 'any'}`)
      .join(', ');
    return `${functionContract.functionName}(${params}): ${functionContract.returnType || 'void'}`;
  }, [functionContract]);

  const selectedLanguage = watch('language');
  const starterCode = watch('starter_code');

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setValue('language', lang);
    setValue('starter_code', STARTER_CODE_TEMPLATES[lang]);
  };




  React.useEffect(() => {
    if (id) {
      dispatch(fetchQuestionByIdRequest(id));
    }
  }, [id, dispatch]);

  React.useEffect(() => {
    if (id && currentQuestion && String(currentQuestion.id) === String(id)) {
      reset({
        title: (currentQuestion as any).title ?? '',
        description: (currentQuestion as any).description ?? (currentQuestion as any).text ?? '',
        difficulty: (currentQuestion as any).difficulty ?? 3,
        points: (currentQuestion as any).points ?? 50,
        estimated_time: currentQuestion.estimated_time_seconds
          ? new Date(currentQuestion.estimated_time_seconds * 1000).toISOString().substring(11, 16)
          : '00:15',
        language: ((currentQuestion as any).language as SupportedLanguage) ?? 'javascript',
        starter_code: (currentQuestion as any).starter_code || STARTER_CODE_TEMPLATES[((currentQuestion as any).language as SupportedLanguage) || 'javascript'] || STARTER_CODE_TEMPLATES.javascript,
        test_cases: (currentQuestion as any).test_cases?.length
          ? (currentQuestion as any).test_cases.map((tc: any, idx: number) => ({
              id: tc.id ?? `tc-${idx}`,
              title: tc.title ?? `Test Case ${idx + 1}`,
              input: tc.input ?? '',
              expected_output: tc.expected_output ?? tc.expectedOutput ?? '',
              is_hidden: tc.is_hidden ?? tc.isHidden ?? false,
            }))
          : [{ id: 'tc-1', title: 'Test Case 1', input: '', expected_output: '', is_hidden: false }],
        executionMode: (currentQuestion as any).executionMode || 'FULL_PROGRAM',
        functionContract: (currentQuestion as any).functionContract || null,
      });
    }
  }, [id, currentQuestion, reset]);

  const onSubmit = (data: CodingFormValues) => {
    const [hh, mm] = data.estimated_time.split(':').map(Number);
    const estimated_time_seconds = (hh * 3600) + (mm * 60);

    const payload = {
      ...data,
      language: selectedLanguage,
      starter_code: starterCode,
      question_type: 'coding' as const,
      estimated_time_seconds,
      executionMode: data.executionMode,
      functionContract: data.executionMode === 'FUNCTION' ? data.functionContract : null
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

  const selectedLangOption = LANGUAGE_OPTIONS.find((l) => l.value === selectedLanguage) ?? LANGUAGE_OPTIONS[0];

  return (
    <form className="page-question-editor" onSubmit={handleSubmit(onSubmit, (errs) => {
      const firstErrorKey = Object.keys(errs)[0];
      if (firstErrorKey) {
        const error = errs[firstErrorKey as keyof CodingFormValues];
        if (error && typeof error === 'object' && 'message' in error) {
          toast.error(`Validation Error: ${error.message}`);
        } else if (Array.isArray(error)) {
          const firstItemWithErr = error.find(e => e !== undefined);
          if (firstItemWithErr) {
            const firstSubKey = Object.keys(firstItemWithErr)[0];
            toast.error(`Validation Error in Test Cases: ${firstItemWithErr[firstSubKey]?.message}`);
          } else {
             toast.error(`Validation Error in ${firstErrorKey}`);
          }
        } else {
          toast.error(`Validation Error in ${firstErrorKey}`);
        }
      }
    })} noValidate>
      <div className="editor-top-bar">
        <Link to="/dashboard/questions" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </Link>
        <div className="editor-top-actions">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/questions')}>Cancel</Button>
          <Button icon={<Save size={16} />} type="submit" variant="primary" disabled={loading} className={loading ? "opacity-50 cursor-not-allowed" : ""}>
            {loading ? 'Saving...' : 'Save Question'}
          </Button>
        </div>
      </div>
      
      <div className="editor-content-wrapper">
        {/* ── Main Panel ─────────────────────────────────── */}
        <div className="editor-main-panel">
          <Heading level={1} variant="headlineLg">Coding Exercise</Heading>

          <div className="editor-card mt-md">
            <div className="form-group">
              <input
                type="text"
                className={`title-input-seamless ${errors.title ? 'input-error-border' : ''}`}
                placeholder="Exercise Title..."
                {...register('title')}
              />
              {errors.title && <span className="tc-error-msg">{errors.title.message}</span>}
            </div>

            <div className="form-group mt-md">
              <Text variant="labelSm" color="neutral">Problem Description <span className="tc-required">*</span></Text>
              <textarea
                className={`ui-textarea ${errors.description ? 'input-error-border' : ''}`}
                rows={6}
                placeholder="Describe the problem, input formats, output formats, and constraints..."
                {...register('description')}
              />
              {errors.description && <span className="tc-error-msg">{errors.description.message}</span>}
            </div>
          </div>

          {/* ── Execution Configuration ────────────────────── */}
          <div className="editor-card mt-lg">
            <div className="execution-config-header">
              <Heading level={2} variant="titleMd">Execution Mode</Heading>
              <p className="execution-config-subtitle">Choose how candidate submissions are executed and evaluated against test cases.</p>
            </div>

            <div className="execution-mode-cards">
              <label className={`execution-mode-card ${currentExecutionMode === 'FULL_PROGRAM' ? 'execution-mode-card--active' : ''}`}>
                <input
                  type="radio"
                  className="execution-mode-radio-input"
                  value="FULL_PROGRAM"
                  {...register('executionMode')}
                  onChange={() => {
                    setValue('executionMode', 'FULL_PROGRAM');
                    setValue('functionContract', null as any);
                  }}
                />
                <div className="execution-mode-indicator">
                  <div className="execution-mode-dot" />
                </div>
                <div className="execution-mode-content">
                  <div className="execution-mode-title-row">
                    <Terminal size={18} className="execution-mode-icon" />
                    <h4 className="execution-mode-title">Full Program</h4>
                    <span className="execution-mode-badge">Stdin / Stdout</span>
                  </div>
                  <p className="execution-mode-desc">
                    Candidate writes code reading from standard input and printing to standard output.
                  </p>
                </div>
              </label>

              <label className={`execution-mode-card ${currentExecutionMode === 'FUNCTION' ? 'execution-mode-card--active' : ''}`}>
                <input
                  type="radio"
                  className="execution-mode-radio-input"
                  value="FUNCTION"
                  {...register('executionMode')}
                  onChange={() => {
                    setValue('executionMode', 'FUNCTION');
                    if (!watch('functionContract')) {
                      setValue('functionContract', { functionName: '', parameters: [], returnType: 'int' } as any);
                    }
                  }}
                />
                <div className="execution-mode-indicator">
                  <div className="execution-mode-dot" />
                </div>
                <div className="execution-mode-content">
                  <div className="execution-mode-title-row">
                    <Code2 size={18} className="execution-mode-icon" />
                    <h4 className="execution-mode-title">Function Wrapper</h4>
                    <span className="execution-mode-badge">Contract-Based</span>
                  </div>
                  <p className="execution-mode-desc">
                    Candidate defines a specific function. Platform wraps execution and serializes arguments automatically.
                  </p>
                </div>
              </label>
            </div>

            {currentExecutionMode === 'FUNCTION' && (
              <div className="function-contract-panel">
                <div className="contract-header">
                  <div className="contract-header-left">
                    <div className="contract-title-row">
                      <FileCode size={18} className="contract-title-icon" />
                      <h3 className="contract-title">Function Contract</h3>
                    </div>
                    <p className="contract-desc">Define the function name, parameter list, and return type candidates must adhere to.</p>
                  </div>
                  {previewSignature && (
                    <div className="contract-preview-pill">
                      <span className="contract-preview-label">Live Signature</span>
                      <code className="contract-preview-code">{previewSignature}</code>
                    </div>
                  )}
                </div>

                <div className="contract-form-grid">
                  <div className="form-group">
                    <label className="contract-field-label">
                      <span>Function Name</span>
                      <span className="tc-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`contract-input ${errors.functionContract?.functionName ? 'input-error-border' : ''}`}
                      placeholder="e.g. twoSum"
                      {...register('functionContract.functionName')}
                    />
                    {errors.functionContract?.functionName && (
                      <span className="tc-error-msg">{errors.functionContract.functionName.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="contract-field-label">
                      <span>Return Type</span>
                      <span className="tc-required">*</span>
                    </label>
                    <select
                      className={`contract-select ${errors.functionContract?.returnType ? 'input-error-border' : ''}`}
                      {...register('functionContract.returnType')}
                    >
                      <option value="int">int</option>
                      <option value="double">double</option>
                      <option value="boolean">boolean</option>
                      <option value="string">string</option>
                      <option value="int[]">int[]</option>
                      <option value="double[]">double[]</option>
                      <option value="boolean[]">boolean[]</option>
                      <option value="string[]">string[]</option>
                    </select>
                    {errors.functionContract?.returnType && (
                      <span className="tc-error-msg">{errors.functionContract.returnType.message}</span>
                    )}
                  </div>
                </div>

                <div className="contract-params-container">
                  <div className="contract-params-header">
                    <div className="contract-params-title">
                      <span>Parameters</span>
                      <span className="contract-params-count">{paramFields.length}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => appendParam({ name: '', type: 'int' })}
                    >
                      Add Parameter
                    </Button>
                  </div>

                  {errors.functionContract?.parameters?.root && (
                    <span className="tc-error-msg block mb-2">{errors.functionContract.parameters.root.message}</span>
                  )}

                  {paramFields.length > 0 && (
                    <div className="contract-params-col-headers">
                      <span className="contract-col-header-text">Parameter Name</span>
                      <span className="contract-col-header-text">Type</span>
                      <span />
                    </div>
                  )}

                  {paramFields.map((field, index) => (
                    <div key={field.id} className="contract-param-row">
                      <div>
                        <input
                          type="text"
                          className={`contract-input ${(errors.functionContract?.parameters as any)?.[index]?.name ? 'input-error-border' : ''}`}
                          placeholder="e.g. nums"
                          {...register(`functionContract.parameters.${index}.name` as any)}
                        />
                        {(errors.functionContract?.parameters as any)?.[index]?.name && (
                          <span className="tc-error-msg block mt-1">
                            {(errors.functionContract?.parameters as any)[index].name.message}
                          </span>
                        )}
                      </div>
                      <div className="contract-param-type-col">
                        <select
                          className="contract-select"
                          {...register(`functionContract.parameters.${index}.type` as any)}
                        >
                          <option value="int">int</option>
                          <option value="double">double</option>
                          <option value="boolean">boolean</option>
                          <option value="string">string</option>
                          <option value="int[]">int[]</option>
                          <option value="double[]">double[]</option>
                          <option value="boolean[]">boolean[]</option>
                          <option value="string[]">string[]</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="contract-param-delete-btn"
                        title="Remove parameter"
                        onClick={() => removeParam(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {paramFields.length === 0 && (
                    <div className="contract-empty-params">
                      <p className="contract-empty-params-text">No parameters defined. If this function accepts arguments, add them above.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => appendParam({ name: '', type: 'int' })}
                      >
                        Add First Parameter
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Code Editor (Monaco) ─────────────────────── */}
          <div className="mt-lg">
            <Heading level={2} variant="titleMd" className="mb-sm">Starter Code</Heading>
            <div className="code-editor-container">
              <div className="code-editor-header">
                <div className="code-editor-tabs">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      className={`code-tab ${selectedLanguage === lang.value ? 'code-tab--active' : ''}`}
                      onClick={() => handleLanguageChange(lang.value)}
                    >
                      <div className={`code-tab-icon ${lang.tabIcon}`} />
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <Suspense fallback={
                <div className="monaco-loading">Loading editor...</div>
              }>
                <MonacoEditor
                  height="340px"
                  language={selectedLangOption.monacoLang}
                  value={starterCode}
                  onChange={(val) => setValue('starter_code', val ?? '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    tabSize: 2,
                  }}
                />
              </Suspense>
            </div>
          </div>

          {/* ── Test Cases ────────────────────────────────── */}
          <div className="mt-lg">
            <div className="test-cases-header">
              <Heading level={2} variant="titleMd">Test Cases</Heading>
              <Button
                variant="outline"
                size="sm"
                type="button"
                icon={<Plus size={14} />}
                onClick={() => appendTestCase({
                  id: `tc-${Date.now()}`,
                  title: `Test Case ${testCaseFields.length + 1}`,
                  input: '',
                  expected_output: '',
                  is_hidden: false,
                })}
              >
                Add Test Case
              </Button>
            </div>
            {errors.test_cases?.root && (
              <span className="tc-error-msg mb-sm">{errors.test_cases.root.message}</span>
            )}

            {testCaseFields.map((field, index) => {
              const isHidden = watch(`test_cases.${index}.is_hidden`);
              return (
                <div key={field.id} className="test-case-block">
                  <div className="test-case-header">
                    <div className="test-case-title-row">
                      <input
                        type="text"
                        className="test-case-title-input"
                        placeholder={`Test Case ${index + 1}`}
                        {...register(`test_cases.${index}.title`)}
                      />
                      {isHidden ? (
                        <span className="test-case-badge badge-hidden">Hidden</span>
                      ) : (
                        <span className="test-case-badge badge-public">Public</span>
                      )}
                    </div>
                    <div className="test-case-actions">
                      <input 
                        type="checkbox" 
                        style={{ display: 'none' }} 
                        {...register(`test_cases.${index}.is_hidden`)} 
                      />
                      <button
                        type="button"
                        className="tc-icon-btn"
                        title={isHidden ? 'Make public' : 'Make hidden'}
                        onClick={() => {
                          setValue(`test_cases.${index}.is_hidden`, !isHidden, { shouldDirty: true });
                        }}
                      >
                        {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      {testCaseFields.length > 1 && (
                        <button
                          type="button"
                          className="tc-icon-btn tc-icon-btn--danger"
                          title="Remove test case"
                          onClick={() => removeTestCase(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="test-case-io">
                    <div className="form-group">
                      <Text variant="labelSm" color="neutral">Input <span className="tc-required">*</span></Text>
                      <textarea
                        className={`ui-textarea ui-textarea--sm ${errors.test_cases?.[index]?.input ? 'input-error-border' : ''}`}
                        rows={3}
                        placeholder="e.g. [1, 2, 3]"
                        {...register(`test_cases.${index}.input`)}
                      />
                      {errors.test_cases?.[index]?.input && (
                        <span className="tc-error-msg">{errors.test_cases[index]?.input?.message}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <Text variant="labelSm" color="neutral">Expected Output <span className="tc-required">*</span></Text>
                      <textarea
                        className={`ui-textarea ui-textarea--sm ${errors.test_cases?.[index]?.expected_output ? 'input-error-border' : ''}`}
                        rows={3}
                        placeholder="e.g. 6"
                        {...register(`test_cases.${index}.expected_output`)}
                      />
                      {errors.test_cases?.[index]?.expected_output && (
                        <span className="tc-error-msg">{errors.test_cases[index]?.expected_output?.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
