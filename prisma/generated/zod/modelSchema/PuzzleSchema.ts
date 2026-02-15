import { z } from 'zod';

/////////////////////////////////////////
// PUZZLE SCHEMA
/////////////////////////////////////////

export const PuzzleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  pieces: z.number().int(),
  image_cld_id: z.string().nullable(),
  brand: z.string(),
  serialNumber: z.string().nullable(),
  barcode: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Puzzle = z.infer<typeof PuzzleSchema>

export default PuzzleSchema;
