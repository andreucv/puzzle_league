import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { IntFilterSchema } from './IntFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { EnumCompetitionStatusFilterSchema } from './EnumCompetitionStatusFilterSchema';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { BoolFilterSchema } from './BoolFilterSchema';
import { LeagueNullableScalarRelationFilterSchema } from './LeagueNullableScalarRelationFilterSchema';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { CategoryListRelationFilterSchema } from './CategoryListRelationFilterSchema';
import { RoleAssignmentListRelationFilterSchema } from './RoleAssignmentListRelationFilterSchema';
import { RequestListRelationFilterSchema } from './RequestListRelationFilterSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const CompetitionWhereInputSchema: z.ZodType<Prisma.CompetitionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CompetitionWhereInputSchema),z.lazy(() => CompetitionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CompetitionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CompetitionWhereInputSchema),z.lazy(() => CompetitionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  location: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  country: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  postalCode: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  image_cld_id: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  endDate: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  status: z.union([ z.lazy(() => EnumCompetitionStatusFilterSchema),z.lazy(() => CompetitionStatusSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  leagueId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  creatorId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  registrationOpen: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  league: z.union([ z.lazy(() => LeagueNullableScalarRelationFilterSchema),z.lazy(() => LeagueWhereInputSchema) ]).optional().nullable(),
  categories: z.lazy(() => CategoryListRelationFilterSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentListRelationFilterSchema).optional(),
  requests: z.lazy(() => RequestListRelationFilterSchema).optional(),
  creator: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export default CompetitionWhereInputSchema;
