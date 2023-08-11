import prisma from '$lib/prisma';

import type { PageServerLoad } from './$types';


export const load = (async () => {
  const response = await prisma.bike.findMany()


  return { bikes: response };

}) satisfies PageServerLoad;
