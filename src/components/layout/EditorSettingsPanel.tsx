import React from 'react';
import { Controller } from 'react-hook-form';
import type { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import { Card } from '../ui/Card';
import { Heading, Text } from '../ui/Typography';
import { DifficultySelector } from '../DifficultySelector/DifficultySelector';

interface EditorSettingsPanelProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
}

export const EditorSettingsPanel: React.FC<EditorSettingsPanelProps> = ({ register, control, errors }) => {
  return (
    <Card className="settings-panel">
      <Heading level={2} variant="titleMd" className="mb-md">Settings</Heading>
      
      <div className="form-group mb-md">
        <Text variant="labelSm" color="neutral" className="mb-xs block">Difficulty</Text>
        <Controller
          name="difficulty"
          control={control}
          rules={{ required: 'Difficulty is required' }}
          render={({ field }) => (
            <DifficultySelector
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.difficulty && <span className="tc-error-msg">{errors.difficulty.message as string}</span>}
      </div>

      <div className="form-group mb-md">
        <Text variant="labelSm" color="neutral" className="mb-xs block">Points / Marks</Text>
        <input
          type="number"
          className="ui-input"
          min="1"
          {...register('points', { valueAsNumber: true })}
        />
        {errors.points && <span className="tc-error-msg">{errors.points.message as string}</span>}
      </div>


      <div className="form-group">
        <Text variant="labelSm" color="neutral" className="mb-xs block">Estimated Time (MM:SS)</Text>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="ui-input"
            placeholder="00:05"
            {...register('estimated_time')}
          />
        </div>
      </div>
    </Card>
  );
};
