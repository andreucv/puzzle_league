import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentUpdateWithoutCompetitionInputSchema } from './RoleAssignmentUpdateWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedUpdateWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedUpdateWithoutCompetitionInputSchema';

export const RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RoleAssignmentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RoleAssignmentUpdateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUncheckedUpdateWithoutCompetitionInputSchema) ]),
}).strict();

export default RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInputSchema;
