import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';

export const RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema: z.ZodType<Prisma.RoleAssignmentUncheckedCreateWithoutCompetitionInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  userId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export default RoleAssignmentUncheckedCreateWithoutCompetitionInputSchema;
