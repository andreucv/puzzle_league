import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueIncludeSchema } from '../inputTypeSchemas/LeagueIncludeSchema'
import { LeagueWhereUniqueInputSchema } from '../inputTypeSchemas/LeagueWhereUniqueInputSchema'
import { LeagueCreateInputSchema } from '../inputTypeSchemas/LeagueCreateInputSchema'
import { LeagueUncheckedCreateInputSchema } from '../inputTypeSchemas/LeagueUncheckedCreateInputSchema'
import { LeagueUpdateInputSchema } from '../inputTypeSchemas/LeagueUpdateInputSchema'
import { LeagueUncheckedUpdateInputSchema } from '../inputTypeSchemas/LeagueUncheckedUpdateInputSchema'
import { CompetitionFindManyArgsSchema } from "../outputTypeSchemas/CompetitionFindManyArgsSchema"
import { LeaguePointsFindManyArgsSchema } from "../outputTypeSchemas/LeaguePointsFindManyArgsSchema"
import { LeagueCountOutputTypeArgsSchema } from "../outputTypeSchemas/LeagueCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const LeagueSelectSchema: z.ZodType<Prisma.LeagueSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  competitions: z.union([z.boolean(),z.lazy(() => CompetitionFindManyArgsSchema)]).optional(),
  leaguePoints: z.union([z.boolean(),z.lazy(() => LeaguePointsFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => LeagueCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const LeagueUpsertArgsSchema: z.ZodType<Prisma.LeagueUpsertArgs> = z.object({
  select: LeagueSelectSchema.optional(),
  include: z.lazy(() => LeagueIncludeSchema).optional(),
  where: LeagueWhereUniqueInputSchema,
  create: z.union([ LeagueCreateInputSchema,LeagueUncheckedCreateInputSchema ]),
  update: z.union([ LeagueUpdateInputSchema,LeagueUncheckedUpdateInputSchema ]),
}).strict() ;

export default LeagueUpsertArgsSchema;
