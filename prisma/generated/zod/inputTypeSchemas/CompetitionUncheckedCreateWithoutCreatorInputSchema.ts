import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { CategoryUncheckedCreateNestedManyWithoutCompetitionInputSchema } from './CategoryUncheckedCreateNestedManyWithoutCompetitionInputSchema';
import { RoleAssignmentUncheckedCreateNestedManyWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedCreateNestedManyWithoutCompetitionInputSchema';
import { RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema } from './RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema';

export const CompetitionUncheckedCreateWithoutCreatorInputSchema: z.ZodType<Prisma.CompetitionUncheckedCreateWithoutCreatorInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.lazy(() => CompetitionStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  leagueId: z.string().optional().nullable(),
  registrationOpen: z.boolean().optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutCompetitionInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUncheckedCreateNestedManyWithoutCompetitionInputSchema).optional(),
  requests: z.lazy(() => RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema).optional()
}).strict();

export default CompetitionUncheckedCreateWithoutCreatorInputSchema;
