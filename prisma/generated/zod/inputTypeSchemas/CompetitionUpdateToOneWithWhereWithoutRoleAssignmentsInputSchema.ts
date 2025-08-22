import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';
import { CompetitionUpdateWithoutRoleAssignmentsInputSchema } from './CompetitionUpdateWithoutRoleAssignmentsInputSchema';
import { CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema } from './CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema';

export const CompetitionUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.CompetitionUpdateToOneWithWhereWithoutRoleAssignmentsInput> = z.object({
  where: z.lazy(() => CompetitionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CompetitionUpdateWithoutRoleAssignmentsInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutRoleAssignmentsInputSchema) ]),
}).strict();

export default CompetitionUpdateToOneWithWhereWithoutRoleAssignmentsInputSchema;
