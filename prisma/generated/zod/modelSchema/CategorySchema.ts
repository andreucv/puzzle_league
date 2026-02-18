import { z } from 'zod';
import { CategoryTypeSchema } from '../inputTypeSchemas/CategoryTypeSchema'

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  type: CategoryTypeSchema,
  id: z.number().int(),
  description: z.string(),
  subname: z.string().nullable(),
  maxPartySize: z.number().int().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  realStartTime: z.coerce.date().nullable(),
  realEndTime: z.coerce.date().nullable(),
  status: z.string(),
  maxParties: z.number().int().nullable(),
  competitionId: z.number().int(),
})

export type Category = z.infer<typeof CategorySchema>

export default CategorySchema;
