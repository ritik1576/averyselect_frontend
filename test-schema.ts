import { z } from 'zod';

const functionContractSchema = z.object({
  functionName: z.string().min(1, 'Function name is required'),
  returnType: z.string(),
  parameters: z.array(z.object({ name: z.string(), type: z.string() })).default([])
});

const createCodingSchemaBase = z.object({
  executionMode: z.enum(['FULL_PROGRAM', 'FUNCTION']).default('FULL_PROGRAM'),
  functionContract: functionContractSchema.nullable().optional(),
});

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

console.log("TEST 1: FULL_PROGRAM with functionContract: null");
const res1 = createCodingSchema.safeParse({ executionMode: 'FULL_PROGRAM', functionContract: null });
console.log(res1.success ? "PASS" : res1.error.issues);

console.log("TEST 2: FULL_PROGRAM with functionContract: {}");
const res2 = createCodingSchema.safeParse({ executionMode: 'FULL_PROGRAM', functionContract: {} });
console.log(res2.success ? "PASS" : res2.error.issues);

console.log("TEST 3: FULL_PROGRAM with functionContract: { functionName: '' }");
const res3 = createCodingSchema.safeParse({ executionMode: 'FULL_PROGRAM', functionContract: { functionName: '' } });
console.log(res3.success ? "PASS" : res3.error.issues);
