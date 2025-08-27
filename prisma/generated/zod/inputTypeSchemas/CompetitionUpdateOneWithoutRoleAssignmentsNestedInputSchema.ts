import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutRoleAssignmentsInputSchema } from './CompetitionCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema } from './CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema';
import { CompetitionUpsertWithoutRoleAssignmentsInputSchema } from './CompetitionUpsertWithoutRoleAssignmentsInputSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema } from './CompetitionUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema';
import { CompetitionUpdateWithoutRoleAssignmentsInputSchema } from './CompetitionUpdateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema';

export const CompetitionUpdateOneWithoutRoleAssignmentsNestedInputSchema: z.ZodType<Prisma.CompetitionUpdateOneWithoutRoleAssignmentsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema).optional(),
  upsert: z.lazy(() => CompetitionUpsertWithoutRoleAssignmentsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => CompetitionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => CompetitionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => CompetitionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CompetitionUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUpdateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema) ]).optional(),
}).strict();

export default CompetitionUpdateOneWithoutRoleAssignmentsNestedInputSchema;
