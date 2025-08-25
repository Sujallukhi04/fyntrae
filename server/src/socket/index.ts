import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { ErrorHandler } from "../utils/errorHandler";

interface JwtPayload {
  id: string;
  orgId?: string; // include orgId in token or send via query
}

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

type OrgUserSocketMap = Map<
  string, // orgId
  Map<
    string, // userId
    Set<string> // socketIds
  >
>;

const orgUserSocketMap: OrgUserSocketMap = new Map();

let ioInstance: Server | null = null;

export const initializeSocket = (io: Server) => {
  ioInstance = io;

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      // Parse cookies
      const rawCookie = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(rawCookie);

      // JWT from cookies
      const token = cookies["accessToken"];
      if (!token) {
        return next(
          new ErrorHandler("Authentication error: Token missing", 401)
        );
      }

      // Verify JWT
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as JwtPayload;

      // Get orgId from query if not in token
      const orgId = socket.handshake.query.orgId as string | undefined;

      socket.user = {
        ...decoded,
        orgId: orgId,
      };

      if (!socket.user.orgId) {
        return next(
          new ErrorHandler("Authentication error: OrgId missing", 401)
        );
      }

      next();
    } catch (err) {
      console.error("Socket authentication failed:", err);
      return next(new ErrorHandler("Authentication error: Invalid token", 401));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const { id: userId, orgId } = socket.user ?? {};
    if (!userId || !orgId) return;

    if (!orgUserSocketMap.has(orgId)) {
      orgUserSocketMap.set(orgId, new Map());
    }

    const userSockets = orgUserSocketMap.get(orgId)!;
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }

    userSockets.get(userId)!.add(socket.id);

    console.log(
      `User connected: ${userId} (Org: ${orgId}), socketId: ${socket.id}`
    );


    socket.on("disconnect", () => {
      console.log(
        `User disconnected: ${userId} (Org: ${orgId}), socketId: ${socket.id}`
      );

      const orgSockets = orgUserSocketMap.get(orgId);
      if (orgSockets) {
        const sockets = orgSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            orgSockets.delete(userId);
          }
        }
        if (orgSockets.size === 0) {
          orgUserSocketMap.delete(orgId);
        }
      }

      console.log("Updated Org Map:", orgUserSocketMap);
    });
  });
};

export const emitToOrg = (orgId: string, event: string, data: any) => {
  if (!ioInstance) return;
  const orgSockets = orgUserSocketMap.get(orgId);
  if (!orgSockets) return;

  for (const [, sockets] of orgSockets) {
    for (const socketId of sockets) {
      ioInstance.to(socketId).emit(event, data);
    }
  }
};

export const emitToUserInOrg = (
  orgId: string,
  userId: string,
  event: string,
  data: any
) => {
  if (!ioInstance) return;
  const orgSockets = orgUserSocketMap.get(orgId);
  if (!orgSockets) return;

  const sockets = orgSockets.get(userId);
  if (!sockets) return;

  for (const socketId of sockets) {
    ioInstance.to(socketId).emit(event, data);
  }
};
