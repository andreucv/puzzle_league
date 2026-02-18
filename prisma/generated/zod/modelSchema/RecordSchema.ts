import { z } from 'zod';
import { InscriptionStatusSchema } from '../inputTypeSchemas/InscriptionStatusSchema'

/////////////////////////////////////////
// RECORD SCHEMA
/////////////////////////////////////////

export const RecordSchema = z.object({
  status: InscriptionStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  finishTime: z.coerce.date().nullable(),
  tableNumber: z.number().int().nullable(),
  categoryId: z.number().int(),
  creatorId: z.string(),
})

export type Record = z.infer<typeof RecordSchema>

export default RecordSchema;
