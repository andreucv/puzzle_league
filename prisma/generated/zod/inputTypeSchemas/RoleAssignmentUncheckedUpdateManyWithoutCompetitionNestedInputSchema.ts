import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentCreateWithoutCompetitionInputSchema } from './RoleAssignmentCreateWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema';
import { RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema } from './RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema';
import { RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInputSchema } from './RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInputSchema';
import { RoleAssignmentCreateManyCompetitionInputEnvelopeSchema } from './RoleAssignmentCreateManyCompetitionInputEnvelopeSchema';
import { RoleAssignmentWhereUniqueInputSchema } from './RoleAssignmentWhereUniqueInputSchema';
import { RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInputSchema } from './RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInputSchema';
import { RoleAssignmentUpdateManyWithWhereWithoutCompetitionInputSchema } from './RoleAssignmentUpdateManyWithWhereWithoutCompetitionInputSchema';
import { RoleAssignmentScalarWhereInputSchema } from './RoleAssignmentScalarWhereInputSchema';

export const RoleAssignmentUncheckedUpdateManyWithoutCompetitionNestedInputSchema: z.ZodType<Prisma.RoleAssignmentUncheckedUpdateManyWithoutCompetitionNestedInput> = z.object({
  create: z.union([ z.lazy(() => RoleAssignmentCreateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentCreateWithoutCompetitionInputSchema).array(),z.lazy(() => RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentCreateOrConnectWithoutCompetitionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUpsertWithWhereUniqueWithoutCompetitionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RoleAssignmentCreateManyCompetitionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RoleAssignmentWhereUniqueInputSchema),z.lazy(() => RoleAssignmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUpdateWithWhereUniqueWithoutCompetitionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RoleAssignmentUpdateManyWithWhereWithoutCompetitionInputSchema),z.lazy(() => RoleAssignmentUpdateManyWithWhereWithoutCompetitionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RoleAssignmentScalarWhereInputSchema),z.lazy(() => RoleAssignmentScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RoleAssignmentUncheckedUpdateManyWithoutCompetitionNestedInputSchema;
