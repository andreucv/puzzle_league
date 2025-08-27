import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentCreateWithoutCompetitionInputSchema } from './RoleAssignmentCreateWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema';
import { RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema } from './RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema';
import { RoleAssignmentCreateManyCompetitionInputEnvelopeSchema } from './RoleAssignmentCreateManyCompetitionInputEnvelopeSchema';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';

export const RoleAssignmentCreateNestedManyWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentCreateNestedManyWithoutCompetitionInput> = z.object({
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentCreateWithoutCompetitionInputSchema).array(),z.lazy(() => RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RoleAssignmentCreateManyCompetitionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RoleAssignmentCreateNestedManyWithoutCompetitionInputSchema;
