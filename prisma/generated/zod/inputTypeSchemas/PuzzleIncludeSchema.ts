import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryFindManyArgsSchema } from "../outputTypeSchemas/CategoryFindManyArgsSchema"
import { PuzzleCountOutputTypeArgsSchema } from "../outputTypeSchemas/PuzzleCountOutputTypeArgsSchema"

export const PuzzleIncludeSchema: z.ZodType<Prisma.PuzzleInclude> = z.object({
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PuzzleCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default PuzzleIncludeSchema;
