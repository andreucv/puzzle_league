import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionScalarWhereInputSchema } from './CompetitionScalarWhereInputSchema';
import { CompetitionUpdateManyMutationInputSchema } from './CompetitionUpdateManyMutationInputSchema';
import { CompetitionUncheckedUpdateManyWithoutLeagueInputSchema } from './CompetitionUncheckedUpdateManyWithoutLeagueInputSchema';

export const CompetitionUpdateManyWithWhereWithoutLeagueInputSchema: z.ZodType<Prisma.CompetitionUpdateManyWithWhereWithoutLeagueInput> = z.object({
  where: z.lazy(() => CompetitionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CompetitionUpdateManyMutationInputSchema),z.lazy(() => CompetitionUncheckedUpdateManyWithoutLeagueInputSchema) ]),
}).strict();

export default CompetitionUpdateManyWithWhereWithoutLeagueInputSchema;
