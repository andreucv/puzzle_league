import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleWhereInputSchema } from '../inputTypeSchemas/PuzzleWhereInputSchema'

export const PuzzleDeleteManyArgsSchema: z.ZodType<Prisma.PuzzleDeleteManyArgs> = z.object({
  where: PuzzleWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default PuzzleDeleteManyArgsSchema;
