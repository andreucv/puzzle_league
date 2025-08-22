import { z } from 'zod';

/////////////////////////////////////////
// RECORD SCHEMA
/////////////////////////////////////////

export const RecordSchema = z.object({
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
