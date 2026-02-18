import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { UserUncheckedCreateNestedManyWithoutRecordsInputSchema } from './UserUncheckedCreateNestedManyWithoutRecordsInputSchema';

export const RecordUncheckedCreateWithoutCategoryInputSchema: z.ZodType<Prisma.RecordUncheckedCreateWithoutCategoryInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  status: z.lazy(() => InscriptionStatusSchema).optional(),
  creatorId: z.string(),
  users: z.lazy(() => UserUncheckedCreateNestedManyWithoutRecordsInputSchema).optional()
}).strict();

export default RecordUncheckedCreateWithoutCategoryInputSchema;
