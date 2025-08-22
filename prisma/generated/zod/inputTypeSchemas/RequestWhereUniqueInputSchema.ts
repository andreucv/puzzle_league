import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereInputSchema } from './RequestWhereInputSchema';
import { EnumRoleFilterSchema } from './EnumRoleFilterSchema';
import { RoleSchema } from './RoleSchema';
import { EnumRequestStatusFilterSchema } from './EnumRequestStatusFilterSchema';
import { RequestStatusSchema } from './RequestStatusSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { CompetitionNullableScalarRelationFilterSchema } from './CompetitionNullableScalarRelationFilterSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const RequestWhereUniqueInputSchema: z.ZodType<Prisma.RequestWhereUniqueInput> = z.object({
  id: z.string().cuid()
})
.and(z.object({
  id: z.string().cuid().optional(),
  AND: z.union([ z.lazy(() => RequestWhereInputSchema),z.lazy(() => RequestWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RequestWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RequestWhereInputSchema),z.lazy(() => RequestWhereInputSchema).array() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumRequestStatusFilterSchema),z.lazy(() => RequestStatusSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  competitionId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  reason: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  additionalInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  competition: z.union([ z.lazy(() => CompetitionNullableScalarRelationFilterSchema),z.lazy(() => CompetitionWhereInputSchema) ]).optional().nullable(),
}).strict());

export default RequestWhereUniqueInputSchema;
