import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { IntWithAggregatesFilterSchema } from './IntWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const PuzzleScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PuzzleScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PuzzleScalarWhereWithAggregatesInputSchema),z.lazy(() => PuzzleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PuzzleScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PuzzleScalarWhereWithAggregatesInputSchema),z.lazy(() => PuzzleScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  pieces: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  image_cld_id: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  serialNumber: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  barcode: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export default PuzzleScalarWhereWithAggregatesInputSchema;
