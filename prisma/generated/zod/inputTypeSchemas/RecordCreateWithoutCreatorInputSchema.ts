import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateNestedOneWithoutRecordsInputSchema } from './CategoryCreateNestedOneWithoutRecordsInputSchema';
import { UserCreateNestedManyWithoutRecordsInputSchema } from './UserCreateNestedManyWithoutRecordsInputSchema';

export const RecordCreateWithoutCreatorInputSchema: z.ZodType<Prisma.RecordCreateWithoutCreatorInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutRecordsInputSchema),
  users: z.lazy(() => UserCreateNestedManyWithoutRecordsInputSchema).optional()
}).strict();

export default RecordCreateWithoutCreatorInputSchema;
