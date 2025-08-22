import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutRoleAssignmentsInputSchema } from './CompetitionCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema } from './CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';

export const CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.CompetitionCreateNestedOneWithoutRoleAssignmentsInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema).optional(),
  connect: z.lazy(() => CompetitionWhereUniqueInputSchema).optional()
}).strict();

export default CompetitionCreateNestedOneWithoutRoleAssignmentsInputSchema;
