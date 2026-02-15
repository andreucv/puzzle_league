import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleCreateManyInputSchema } from '../inputTypeSchemas/PuzzleCreateManyInputSchema'

export const PuzzleCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PuzzleCreateManyAndReturnArgs> = z.object({
  data: z.union([ PuzzleCreateManyInputSchema,PuzzleCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default PuzzleCreateManyAndReturnArgsSchema;
