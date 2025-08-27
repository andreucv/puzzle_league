import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutCreatedRecordsInputSchema } from './UserUpdateWithoutCreatedRecordsInputSchema';
import { UserUncheckedUpdateWithoutCreatedRecordsInputSchema } from './UserUncheckedUpdateWithoutCreatedRecordsInputSchema';

export const UserUpdateToOneWithWhereWithoutCreatedRecordsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCreatedRecordsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCreatedRecordsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedRecordsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutCreatedRecordsInputSchema;
