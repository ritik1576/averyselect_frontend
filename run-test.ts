import { z } from 'zod';
import { createCodingSchemaBase } from './src/validation/schemas';

const formData = {
  title: 'Test',
  description: 'Test',
  difficulty: 3,
  estimated_time: '15m',
  points: 10,
  language: 'javascript',
  test_cases: [{ id: '1', title: 'TC', input: '1', expected_output: '1', is_hidden: false }],
  executionMode: 'FULL_PROGRAM',
  functionContract: {
    functionName: 'add',
    returnType: 'int',
    parameters: [{ name: 'a', type: 'int' }]
  }
};

const createCodingSchema = createCodingSchemaBase
  .refine(data => {
    if (data.executionMode === 'FUNCTION' && (!data.functionContract || !data.functionContract.functionName)) {
      return false;
    }
    return true;
  }, {
    message: 'Function contract is required when execution mode is FUNCTION',
    path: ['functionContract']
  })
  .refine(data => {
    if (data.executionMode === 'FULL_PROGRAM' && data.functionContract) {
      return false;
    }
    return true;
  }, {
    message: 'Function contract must not be defined for FULL_PROGRAM',
    path: ['functionContract']
  });

console.log('--- SIMULATING BROWSER REACT-HOOK-FORM STATE ---');
const result = createCodingSchema.safeParse(formData);
console.log('Zod Validation Error:', JSON.stringify(result.error?.issues, null, 2));

console.log('--- NOW TESTING PREPROCESS APPROACH ---');
const preprocessedSchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object' && val.executionMode === 'FULL_PROGRAM') {
    return { ...val, functionContract: null };
  }
  return val;
}, createCodingSchema);

const result2 = preprocessedSchema.safeParse(formData);
console.log('Preprocess Validation Error:', JSON.stringify(result2.error?.issues, null, 2));

