import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleWhereInputSchema } from '../inputTypeSchemas/PuzzleWhereInputSchema'
import { PuzzleOrderByWithRelationInputSchema } from '../inputTypeSchemas/PuzzleOrderByWithRelationInputSchema'
import { PuzzleWhereUniqueInputSchema } from '../inputTypeSchemas/PuzzleWhereUniqueInputSchema'

export const PuzzleAggregateArgsSchema: z.ZodType<Prisma.PuzzleAggregateArgs> = z.object({
  where: PuzzleWhereInputSchema.optional(),
  orderBy: z.union([ PuzzleOrderByWithRelationInputSchema.array(),PuzzleOrderByWithRelationInputSchema ]).optional(),
  cursor: PuzzleWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default PuzzleAggregateArgsSchema;
