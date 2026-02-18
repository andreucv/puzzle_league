import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordIncludeSchema } from '../inputTypeSchemas/RecordIncludeSchema'
import { RecordWhereUniqueInputSchema } from '../inputTypeSchemas/RecordWhereUniqueInputSchema'
import { RecordCreateInputSchema } from '../inputTypeSchemas/RecordCreateInputSchema'
import { RecordUncheckedCreateInputSchema } from '../inputTypeSchemas/RecordUncheckedCreateInputSchema'
import { RecordUpdateInputSchema } from '../inputTypeSchemas/RecordUpdateInputSchema'
import { RecordUncheckedUpdateInputSchema } from '../inputTypeSchemas/RecordUncheckedUpdateInputSchema'
import { CategoryArgsSchema } from "../outputTypeSchemas/CategoryArgsSchema"
import { UserFindManyArgsSchema } from "../outputTypeSchemas/UserFindManyArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { RecordCountOutputTypeArgsSchema } from "../outputTypeSchemas/RecordCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const RecordSelectSchema: z.ZodType<Prisma.RecordSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  finishTime: z.boolean().optional(),
  tableNumber: z.boolean().optional(),
  status: z.boolean().optional(),
  categoryId: z.boolean().optional(),
  creatorId: z.boolean().optional(),
  category: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  users: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  creator: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RecordCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const RecordUpsertArgsSchema: z.ZodType<Prisma.RecordUpsertArgs> = z.object({
  select: RecordSelectSchema.optional(),
  include: z.lazy(() => RecordIncludeSchema).optional(),
  where: RecordWhereUniqueInputSchema,
  create: z.union([ RecordCreateInputSchema,RecordUncheckedCreateInputSchema ]),
  update: z.union([ RecordUpdateInputSchema,RecordUncheckedUpdateInputSchema ]),
}).strict() ;

export default RecordUpsertArgsSchema;
