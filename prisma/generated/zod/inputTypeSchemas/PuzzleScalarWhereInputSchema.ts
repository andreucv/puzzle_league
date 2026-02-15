import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const PuzzleScalarWhereInputSchema: z.ZodType<Prisma.PuzzleScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PuzzleScalarWhereInputSchema),z.lazy(() => PuzzleScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PuzzleScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PuzzleScalarWhereInputSchema),z.lazy(() => PuzzleScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  pieces: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  image_cld_id: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  serialNumber: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  barcode: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export default PuzzleScalarWhereInputSchema;
