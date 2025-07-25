import express from "express";
import { errorHandler } from "./utils/errorHandler";
import authRoutes from "./routes/auth";
import organizationRoutes from "./routes/organization";
import memberRoutes from "./routes/member";
import clientRoutes from "./routes/client";
import projectRoutes from "./routes/project";
import timeRoutes from "./routes/time";
import tagRoutes from "./routes/tag";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
