import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { CategoryCreateNestedOneWithoutRecordsInputSchema } from './CategoryCreateNestedOneWithoutRecordsInputSchema';
import { UserCreateNestedManyWithoutRecordsInputSchema } from './UserCreateNestedManyWithoutRecordsInputSchema';
import { UserCreateNestedOneWithoutCreatedRecordsInputSchema } from './UserCreateNestedOneWithoutCreatedRecordsInputSchema';

export const RecordCreateInputSchema: z.ZodType<Prisma.RecordCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  status: z.lazy(() => InscriptionStatusSchema).optional(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutRecordsInputSchema),
  users: z.lazy(() => UserCreateNestedManyWithoutRecordsInputSchema).optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutCreatedRecordsInputSchema)
}).strict();

export default RecordCreateInputSchema;
