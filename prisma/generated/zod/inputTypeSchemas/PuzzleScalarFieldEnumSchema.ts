import { z } from 'zod';

export const PuzzleScalarFieldEnumSchema = z.enum(['id','name','pieces','image_cld_id','brand','serialNumber','barcode','createdAt','updatedAt']);

export default PuzzleScalarFieldEnumSchema;
