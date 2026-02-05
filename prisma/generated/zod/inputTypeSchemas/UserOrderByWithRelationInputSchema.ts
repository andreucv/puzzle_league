import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { SessionOrderByRelationAggregateInputSchema } from './SessionOrderByRelationAggregateInputSchema';
import { AccountOrderByRelationAggregateInputSchema } from './AccountOrderByRelationAggregateInputSchema';
import { RecordOrderByRelationAggregateInputSchema } from './RecordOrderByRelationAggregateInputSchema';
import { RoleAssignmentOrderByRelationAggregateInputSchema } from './RoleAssignmentOrderByRelationAggregateInputSchema';
import { RequestOrderByRelationAggregateInputSchema } from './RequestOrderByRelationAggregateInputSchema';
import { LeaguePointsOrderByRelationAggregateInputSchema } from './LeaguePointsOrderByRelationAggregateInputSchema';
import { CompetitionOrderByRelationAggregateInputSchema } from './CompetitionOrderByRelationAggregateInputSchema';

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  country: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  postalCode: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  sessions: z.lazy(() => SessionOrderByRelationAggregateInputSchema).optional(),
  accounts: z.lazy(() => AccountOrderByRelationAggregateInputSchema).optional(),
  records: z.lazy(() => RecordOrderByRelationAggregateInputSchema).optional(),
  createdRecords: z.lazy(() => RecordOrderByRelationAggregateInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentOrderByRelationAggregateInputSchema).optional(),
  requests: z.lazy(() => RequestOrderByRelationAggregateInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsOrderByRelationAggregateInputSchema).optional(),
  competitions: z.lazy(() => CompetitionOrderByRelationAggregateInputSchema).optional()
}).strict();

export default UserOrderByWithRelationInputSchema;
