import { prisma } from "@/config";

export async function createBooking(userId: number, roomId: number) {
  return await prisma.booking.create({ data: {
    userId,
    roomId
  } });
}

export async function findBooking(userId: number) {
  await prisma.booking.findFirst({ where: {
    userId
  } });
}

export async function updateBooking(id: number, roomId: number) {
  await prisma.booking.update({ where: {
    id
  }, data: {
    roomId
  } });
}

const bookingRepository = { createBooking, findBooking, updateBooking };

export default bookingRepository;
