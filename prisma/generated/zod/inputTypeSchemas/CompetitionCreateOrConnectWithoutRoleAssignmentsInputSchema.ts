import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionCreateWithoutRoleAssignmentsInputSchema } from './CompetitionCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema';

export const CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.CompetitionCreateOrConnectWithoutRoleAssignmentsInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema) ]),
}).strict();

export default CompetitionCreateOrConnectWithoutRoleAssignmentsInputSchema;
