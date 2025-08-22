import { z } from 'zod';

export const RequestScalarFieldEnumSchema = z.enum(['id','role','status','userId','competitionId','createdAt','updatedAt','reason','additionalInfo']);

export default RequestScalarFieldEnumSchema;
