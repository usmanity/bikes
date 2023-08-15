import prisma from '$lib/prisma';

import type { PageServerLoad } from './$types';


export const load = (async () => {
  const response = await prisma.bike.findMany({
    include: {
      MileageUpdate: {
        orderBy: {
          createdAt: 'desc'
        },
      },
      Component: true,
      Event: true,
    }
  });


  return { bikes: response };

}) satisfies PageServerLoad;
