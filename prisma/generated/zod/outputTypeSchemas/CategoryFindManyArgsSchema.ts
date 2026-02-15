import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryIncludeSchema } from '../inputTypeSchemas/CategoryIncludeSchema'
import { CategoryWhereInputSchema } from '../inputTypeSchemas/CategoryWhereInputSchema'
import { CategoryOrderByWithRelationInputSchema } from '../inputTypeSchemas/CategoryOrderByWithRelationInputSchema'
import { CategoryWhereUniqueInputSchema } from '../inputTypeSchemas/CategoryWhereUniqueInputSchema'
import { CategoryScalarFieldEnumSchema } from '../inputTypeSchemas/CategoryScalarFieldEnumSchema'
import { CompetitionArgsSchema } from "../outputTypeSchemas/CompetitionArgsSchema"
import { RecordFindManyArgsSchema } from "../outputTypeSchemas/RecordFindManyArgsSchema"
import { PuzzleFindManyArgsSchema } from "../outputTypeSchemas/PuzzleFindManyArgsSchema"
import { CategoryCountOutputTypeArgsSchema } from "../outputTypeSchemas/CategoryCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const CategorySelectSchema: z.ZodType<Prisma.CategorySelect> = z.object({
  id: z.boolean().optional(),
  description: z.boolean().optional(),
  type: z.boolean().optional(),
  maxPartySize: z.boolean().optional(),
  startTime: z.boolean().optional(),
  endTime: z.boolean().optional(),
  realStartTime: z.boolean().optional(),
  realEndTime: z.boolean().optional(),
  status: z.boolean().optional(),
  maxParties: z.boolean().optional(),
  competitionId: z.boolean().optional(),
  competition: z.union([z.boolean(),z.lazy(() => CompetitionArgsSchema)]).optional(),
  records: z.union([z.boolean(),z.lazy(() => RecordFindManyArgsSchema)]).optional(),
  puzzles: z.union([z.boolean(),z.lazy(() => PuzzleFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CategoryCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const CategoryFindManyArgsSchema: z.ZodType<Prisma.CategoryFindManyArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: z.lazy(() => CategoryIncludeSchema).optional(),
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithRelationInputSchema.array(),CategoryOrderByWithRelationInputSchema ]).optional(),
  cursor: CategoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CategoryScalarFieldEnumSchema,CategoryScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export default CategoryFindManyArgsSchema;
