import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { CompetitionOrderByRelationAggregateInputSchema } from './CompetitionOrderByRelationAggregateInputSchema';
import { LeaguePointsOrderByRelationAggregateInputSchema } from './LeaguePointsOrderByRelationAggregateInputSchema';

export const LeagueOrderByWithRelationInputSchema: z.ZodType<Prisma.LeagueOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  competitions: z.lazy(() => CompetitionOrderByRelationAggregateInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsOrderByRelationAggregateInputSchema).optional()
}).strict();

export default LeagueOrderByWithRelationInputSchema;
