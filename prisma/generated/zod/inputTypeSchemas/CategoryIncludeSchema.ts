import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionArgsSchema } from "../outputTypeSchemas/CompetitionArgsSchema"
import { RecordFindManyArgsSchema } from "../outputTypeSchemas/RecordFindManyArgsSchema"
import { PuzzleFindManyArgsSchema } from "../outputTypeSchemas/PuzzleFindManyArgsSchema"
import { CategoryCountOutputTypeArgsSchema } from "../outputTypeSchemas/CategoryCountOutputTypeArgsSchema"

export const CategoryIncludeSchema: z.ZodType<Prisma.CategoryInclude> = z.object({
  competition: z.union([z.boolean(),z.lazy(() => CompetitionArgsSchema)]).optional(),
  records: z.union([z.boolean(),z.lazy(() => RecordFindManyArgsSchema)]).optional(),
  puzzles: z.union([z.boolean(),z.lazy(() => PuzzleFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CategoryCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default CategoryIncludeSchema;
