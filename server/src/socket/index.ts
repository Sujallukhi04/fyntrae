import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { ErrorHandler } from "../utils/errorHandler";
import { Role } from "@prisma/client";
import { config } from "../config/config";

interface JwtPayload {
  id: string;
  orgId?: string;
  role?: Role;
}

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

const ALLOWED_ROLES: Role[] = [
  Role.ADMIN,
  Role.EMPLOYEE,
  Role.MANAGER,
  Role.OWNER,
];

type OrgUserSocketMap = Map<string, Map<string, Set<string>>>;

const orgUserSocketMap: OrgUserSocketMap = new Map();

let ioInstance: Server | null = null;

export const initializeSocket = (io: Server) => {
  ioInstance = io;

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(rawCookie);

      const token = cookies["accessToken"];
      if (!token) {
        return next(
          new ErrorHandler("Authentication error: Token missing", 401)
        );
      }

      const decoded = jwt.verify(
        token,
        config.ACCESS_TOKEN_SECRET as string
      ) as JwtPayload;

      const orgId = socket.handshake.query.orgId as string | undefined;
      const role = socket.handshake.query.role as Role | undefined;

      if (!orgId) {
        return next(
          new ErrorHandler("Authentication error: OrgId missing", 401)
        );
      }

      if (!role) {
        return next(
          new ErrorHandler("Authentication error: Role missing", 401)
        );
      }

      if (!ALLOWED_ROLES.includes(role)) {
        return next(new ErrorHandler("Forbidden: Invalid role provided", 403));
      }

      socket.user = {
        ...decoded,
        orgId,
        role,
      };

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
