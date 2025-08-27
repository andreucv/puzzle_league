import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUncheckedCreateNestedManyWithoutRecordsInputSchema } from './UserUncheckedCreateNestedManyWithoutRecordsInputSchema';

export const RecordUncheckedCreateInputSchema: z.ZodType<Prisma.RecordUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  categoryId: z.number().int(),
  creatorId: z.string(),
  users: z.lazy(() => UserUncheckedCreateNestedManyWithoutRecordsInputSchema).optional()
}).strict();

export default RecordUncheckedCreateInputSchema;
