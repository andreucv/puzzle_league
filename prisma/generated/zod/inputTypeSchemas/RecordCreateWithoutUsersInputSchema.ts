import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { CategoryCreateNestedOneWithoutRecordsInputSchema } from './CategoryCreateNestedOneWithoutRecordsInputSchema';
import { UserCreateNestedOneWithoutCreatedRecordsInputSchema } from './UserCreateNestedOneWithoutCreatedRecordsInputSchema';

export const RecordCreateWithoutUsersInputSchema: z.ZodType<Prisma.RecordCreateWithoutUsersInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  status: z.lazy(() => InscriptionStatusSchema).optional(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutRecordsInputSchema),
  creator: z.lazy(() => UserCreateNestedOneWithoutCreatedRecordsInputSchema)
}).strict();

export default RecordCreateWithoutUsersInputSchema;
