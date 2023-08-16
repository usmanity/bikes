export const prerender = false;

import prisma from '$lib/prisma';

import type { PageServerLoad } from './$types';



export const actions = {
  updateMiles: async ({ request }) => {
    const data = await request.formData();
    const miles = data.get('miles');
    const bikeId = data.get('bikeId');
    try {
      const update = await prisma.mileageUpdate.create({
        data: {
          mileage: parseFloat(miles as string),
          bike: {
            connect: {
              id: parseInt(bikeId as string),
            }
          }
        }
      });
      return { status: 200, body: update };
    } catch {
      return { status: 500, body: 'Failed to save data' };
    }
  },
  addComponent: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const brand = data.get('brand');
    const cost = data.get('cost');
    const bikeId = data.get('bikeId');
    try {
      const miles = await prisma.mileageUpdate.findFirst({
        where: {
          bikeId: parseInt(bikeId as string),
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      const update = await prisma.component.create({
        data: {
          name,
          brand,
          cost: parseFloat(cost as string),
          milesAtInstall: miles!.mileage,
          installationDate: new Date(),
          bike: {
            connect: {
              id: parseInt(bikeId as string),
            }
          }
        }
      });
      console.log({ update })
      return { status: 200, body: update };
    } catch (e) {
      console.log(e)
      return { status: 500, body: 'Failed to save data' };
    }
  },
  addEvent: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const cost = data.get('cost');
    const date = data.get('date');
    const bikeId = data.get('bikeId');
    try {
      const miles = await prisma.mileageUpdate.findFirst({
        where: {
          bikeId: parseInt(bikeId as string),
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      const update = await prisma.event.create({
        data: {
          name,
          cost: parseFloat(cost as string) || 0,
          date: date || new Date(),
          bike: {
            connect: {
              id: parseInt(bikeId as string),
            }
          }
        }
      });
      console.log({ update })
      return { status: 200, body: update };
    } catch (e) {
      console.log(e)
      return { status: 500, body: 'Failed to save data' };
    }
  },
  deleteComponent: async ({ url }: { url: URL }) => {
    const id = parseInt(url.searchParams.get('id') as string);
    try {
      const update = await prisma.component.delete({
        where: {
          id,
        }
      });
      return { status: 200, body: update };
    } catch (e) {
      console.log(e)
      return { status: 500, body: 'Failed to save data' };
    }
  },
  deleteEvent: async ({ url }: { url: URL }) => {
    const id = parseInt(url.searchParams.get('id') as string);
    try {
      const update = await prisma.event.delete({
        where: {
          id,
        }
      });
      return { status: 200, body: update };
    } catch (e) {
      console.log(e)
      return { status: 500, body: 'Failed to save data' };
    }
  },
  deleteMileageUpdate: async ({ url }: { url: URL }) => {
    const id = parseInt(url.searchParams.get('id') as string);
    try {
      const update = await prisma.mileageUpdate.delete({
        where: {
          id,
        }
      });
      return { status: 200, body: update };
    } catch (e) {
      console.log(e)
      return { status: 500, body: 'Failed to save data' };
    }
  }
};

export const load = (async () => {
  const response = await prisma.bike.findMany({
    include: {
      MileageUpdate: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
      },
      Component: true,
      Event: true,
    }
  });


  return { bikes: response };

}) satisfies PageServerLoad;
