import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { LeagueCreateNestedOneWithoutCompetitionsInputSchema } from './LeagueCreateNestedOneWithoutCompetitionsInputSchema';
import { CategoryCreateNestedManyWithoutCompetitionInputSchema } from './CategoryCreateNestedManyWithoutCompetitionInputSchema';
import { RoleAssignmentCreateNestedManyWithoutCompetitionInputSchema } from './RoleAssignmentCreateNestedManyWithoutCompetitionInputSchema';
import { RequestCreateNestedManyWithoutCompetitionInputSchema } from './RequestCreateNestedManyWithoutCompetitionInputSchema';
import { UserCreateNestedOneWithoutCompetitionsInputSchema } from './UserCreateNestedOneWithoutCompetitionsInputSchema';

export const CompetitionCreateInputSchema: z.ZodType<Prisma.CompetitionCreateInput> = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  image_cld_id: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.lazy(() => CompetitionStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrationOpen: z.boolean().optional(),
  league: z.lazy(() => LeagueCreateNestedOneWithoutCompetitionsInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutCompetitionInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentCreateNestedManyWithoutCompetitionInputSchema).optional(),
  requests: z.lazy(() => RequestCreateNestedManyWithoutCompetitionInputSchema).optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutCompetitionsInputSchema)
}).strict();

export default CompetitionCreateInputSchema;
