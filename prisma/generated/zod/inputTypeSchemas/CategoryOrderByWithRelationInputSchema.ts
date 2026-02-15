import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { CompetitionOrderByWithRelationInputSchema } from './CompetitionOrderByWithRelationInputSchema';
import { RecordOrderByRelationAggregateInputSchema } from './RecordOrderByRelationAggregateInputSchema';
import { PuzzleOrderByRelationAggregateInputSchema } from './PuzzleOrderByRelationAggregateInputSchema';

export const CategoryOrderByWithRelationInputSchema: z.ZodType<Prisma.CategoryOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  maxPartySize: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  startTime: z.lazy(() => SortOrderSchema).optional(),
  endTime: z.lazy(() => SortOrderSchema).optional(),
  realStartTime: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  realEndTime: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  maxParties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  competitionId: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => CompetitionOrderByWithRelationInputSchema).optional(),
  records: z.lazy(() => RecordOrderByRelationAggregateInputSchema).optional(),
  puzzles: z.lazy(() => PuzzleOrderByRelationAggregateInputSchema).optional()
}).strict();

export default CategoryOrderByWithRelationInputSchema;
