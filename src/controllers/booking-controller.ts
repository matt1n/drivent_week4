import bookingService from "@/services/booking-service";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;
  const roomId = req.body.roomId as number;
  
  try {
    const bookingId = await bookingService.postBooking(userId, roomId);
    res.status(httpStatus.OK).send(bookingId);
  } catch (error) {
    if (
      error===httpStatus.FORBIDDEN || 
      error===httpStatus.NOT_FOUND || 
      error===httpStatus.PAYMENT_REQUIRED
    ) {
      return res.sendStatus(error);
    }
    res.sendStatus(500);
  }
}

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;

  try {
    const booking = await bookingService.getBooking(userId);
    res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error===httpStatus.NOT_FOUND) {
      return res.sendStatus(error);
    }
    res.sendStatus(500);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;
  const roomId = req.body.roomId as number;
  const { bookingId } = req.params;

  try {
    await bookingService.putBooking(userId, roomId, Number(bookingId));
    res.status(200).send({ bookingId: Number(bookingId) });
  } catch (error) {
    if (error===httpStatus.FORBIDDEN || error===httpStatus.NOT_FOUND) {
      return res.sendStatus(error);
    }
    res.sendStatus(500);
  }
}
