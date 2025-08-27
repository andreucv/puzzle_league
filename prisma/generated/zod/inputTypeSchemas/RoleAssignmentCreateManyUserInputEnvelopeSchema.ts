import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleAssignmentCreateManyUserInputSchema } from './RoleAssignmentCreateManyUserInputSchema';

export const RoleAssignmentCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.RoleAssignmentCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RoleAssignmentCreateManyUserInputSchema),z.lazy(() => RoleAssignmentCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default RoleAssignmentCreateManyUserInputEnvelopeSchema;
