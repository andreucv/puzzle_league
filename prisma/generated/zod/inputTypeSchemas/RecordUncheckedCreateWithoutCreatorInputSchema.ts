import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUncheckedCreateNestedManyWithoutRecordsInputSchema } from './UserUncheckedCreateNestedManyWithoutRecordsInputSchema';

export const RecordUncheckedCreateWithoutCreatorInputSchema: z.ZodType<Prisma.RecordUncheckedCreateWithoutCreatorInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  categoryId: z.number().int(),
  users: z.lazy(() => UserUncheckedCreateNestedManyWithoutRecordsInputSchema).optional()
}).strict();

export default RecordUncheckedCreateWithoutCreatorInputSchema;
