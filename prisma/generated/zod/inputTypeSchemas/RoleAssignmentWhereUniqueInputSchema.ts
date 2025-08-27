import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentUserIdRoleCompoundUniqueInputSchema } from './RoleAssignmentUserIdRoleCompoundUniqueInputSchema';
import { RoleAssignmentWhereInputSchema } from './RoleAssignmentWhereInputSchema';
import { EnumRoleFilterSchema } from './EnumRoleFilterSchema';
import { RoleSchema } from './RoleSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { CompetitionNullableScalarRelationFilterSchema } from './CompetitionNullableScalarRelationFilterSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const RoleAssignmentWhereUniqueInputSchema: z.ZodType<Prisma.RoleAssignmentWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    userId_role: z.lazy(() => RoleAssignmentUserIdRoleCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    userId_role: z.lazy(() => RoleAssignmentUserIdRoleCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  userId_role: z.lazy(() => RoleAssignmentUserIdRoleCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => RoleAssignmentWhereInputSchema),z.lazy(() => RoleAssignmentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RoleAssignmentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RoleAssignmentWhereInputSchema),z.lazy(() => RoleAssignmentWhereInputSchema).array() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  competitionId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  competition: z.union([ z.lazy(() => CompetitionNullableScalarRelationFilterSchema),z.lazy(() => CompetitionWhereInputSchema) ]).optional().nullable(),
}).strict());

export default RoleAssignmentWhereUniqueInputSchema;
