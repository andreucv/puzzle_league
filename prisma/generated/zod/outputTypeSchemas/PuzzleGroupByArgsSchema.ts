import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleWhereInputSchema } from '../inputTypeSchemas/PuzzleWhereInputSchema'
import { PuzzleOrderByWithAggregationInputSchema } from '../inputTypeSchemas/PuzzleOrderByWithAggregationInputSchema'
import { PuzzleScalarFieldEnumSchema } from '../inputTypeSchemas/PuzzleScalarFieldEnumSchema'
import { PuzzleScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/PuzzleScalarWhereWithAggregatesInputSchema'

export const PuzzleGroupByArgsSchema: z.ZodType<Prisma.PuzzleGroupByArgs> = z.object({
  where: PuzzleWhereInputSchema.optional(),
  orderBy: z.union([ PuzzleOrderByWithAggregationInputSchema.array(),PuzzleOrderByWithAggregationInputSchema ]).optional(),
  by: PuzzleScalarFieldEnumSchema.array(),
  having: PuzzleScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default PuzzleGroupByArgsSchema;
