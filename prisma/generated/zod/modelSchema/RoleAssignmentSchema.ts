import { z } from 'zod';
import { RoleSchema } from '../inputTypeSchemas/RoleSchema'

/////////////////////////////////////////
// ROLE ASSIGNMENT SCHEMA
/////////////////////////////////////////

export const RoleAssignmentSchema = z.object({
  role: RoleSchema,
  id: z.string().cuid(),
  userId: z.string(),
  competitionId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>

export default RoleAssignmentSchema;
