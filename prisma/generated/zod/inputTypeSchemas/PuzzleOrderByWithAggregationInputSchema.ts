import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { PuzzleCountOrderByAggregateInputSchema } from './PuzzleCountOrderByAggregateInputSchema';
import { PuzzleAvgOrderByAggregateInputSchema } from './PuzzleAvgOrderByAggregateInputSchema';
import { PuzzleMaxOrderByAggregateInputSchema } from './PuzzleMaxOrderByAggregateInputSchema';
import { PuzzleMinOrderByAggregateInputSchema } from './PuzzleMinOrderByAggregateInputSchema';
import { PuzzleSumOrderByAggregateInputSchema } from './PuzzleSumOrderByAggregateInputSchema';

export const PuzzleOrderByWithAggregationInputSchema: z.ZodType<Prisma.PuzzleOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  pieces: z.lazy(() => SortOrderSchema).optional(),
  image_cld_id: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  serialNumber: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  barcode: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PuzzleCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PuzzleAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PuzzleMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PuzzleMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PuzzleSumOrderByAggregateInputSchema).optional()
}).strict();

export default PuzzleOrderByWithAggregationInputSchema;
