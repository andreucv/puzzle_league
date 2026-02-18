import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';

export const RecordCreateManyCreatorInputSchema: z.ZodType<Prisma.RecordCreateManyCreatorInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  status: z.lazy(() => InscriptionStatusSchema).optional(),
  categoryId: z.number().int()
}).strict();

export default RecordCreateManyCreatorInputSchema;
