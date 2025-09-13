import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { RoleAssignmentUncheckedCreateNestedManyWithoutCompetitionInputSchema } from './RoleAssignmentUncheckedCreateNestedManyWithoutCompetitionInputSchema';
import { RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema } from './RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema';

export const CompetitionUncheckedCreateWithoutCategoriesInputSchema: z.ZodType<Prisma.CompetitionUncheckedCreateWithoutCategoriesInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  image_cld_id: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.lazy(() => CompetitionStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  leagueId: z.string().optional().nullable(),
  creatorId: z.string(),
  registrationOpen: z.boolean().optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUncheckedCreateNestedManyWithoutCompetitionInputSchema).optional(),
  requests: z.lazy(() => RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema).optional()
}).strict();

export default CompetitionUncheckedCreateWithoutCategoriesInputSchema;
