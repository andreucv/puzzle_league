import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { PuzzleWhereInputSchema } from './PuzzleWhereInputSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { CategoryListRelationFilterSchema } from './CategoryListRelationFilterSchema';

export const PuzzleWhereUniqueInputSchema: z.ZodType<Prisma.PuzzleWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    barcode: z.string()
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    barcode: z.string(),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  barcode: z.string().optional(),
  AND: z.union([ z.lazy(() => PuzzleWhereInputSchema),z.lazy(() => PuzzleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PuzzleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PuzzleWhereInputSchema),z.lazy(() => PuzzleWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  pieces: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  image_cld_id: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  serialNumber: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  categories: z.lazy(() => CategoryListRelationFilterSchema).optional()
}).strict());

export default PuzzleWhereUniqueInputSchema;
