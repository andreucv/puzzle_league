import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestIncludeSchema } from '../inputTypeSchemas/RequestIncludeSchema'
import { RequestWhereInputSchema } from '../inputTypeSchemas/RequestWhereInputSchema'
import { RequestOrderByWithRelationInputSchema } from '../inputTypeSchemas/RequestOrderByWithRelationInputSchema'
import { RequestWhereUniqueInputSchema } from '../inputTypeSchemas/RequestWhereUniqueInputSchema'
import { RequestScalarFieldEnumSchema } from '../inputTypeSchemas/RequestScalarFieldEnumSchema'
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CompetitionArgsSchema } from "../outputTypeSchemas/CompetitionArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const RequestSelectSchema: z.ZodType<Prisma.RequestSelect> = z.object({
  id: z.boolean().optional(),
  role: z.boolean().optional(),
  status: z.boolean().optional(),
  userId: z.boolean().optional(),
  competitionId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  reason: z.boolean().optional(),
  additionalInfo: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  competition: z.union([z.boolean(),z.lazy(() => CompetitionArgsSchema)]).optional(),
}).strict()

export const RequestFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RequestFindFirstOrThrowArgs> = z.object({
  select: RequestSelectSchema.optional(),
  include: z.lazy(() => RequestIncludeSchema).optional(),
  where: RequestWhereInputSchema.optional(),
  orderBy: z.union([ RequestOrderByWithRelationInputSchema.array(),RequestOrderByWithRelationInputSchema ]).optional(),
  cursor: RequestWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RequestScalarFieldEnumSchema,RequestScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export default RequestFindFirstOrThrowArgsSchema;
