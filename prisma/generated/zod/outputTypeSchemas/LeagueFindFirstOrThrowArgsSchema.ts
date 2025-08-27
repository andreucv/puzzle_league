import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueIncludeSchema } from '../inputTypeSchemas/LeagueIncludeSchema'
import { LeagueWhereInputSchema } from '../inputTypeSchemas/LeagueWhereInputSchema'
import { LeagueOrderByWithRelationInputSchema } from '../inputTypeSchemas/LeagueOrderByWithRelationInputSchema'
import { LeagueWhereUniqueInputSchema } from '../inputTypeSchemas/LeagueWhereUniqueInputSchema'
import { LeagueScalarFieldEnumSchema } from '../inputTypeSchemas/LeagueScalarFieldEnumSchema'
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

export const LeagueFindFirstOrThrowArgsSchema: z.ZodType<Prisma.LeagueFindFirstOrThrowArgs> = z.object({
  select: LeagueSelectSchema.optional(),
  include: z.lazy(() => LeagueIncludeSchema).optional(),
  where: LeagueWhereInputSchema.optional(),
  orderBy: z.union([ LeagueOrderByWithRelationInputSchema.array(),LeagueOrderByWithRelationInputSchema ]).optional(),
  cursor: LeagueWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LeagueScalarFieldEnumSchema,LeagueScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export default LeagueFindFirstOrThrowArgsSchema;
