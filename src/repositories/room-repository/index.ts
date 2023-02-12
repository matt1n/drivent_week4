import { prisma } from "@/config";

async function findRoom(id: number) {
  return await prisma.room.findUnique({ where: { id } });
}

export default findRoom;
