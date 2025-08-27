import { z } from 'zod';

export const RoleSchema = z.enum(['PARTICIPANT','ORGANIZER','JUDGE','ADMIN']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export default RoleSchema;
