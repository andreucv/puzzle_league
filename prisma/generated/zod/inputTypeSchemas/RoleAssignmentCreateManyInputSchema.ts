import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';

export const RoleAssignmentCreateManyInputSchema: z.ZodType<Prisma.RoleAssignmentCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  userId: z.string(),
  competitionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export default RoleAssignmentCreateManyInputSchema;
