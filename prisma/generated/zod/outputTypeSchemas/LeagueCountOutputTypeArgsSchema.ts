import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueCountOutputTypeSelectSchema } from './LeagueCountOutputTypeSelectSchema';

export const LeagueCountOutputTypeArgsSchema: z.ZodType<Prisma.LeagueCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => LeagueCountOutputTypeSelectSchema).nullish(),
}).strict();

export default LeagueCountOutputTypeSelectSchema;
