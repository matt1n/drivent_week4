import bookingService from "@/services/booking-service";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;
  const roomId = req.body.roomId as number;
  try {
    const booking = await bookingService.postBooking(userId, roomId);
    res.status(httpStatus.OK).send({ bookingId: booking.id });
  } catch (error) {
    if (error===httpStatus.FORBIDDEN || error===httpStatus.NOT_FOUND || error===httpStatus.PAYMENT_REQUIRED) {
      return res.sendStatus(error);
    }
    res.sendStatus(500);
  }
}
