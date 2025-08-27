import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionScalarWhereInputSchema } from './CompetitionScalarWhereInputSchema';
import { CompetitionUpdateManyMutationInputSchema } from './CompetitionUpdateManyMutationInputSchema';
import { CompetitionUncheckedUpdateManyWithoutCreatorInputSchema } from './CompetitionUncheckedUpdateManyWithoutCreatorInputSchema';

export const CompetitionUpdateManyWithWhereWithoutCreatorInputSchema: z.ZodType<Prisma.CompetitionUpdateManyWithWhereWithoutCreatorInput> = z.object({
  where: z.lazy(() => CompetitionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CompetitionUpdateManyMutationInputSchema),z.lazy(() => CompetitionUncheckedUpdateManyWithoutCreatorInputSchema) ]),
}).strict();

export default CompetitionUpdateManyWithWhereWithoutCreatorInputSchema;
