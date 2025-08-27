import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionUpdateWithoutRoleAssignmentsInputSchema } from './CompetitionUpdateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema';
import { CompetitionCreateWithoutRoleAssignmentsInputSchema } from './CompetitionCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const CompetitionUpsertWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.CompetitionUpsertWithoutRoleAssignmentsInput> = z.object({
  update: z.union([ z.lazy(() => CompetitionUpdateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema) ]),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRoleAssignmentsInputSchema) ]),
  where: z.lazy(() => CompetitionWhereInputSchema).optional()
}).strict();

export default CompetitionUpsertWithoutRoleAssignmentsInputSchema;
