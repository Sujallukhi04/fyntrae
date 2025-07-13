import { Request, Response } from "express";
import { loginSchema, signupSchema } from "../utils";
import { ErrorHandler } from "../utils/errorHandler";
import bcrypt from "bcryptjs";
import { db } from "../prismaClient";
import { generateToken } from "../utils/jwt";
import { WeekStart } from "@prisma/client";
import { getAuthUserData, getUserByEmail } from "../helper/user";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    console.log(email, password);

    const validatedData = loginSchema.safeParse({ email, password });
    if (!validatedData.success) {
      const messages = validatedData.error.errors.map((err) => err.message);
      throw new ErrorHandler(messages.join(", "), 400);
    }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, weekStart = "monday" } = req.body;

    const validatedData = signupSchema.safeParse({ name, email, password });
    if (!validatedData.success) {
      const messages = validatedData.error.errors.map((err) => err.message);
      throw new ErrorHandler(messages.join(", "), 400);
    }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof Error ? 400 : 500
    );
  }
};

export const getAuthUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler("Unauthorized - User not found", 404);
    }

    const currentUser = await getAuthUserData(user.id);
    res.status(200).json({
      message: "User fetched successfully",
      user: currentUser,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof Error ? 400 : 500
    );
  }
};
