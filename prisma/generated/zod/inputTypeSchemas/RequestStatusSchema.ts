import { z } from 'zod';

export const RequestStatusSchema = z.enum(['PENDING','APPROVED','REJECTED']);

export type RequestStatusType = `${z.infer<typeof RequestStatusSchema>}`

export default RequestStatusSchema;
