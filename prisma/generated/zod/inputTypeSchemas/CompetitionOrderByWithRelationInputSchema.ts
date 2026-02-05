import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { LeagueOrderByWithRelationInputSchema } from './LeagueOrderByWithRelationInputSchema';
import { CategoryOrderByRelationAggregateInputSchema } from './CategoryOrderByRelationAggregateInputSchema';
import { RoleAssignmentOrderByRelationAggregateInputSchema } from './RoleAssignmentOrderByRelationAggregateInputSchema';
import { RequestOrderByRelationAggregateInputSchema } from './RequestOrderByRelationAggregateInputSchema';
import { UserOrderByWithRelationInputSchema } from './UserOrderByWithRelationInputSchema';

export const CompetitionOrderByWithRelationInputSchema: z.ZodType<Prisma.CompetitionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  location: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  country: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  image_cld_id: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  leagueId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  creatorId: z.lazy(() => SortOrderSchema).optional(),
  registrationOpen: z.lazy(() => SortOrderSchema).optional(),
  league: z.lazy(() => LeagueOrderByWithRelationInputSchema).optional(),
  categories: z.lazy(() => CategoryOrderByRelationAggregateInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentOrderByRelationAggregateInputSchema).optional(),
  requests: z.lazy(() => RequestOrderByRelationAggregateInputSchema).optional(),
  creator: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export default CompetitionOrderByWithRelationInputSchema;
