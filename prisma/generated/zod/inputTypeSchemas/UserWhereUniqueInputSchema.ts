import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { BoolFilterSchema } from './BoolFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { SessionListRelationFilterSchema } from './SessionListRelationFilterSchema';
import { AccountListRelationFilterSchema } from './AccountListRelationFilterSchema';
import { RecordListRelationFilterSchema } from './RecordListRelationFilterSchema';
import { RoleAssignmentListRelationFilterSchema } from './RoleAssignmentListRelationFilterSchema';
import { RequestListRelationFilterSchema } from './RequestListRelationFilterSchema';
import { LeaguePointsListRelationFilterSchema } from './LeaguePointsListRelationFilterSchema';
import { CompetitionListRelationFilterSchema } from './CompetitionListRelationFilterSchema';

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    email: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  country: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  records: z.lazy(() => RecordListRelationFilterSchema).optional(),
  createdRecords: z.lazy(() => RecordListRelationFilterSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentListRelationFilterSchema).optional(),
  requests: z.lazy(() => RequestListRelationFilterSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsListRelationFilterSchema).optional(),
  competitions: z.lazy(() => CompetitionListRelationFilterSchema).optional()
}).strict());

export default UserWhereUniqueInputSchema;
