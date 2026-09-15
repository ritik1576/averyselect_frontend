import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  mode: z.string(),
  contract: z.object({ name: z.string() }).nullable().optional()
}).refine(data => {
  if (data.mode === 'FULL' && data.contract) return false;
  return true;
}, { path: ['contract'], message: 'Must be null' });

const mockRHFValues = { mode: 'FULL', contract: { name: 'add' } };

// Instead of passing mockRHFValues directly to Zod, intercept it:
const customResolver = async (values: any, context: any, options: any) => {
  const payload = { ...values };
  if (payload.mode === 'FULL') {
    payload.contract = null;
  }
  return zodResolver(schema)(payload, context, options);
};

customResolver(mockRHFValues, undefined, {}).then(console.log);
