import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','country','postalCode','createdAt','updatedAt']);

export default UserScalarFieldEnumSchema;
