import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumRoleFilterSchema } from './EnumRoleFilterSchema';
import { RoleSchema } from './RoleSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const RoleAssignmentScalarWhereInputSchema: z.ZodType<Prisma.RoleAssignmentScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RoleAssignmentScalarWhereInputSchema),z.lazy(() => RoleAssignmentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RoleAssignmentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RoleAssignmentScalarWhereInputSchema),z.lazy(() => RoleAssignmentScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  competitionId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export default RoleAssignmentScalarWhereInputSchema;
