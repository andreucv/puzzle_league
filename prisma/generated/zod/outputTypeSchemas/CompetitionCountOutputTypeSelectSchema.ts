import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const CompetitionCountOutputTypeSelectSchema: z.ZodType<Prisma.CompetitionCountOutputTypeSelect> = z.object({
  categories: z.boolean().optional(),
  roleAssignments: z.boolean().optional(),
  requests: z.boolean().optional(),
}).strict();

export default CompetitionCountOutputTypeSelectSchema;
