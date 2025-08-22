import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueArgsSchema } from "../outputTypeSchemas/LeagueArgsSchema"
import { CategoryFindManyArgsSchema } from "../outputTypeSchemas/CategoryFindManyArgsSchema"
import { RoleAssignmentFindManyArgsSchema } from "../outputTypeSchemas/RoleAssignmentFindManyArgsSchema"
import { RequestFindManyArgsSchema } from "../outputTypeSchemas/RequestFindManyArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CompetitionCountOutputTypeArgsSchema } from "../outputTypeSchemas/CompetitionCountOutputTypeArgsSchema"

export const CompetitionIncludeSchema: z.ZodType<Prisma.CompetitionInclude> = z.object({
  league: z.union([z.boolean(),z.lazy(() => LeagueArgsSchema)]).optional(),
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  roleAssignments: z.union([z.boolean(),z.lazy(() => RoleAssignmentFindManyArgsSchema)]).optional(),
  requests: z.union([z.boolean(),z.lazy(() => RequestFindManyArgsSchema)]).optional(),
  creator: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CompetitionCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default CompetitionIncludeSchema;
