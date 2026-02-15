import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { CategoryOrderByRelationAggregateInputSchema } from './CategoryOrderByRelationAggregateInputSchema';

export const PuzzleOrderByWithRelationInputSchema: z.ZodType<Prisma.PuzzleOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  pieces: z.lazy(() => SortOrderSchema).optional(),
  image_cld_id: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  serialNumber: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  barcode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  categories: z.lazy(() => CategoryOrderByRelationAggregateInputSchema).optional()
}).strict();

export default PuzzleOrderByWithRelationInputSchema;
