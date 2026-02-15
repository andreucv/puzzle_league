import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { CategoryListRelationFilterSchema } from './CategoryListRelationFilterSchema';

export const PuzzleWhereInputSchema: z.ZodType<Prisma.PuzzleWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PuzzleWhereInputSchema),z.lazy(() => PuzzleWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PuzzleWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PuzzleWhereInputSchema),z.lazy(() => PuzzleWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  pieces: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  image_cld_id: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  serialNumber: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  barcode: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  categories: z.lazy(() => CategoryListRelationFilterSchema).optional()
}).strict();

export default PuzzleWhereInputSchema;
