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
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

initializeSocket(io);

app.get("/", (req, res) => {
  res.send("Welcome to the FlexFlow API");
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

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
