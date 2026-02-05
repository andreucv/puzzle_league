import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionIncludeSchema } from '../inputTypeSchemas/CompetitionIncludeSchema'
import { CompetitionCreateInputSchema } from '../inputTypeSchemas/CompetitionCreateInputSchema'
import { CompetitionUncheckedCreateInputSchema } from '../inputTypeSchemas/CompetitionUncheckedCreateInputSchema'
import { LeagueArgsSchema } from "../outputTypeSchemas/LeagueArgsSchema"
import { CategoryFindManyArgsSchema } from "../outputTypeSchemas/CategoryFindManyArgsSchema"
import { RoleAssignmentFindManyArgsSchema } from "../outputTypeSchemas/RoleAssignmentFindManyArgsSchema"
import { RequestFindManyArgsSchema } from "../outputTypeSchemas/RequestFindManyArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CompetitionCountOutputTypeArgsSchema } from "../outputTypeSchemas/CompetitionCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const CompetitionSelectSchema: z.ZodType<Prisma.CompetitionSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  location: z.boolean().optional(),
  country: z.boolean().optional(),
  postalCode: z.boolean().optional(),
  image_cld_id: z.boolean().optional(),
  startDate: z.boolean().optional(),
  endDate: z.boolean().optional(),
  status: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  leagueId: z.boolean().optional(),
  creatorId: z.boolean().optional(),
  registrationOpen: z.boolean().optional(),
  league: z.union([z.boolean(),z.lazy(() => LeagueArgsSchema)]).optional(),
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  roleAssignments: z.union([z.boolean(),z.lazy(() => RoleAssignmentFindManyArgsSchema)]).optional(),
  requests: z.union([z.boolean(),z.lazy(() => RequestFindManyArgsSchema)]).optional(),
  creator: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CompetitionCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const CompetitionCreateArgsSchema: z.ZodType<Prisma.CompetitionCreateArgs> = z.object({
  select: CompetitionSelectSchema.optional(),
  include: z.lazy(() => CompetitionIncludeSchema).optional(),
  data: z.union([ CompetitionCreateInputSchema,CompetitionUncheckedCreateInputSchema ]),
}).strict() ;

export default CompetitionCreateArgsSchema;
