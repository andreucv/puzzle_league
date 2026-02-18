import { z } from 'zod';

export const RecordScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','finishTime','tableNumber','status','categoryId','creatorId']);

export default RecordScalarFieldEnumSchema;
