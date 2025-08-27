import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { SessionFindManyArgsSchema } from "../outputTypeSchemas/SessionFindManyArgsSchema"
import { AccountFindManyArgsSchema } from "../outputTypeSchemas/AccountFindManyArgsSchema"
import { RecordFindManyArgsSchema } from "../outputTypeSchemas/RecordFindManyArgsSchema"
import { RoleAssignmentFindManyArgsSchema } from "../outputTypeSchemas/RoleAssignmentFindManyArgsSchema"
import { RequestFindManyArgsSchema } from "../outputTypeSchemas/RequestFindManyArgsSchema"
import { LeaguePointsFindManyArgsSchema } from "../outputTypeSchemas/LeaguePointsFindManyArgsSchema"
import { CompetitionFindManyArgsSchema } from "../outputTypeSchemas/CompetitionFindManyArgsSchema"
import { UserCountOutputTypeArgsSchema } from "../outputTypeSchemas/UserCountOutputTypeArgsSchema"

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  records: z.union([z.boolean(),z.lazy(() => RecordFindManyArgsSchema)]).optional(),
  createdRecords: z.union([z.boolean(),z.lazy(() => RecordFindManyArgsSchema)]).optional(),
  roleAssignments: z.union([z.boolean(),z.lazy(() => RoleAssignmentFindManyArgsSchema)]).optional(),
  requests: z.union([z.boolean(),z.lazy(() => RequestFindManyArgsSchema)]).optional(),
  leaguePoints: z.union([z.boolean(),z.lazy(() => LeaguePointsFindManyArgsSchema)]).optional(),
  competitions: z.union([z.boolean(),z.lazy(() => CompetitionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default UserIncludeSchema;
