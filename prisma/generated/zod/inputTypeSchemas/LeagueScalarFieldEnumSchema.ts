import { z } from 'zod';

export const LeagueScalarFieldEnumSchema = z.enum(['id','name','description','createdAt','updatedAt']);

export default LeagueScalarFieldEnumSchema;
