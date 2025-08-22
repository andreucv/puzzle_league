import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestUpdateWithoutCompetitionInputSchema } from './RequestUpdateWithoutCompetitionInputSchema';
import { RequestUncheckedUpdateWithoutCompetitionInputSchema } from './RequestUncheckedUpdateWithoutCompetitionInputSchema';

export const RequestUpdateWithWhereUniqueWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestUpdateWithWhereUniqueWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RequestWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RequestUpdateWithoutCompetitionInputSchema),z.lazy(() => RequestUncheckedUpdateWithoutCompetitionInputSchema) ]),
}).strict();

export default RequestUpdateWithWhereUniqueWithoutCompetitionInputSchema;
