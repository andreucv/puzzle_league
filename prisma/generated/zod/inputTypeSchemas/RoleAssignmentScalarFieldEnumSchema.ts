import { z } from 'zod';

export const RoleAssignmentScalarFieldEnumSchema = z.enum(['id','role','userId','competitionId','createdAt','updatedAt']);

export default RoleAssignmentScalarFieldEnumSchema;
