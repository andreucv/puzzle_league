import { z } from 'zod';

export const RecordScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','finishTime','tableNumber','categoryId','creatorId']);

export default RecordScalarFieldEnumSchema;
