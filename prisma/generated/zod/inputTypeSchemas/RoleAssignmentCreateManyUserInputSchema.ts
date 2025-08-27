import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';

export const RoleAssignmentCreateManyUserInputSchema: z.ZodType<Prisma.RoleAssignmentCreateManyUserInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  competitionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export default RoleAssignmentCreateManyUserInputSchema;
