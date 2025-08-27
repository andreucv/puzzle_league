import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsScalarWhereInputSchema } from './LeaguePointsScalarWhereInputSchema';
import { LeaguePointsUpdateManyMutationInputSchema } from './LeaguePointsUpdateManyMutationInputSchema';
import { LeaguePointsUncheckedUpdateManyWithoutUserInputSchema } from './LeaguePointsUncheckedUpdateManyWithoutUserInputSchema';

export const LeaguePointsUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => LeaguePointsScalarWhereInputSchema),
  data: z.union([ z.lazy(() => LeaguePointsUpdateManyMutationInputSchema),z.lazy(() => LeaguePointsUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export default LeaguePointsUpdateManyWithWhereWithoutUserInputSchema;
