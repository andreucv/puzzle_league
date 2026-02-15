import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { PuzzleIncludeSchema } from '../inputTypeSchemas/PuzzleIncludeSchema'
import { PuzzleWhereInputSchema } from '../inputTypeSchemas/PuzzleWhereInputSchema'
import { PuzzleOrderByWithRelationInputSchema } from '../inputTypeSchemas/PuzzleOrderByWithRelationInputSchema'
import { PuzzleWhereUniqueInputSchema } from '../inputTypeSchemas/PuzzleWhereUniqueInputSchema'
import { PuzzleScalarFieldEnumSchema } from '../inputTypeSchemas/PuzzleScalarFieldEnumSchema'
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

export const PuzzleFindFirstArgsSchema: z.ZodType<Prisma.PuzzleFindFirstArgs> = z.object({
  select: PuzzleSelectSchema.optional(),
  include: z.lazy(() => PuzzleIncludeSchema).optional(),
  where: PuzzleWhereInputSchema.optional(),
  orderBy: z.union([ PuzzleOrderByWithRelationInputSchema.array(),PuzzleOrderByWithRelationInputSchema ]).optional(),
  cursor: PuzzleWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PuzzleScalarFieldEnumSchema,PuzzleScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export default PuzzleFindFirstArgsSchema;
