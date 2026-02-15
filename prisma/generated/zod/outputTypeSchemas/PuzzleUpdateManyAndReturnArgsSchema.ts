import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleUpdateManyMutationInputSchema } from '../inputTypeSchemas/PuzzleUpdateManyMutationInputSchema'
import { PuzzleUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/PuzzleUncheckedUpdateManyInputSchema'
import { PuzzleWhereInputSchema } from '../inputTypeSchemas/PuzzleWhereInputSchema'

export const PuzzleUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PuzzleUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PuzzleUpdateManyMutationInputSchema,PuzzleUncheckedUpdateManyInputSchema ]),
  where: PuzzleWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default PuzzleUpdateManyAndReturnArgsSchema;
