import { Request, Response } from "express";
import {
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  signupSchema,
  updateUserSchema,
} from "../../schemas/auth";
import { ErrorHandler } from "../../utils/errorHandler";
import bcrypt from "bcryptjs";
import { db } from "../../prismaClient";
import { generateToken } from "../../utils/jwt";
import { WeekStart } from "@prisma/client";
import { getAuthUserData, getUserByEmail } from "../../helper/user";
import { catchAsync } from "../../utils/catchAsync";
import { uploadToCloudinary } from "../../utils/multer";

export const login = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = loginSchema.parse(req.body);

    const { email, password } = validatedData;

    const existingUser = await getUserByEmail(email);
    if (!existingUser) throw new ErrorHandler("User does not exist", 401);

    if (existingUser.isPlaceholder || !existingUser.isActive) {
      throw new ErrorHandler(
        "Account is deactivated. Contact administrator.",
        401
      );
    }

    if (!existingUser.password) {
      throw new ErrorHandler("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      throw new ErrorHandler("Invalid email or password", 401);
    }

    const userWithOrg = await db.user.findUnique({
      where: { id: existingUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        weekStart: true,
        currentTeamId: true,
        createdAt: true,
        currentTeam: {
          select: {
            id: true,
            name: true,
            personalTeam: true,
          },
        },
        members: {
          where: {
            organizationId: existingUser.currentTeamId || "",
          },
          select: { role: true },
          take: 1,
        },
      },
    });

    const token = generateToken({ id: existingUser.id });

    res.cookie("token", token, {
      httpOnly: true, // Prevent access via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax in dev for tools, strict in prod
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      path: "/", // Cookie is sent for all routes
    });

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        id: userWithOrg?.id,
        name: userWithOrg?.name,
        email: userWithOrg?.email,
        weekStart: userWithOrg?.weekStart,
        currentTeamId: userWithOrg?.currentTeamId,
        createdAt: userWithOrg?.createdAt,
      },
      currentOrganization: userWithOrg?.currentTeam
        ? {
            id: userWithOrg.currentTeam.id,
            name: userWithOrg.currentTeam.name,
            personalTeam: userWithOrg.currentTeam.personalTeam,
            role: userWithOrg.members[0]?.role || "MEMBER",
          }
        : null,
    });
  }
);

export const register = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, weekStart = "monday" } = req.body;

    const validatedData = signupSchema.parse({ name, email, password });

    const existingUser = await getUserByEmail(email);
    if (existingUser) throw new ErrorHandler("Email already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 12);

    const validWeekStarts: WeekStart[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const weekStartValue = weekStart.toLowerCase() as WeekStart;
    if (!validWeekStarts.includes(weekStartValue)) {
      throw new ErrorHandler("Invalid week start day", 400);
    }

    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          weekStart: weekStartValue,
        },
      });

      const personalOrganization = await tx.organizations.create({
        data: {
          userId: newUser.id,
          name: `${name}'s Organization`,
          personalTeam: true,
          dateFormat: "MM/DD/YYYY",
          currency: "INR",
          employeesCanSeeBillableRates: false,
          intervalFormat: "12h",
          timeFormat: "12h",
          numberFormat: "1,000.00",
        },
      });

      await tx.member.create({
        data: {
          userId: newUser.id,
          organizationId: personalOrganization.id,
          role: "OWNER",
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: newUser.id },
        data: {
          currentTeamId: personalOrganization.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          weekStart: true,
          currentTeamId: true,
          createdAt: true,
        },
      });

      return {
        user: updatedUser,
        organization: personalOrganization,
      };
    });

    const token = generateToken({ id: result.user.id });

    res.cookie("token", token, {
      httpOnly: true, // Prevent access via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax in dev for tools, strict in prod
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      path: "/", // Cookie is sent for all routes
    });

    res.status(201).json({
      message: "User registered successfully",
      user: result.user,
      personalOrganization: {
        id: result.organization.id,
        name: result.organization.name,
        personalTeam: result.organization.personalTeam,
        role: "OWNER",
      },
    });
  }
);

export const getAuthUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler("Unauthorized - User not found", 404);
    }

    const currentUser = await getAuthUserData(user.id);
    res.status(200).json({
      message: "User fetched successfully",
      user: currentUser,
    });
  }
);

export const updateUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("userId not found", 404);

    const validatedData = updateUserSchema.parse(req.body);
    const { name } = validatedData;

    let profilePicUrl = req.user?.profilePicUrl;
    let profilePicPublicId = req.user?.profilePicPublicId;

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file.path);
      profilePicUrl = cloudinaryResult.url;
      profilePicPublicId = cloudinaryResult.public_id;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        name,
        profilePicUrl,
        profilePicPublicId,
      },
    });

    const currentuser = await getAuthUserData(userId);
    res.status(200).json({
      message: "User profile updated successfully",
      user: currentuser,
    });
  }
);

export const changePassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("userId not provided", 403);

    const validateddata = changePasswordSchema.parse(req.body);

    const { currentPassword, newPassword } = validateddata;

    const isMatch = await bcrypt.compare(currentPassword, req.user?.password!);
    if (!isMatch) throw new ErrorHandler("Current password is incorrect", 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);

export const logoutUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("userId not provided", 403);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/", // must match the cookie's path
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
);
