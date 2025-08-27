import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  sessions: z.boolean().optional(),
  accounts: z.boolean().optional(),
  records: z.boolean().optional(),
  createdRecords: z.boolean().optional(),
  roleAssignments: z.boolean().optional(),
  requests: z.boolean().optional(),
  leaguePoints: z.boolean().optional(),
  competitions: z.boolean().optional(),
}).strict();

export default UserCountOutputTypeSelectSchema;
