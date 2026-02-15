import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleIncludeSchema } from '../inputTypeSchemas/PuzzleIncludeSchema'
import { PuzzleUpdateInputSchema } from '../inputTypeSchemas/PuzzleUpdateInputSchema'
import { PuzzleUncheckedUpdateInputSchema } from '../inputTypeSchemas/PuzzleUncheckedUpdateInputSchema'
import { PuzzleWhereUniqueInputSchema } from '../inputTypeSchemas/PuzzleWhereUniqueInputSchema'
import { CategoryFindManyArgsSchema } from "../outputTypeSchemas/CategoryFindManyArgsSchema"
import { PuzzleCountOutputTypeArgsSchema } from "../outputTypeSchemas/PuzzleCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const PuzzleSelectSchema: z.ZodType<Prisma.PuzzleSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  pieces: z.boolean().optional(),
  image_cld_id: z.boolean().optional(),
  brand: z.boolean().optional(),
  serialNumber: z.boolean().optional(),
  barcode: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PuzzleCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const PuzzleUpdateArgsSchema: z.ZodType<Prisma.PuzzleUpdateArgs> = z.object({
  select: PuzzleSelectSchema.optional(),
  include: z.lazy(() => PuzzleIncludeSchema).optional(),
  data: z.union([ PuzzleUpdateInputSchema,PuzzleUncheckedUpdateInputSchema ]),
  where: PuzzleWhereUniqueInputSchema,
}).strict() ;

export default PuzzleUpdateArgsSchema;
