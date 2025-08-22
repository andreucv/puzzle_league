import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedManyWithoutRecordsInputSchema } from './UserCreateNestedManyWithoutRecordsInputSchema';
import { UserCreateNestedOneWithoutCreatedRecordsInputSchema } from './UserCreateNestedOneWithoutCreatedRecordsInputSchema';

export const RecordCreateWithoutCategoryInputSchema: z.ZodType<Prisma.RecordCreateWithoutCategoryInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  users: z.lazy(() => UserCreateNestedManyWithoutRecordsInputSchema).optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutCreatedRecordsInputSchema)
}).strict();

export default RecordCreateWithoutCategoryInputSchema;
