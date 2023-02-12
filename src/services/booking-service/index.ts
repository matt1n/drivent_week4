import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import findRoom from "@/repositories/room-repository";
import { exclude } from "@/utils/prisma-utils";
import httpStatus from "http-status";

async function postBooking(userId: number, roomId: number) {
  const enrollment = await enrollmentRepository.findEnrollmentIncludesAll(userId);
  if (!enrollment) {
    throw httpStatus.NOT_FOUND;
  }
  if (enrollment.Ticket[0].TicketType.includesHotel!==true || enrollment.Ticket[0].status!=="PAID" || enrollment.Ticket[0].TicketType.isRemote!==false) {
    throw httpStatus.PAYMENT_REQUIRED;
  }
  if (!roomId) {
    throw httpStatus.NOT_FOUND;
  }
  const room = await findRoom(roomId);
  if (!room) {
    throw httpStatus.NOT_FOUND;
  }
  if (room.capacity===0) {
    throw httpStatus.FORBIDDEN;
  }
  
  return await bookingRepository.createBooking(userId, roomId);
}

async function getBooking(userId: number){
  
}

const bookingService = { postBooking };

export default bookingService;
