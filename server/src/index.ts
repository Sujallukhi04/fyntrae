import express from "express";
import { errorHandler } from "./utils/errorHandler";
import authRoutes from "./api/auth";
import organizationRoutes from "./api/organization";
import memberRoutes from "./api/member";
import clientRoutes from "./api/client";
import projectRoutes from "./api/project";
import timeRoutes from "./api/time";
import tagRoutes from "./api/tag";
import timeSummaryRoutes from "./api/timersummary";
import reportRoutes from "./api/report";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket";
import { db } from "./prismaClient";
import { config } from "./config/config";
import compression from "compression";
import helmet from "helmet";
import { globalLimiter } from "./config/express_rate_limit";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

const PORT = config.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: config.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use(globalLimiter);

if (config.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

const shouldCompress = (req: express.Request, res: express.Response) => {
  if (req.headers["x-no-compression"]) return false;
  return compression.filter(req, res);
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression({ filter: shouldCompress }));

initializeSocket(io);

app.get("/", (req, res) => {
  res.send("Welcome to the FlexFlow API");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/tag", tagRoutes);
app.use("/api/timesummary", timeSummaryRoutes);
app.use("/api/report", reportRoutes);

app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const startServer = async () => {
  try {
    await db.$connect();
    console.log("Database connected");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  await db.$disconnect();

  io.close(() => {
    console.log("Socket.io server closed");
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
