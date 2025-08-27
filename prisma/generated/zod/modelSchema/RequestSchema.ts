import { z } from 'zod';
import { RoleSchema } from '../inputTypeSchemas/RoleSchema'
import { RequestStatusSchema } from '../inputTypeSchemas/RequestStatusSchema'

/////////////////////////////////////////
// REQUEST SCHEMA
/////////////////////////////////////////

export const RequestSchema = z.object({
  role: RoleSchema,
  status: RequestStatusSchema,
  id: z.string().cuid(),
  userId: z.string(),
  competitionId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  reason: z.string().nullable(),
  additionalInfo: z.string().nullable(),
})

export type Request = z.infer<typeof RequestSchema>

export default RequestSchema;
