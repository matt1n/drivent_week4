import app, { init } from "@/app";
import bookingRepository from "@/repositories/booking-repository";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress, createHotel, createRoomWithHotelId, createRoomWithoutCapacity, createTicket, createTicketTypeNoRemoteWithoutHotel, createTicketTypeRemote, createTicketTypeWithHotel, createUser } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

const server = supertest(app);

beforeAll(async () => {
  await init();
});
beforeEach(async () => {
  await cleanDb();
});

describe("Post /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 402 when user ticket is remote ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    it("should respond with status 402 when user ticket is remote ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      await createTicketTypeRemote();
    
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
    it("should respond with status 402 when user ticket is not paid ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
    
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    it("should respond with status 402 when user ticket is not remote and without hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeNoRemoteWithoutHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    
    it("should respond with status 404 when user has no enrollment ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
    
      await createTicketTypeRemote();
    
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    describe("when have a valid ticket", () => {
      it("should respond with status 404 if no room", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("should respond with status 404 if room no exist", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: -1 });
    
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("should respond with status 403 if room not has capacity", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithoutCapacity(hotel.id);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
    
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      }); 
      it("should respond with status 200 if booking was successful", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual(expect.objectContaining({ bookingId: expect.any(Number) }));
      }); 
    });
  });
});

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe("when token is valid", () => {
    it("should respond with status 404 if user don't have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 200 and booking if user have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await bookingRepository.createBooking(user.id, room.id);
      
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(expect.objectContaining({
        id: expect.any(Number),
        Room: expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          hotelId: expect.any(Number),
          capacity: expect.any(Number),
        })
      }));
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe("when token is valid", () => {
    it("should respond with status 404 if user don't have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    describe("when user have a booking", () => {
      it("should respond with status 404 if bookingId is not valid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        await bookingRepository.createBooking(user.id, room.id);
  
        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("should respond with status 404 if roomId is not valid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await bookingRepository.createBooking(user.id, room.id);
  
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("should respond with status 403 if room not has capacity", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await bookingRepository.createBooking(user.id, room.id);
        const roomWithoutCapacity = await createRoomWithoutCapacity(hotel.id);
  
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: roomWithoutCapacity.id });
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
      it("should respond with status 200 and bookingId if booking update was successful", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await bookingRepository.createBooking(user.id, room.id);
        const otherRoom = await createRoomWithHotelId(hotel.id);
  
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: otherRoom.id });
  
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual(expect.objectContaining({ bookingId: expect.any(Number) }));
      });
    });
  });
});
