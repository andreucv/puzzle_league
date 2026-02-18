import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';
import { DateTimeNullableWithAggregatesFilterSchema } from './DateTimeNullableWithAggregatesFilterSchema';
import { IntNullableWithAggregatesFilterSchema } from './IntNullableWithAggregatesFilterSchema';
import { EnumInscriptionStatusWithAggregatesFilterSchema } from './EnumInscriptionStatusWithAggregatesFilterSchema';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { IntWithAggregatesFilterSchema } from './IntWithAggregatesFilterSchema';

export const RecordScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RecordScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => RecordScalarWhereWithAggregatesInputSchema),z.lazy(() => RecordScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecordScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecordScalarWhereWithAggregatesInputSchema),z.lazy(() => RecordScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  finishTime: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  tableNumber: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumInscriptionStatusWithAggregatesFilterSchema),z.lazy(() => InscriptionStatusSchema) ]).optional(),
  categoryId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  creatorId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export default RecordScalarWhereWithAggregatesInputSchema;
