import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentCreateManyCompetitionInputSchema } from './RoleAssignmentCreateManyCompetitionInputSchema';

export const RoleAssignmentCreateManyCompetitionInputEnvelopeSchema: z.ZodType<Prisma.RoleAssignmentCreateManyCompetitionInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RoleAssignmentCreateManyCompetitionInputSchema),z.lazy(() => RoleAssignmentCreateManyCompetitionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default RoleAssignmentCreateManyCompetitionInputEnvelopeSchema;
