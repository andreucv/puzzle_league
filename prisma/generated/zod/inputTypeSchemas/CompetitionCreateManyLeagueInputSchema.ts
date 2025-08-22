import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';

export const CompetitionCreateManyLeagueInputSchema: z.ZodType<Prisma.CompetitionCreateManyLeagueInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.lazy(() => CompetitionStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creatorId: z.string(),
  registrationOpen: z.boolean().optional()
}).strict();

export default CompetitionCreateManyLeagueInputSchema;
