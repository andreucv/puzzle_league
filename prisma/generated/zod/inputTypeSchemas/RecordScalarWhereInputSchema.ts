import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';

export const RecordScalarWhereInputSchema: z.ZodType<Prisma.RecordScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RecordScalarWhereInputSchema),z.lazy(() => RecordScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecordScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecordScalarWhereInputSchema),z.lazy(() => RecordScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  finishTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  tableNumber: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  categoryId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  creatorId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export default RecordScalarWhereInputSchema;
