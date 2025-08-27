import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserScalarWhereInputSchema } from './UserScalarWhereInputSchema';
import { UserUpdateManyMutationInputSchema } from './UserUpdateManyMutationInputSchema';
import { UserUncheckedUpdateManyWithoutRecordsInputSchema } from './UserUncheckedUpdateManyWithoutRecordsInputSchema';

export const UserUpdateManyWithWhereWithoutRecordsInputSchema: z.ZodType<Prisma.UserUpdateManyWithWhereWithoutRecordsInput> = z.object({
  where: z.lazy(() => UserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserUpdateManyMutationInputSchema),z.lazy(() => UserUncheckedUpdateManyWithoutRecordsInputSchema) ]),
}).strict();

export default UserUpdateManyWithWhereWithoutRecordsInputSchema;
