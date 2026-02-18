import { z } from 'zod';

export const InscriptionStatusSchema = z.enum(['PENDING','ACCEPTED','REFUSED']);

export type InscriptionStatusType = `${z.infer<typeof InscriptionStatusSchema>}`

export default InscriptionStatusSchema;
