import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentUpdateWithoutCompetitionInputSchema } from './RoleAssignmentUpdateWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedUpdateWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedUpdateWithoutCompetitionInputSchema';
import { RoleAssignmentCreateWithoutCompetitionInputSchema } from './RoleAssignmentCreateWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema';

export const RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RoleAssignmentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RoleAssignmentUpdateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUncheckedUpdateWithoutCompetitionInputSchema) ]),
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema) ]),
}).strict();

export default RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInputSchema;
