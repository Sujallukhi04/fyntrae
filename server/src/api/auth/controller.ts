import { Request, Response } from "express";
import {
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  resetpassword,
  resetpasswordWithToken,
  signupSchema,
  updateUserSchema,
} from "../../schemas/auth";
import { ErrorHandler } from "../../utils/errorHandler";
import bcrypt from "bcryptjs";
import { db } from "../../prismaClient";
import { WeekStart } from "@prisma/client";
import { getAuthUserData, getUserByEmail } from "../../helper/user";
import { catchAsync } from "../../utils/catchAsync";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/multer";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import {
  createToken,
  rotateRefreshToken,
  storeRefreshToken,
} from "../../helper/token";
import { emailTemplates, sendMail } from "../../helper/mailer";

const accessTokenExpiresIn =
  Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 15 * 60 * 1000;

const refreshTokenExpiresIn =
  Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000;

export const login = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = loginSchema.parse(req.body);

    const { email, password } = validatedData;

    const existingUser = await getUserByEmail(email);
    if (!existingUser) throw new ErrorHandler("User does not exist", 404);

    if (existingUser.isPlaceholder || !existingUser.isActive) {
      throw new ErrorHandler(
        "Account is deactivated. Contact administrator.",
        403
      );
    }

    if (!existingUser.password) {
      throw new ErrorHandler("Invalid email or password", 400);
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      throw new ErrorHandler("Invalid email or password", 401);
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await createToken(
        existingUser.email,
        "EmailVerification"
      );

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      try {
        await sendMail({
          to: existingUser.email,
          subject: `Verify your email address`,
          html: emailTemplates.verificationEmail({
            userName: existingUser.name,
            verificationLink: verificationUrl,
          }),
        });
      } catch (err) {
        console.error("Failed to send verification email:", err);
        throw new ErrorHandler(
          "Your email is not verified and we couldn't send a new verification email. Please contact support.",
          500
        );
      }

      throw new ErrorHandler(
        "Email not verified. A new verification link has been sent.",
        403
      );
    }

    await db.refreshToken.deleteMany({
      where: {
        userId: existingUser.id,
        expiresAt: { lt: new Date() },
      },
    });

    const userTokens = await db.refreshToken.findMany({
      where: { userId: existingUser.id },
      orderBy: { createdAt: "asc" },
    });

    const MAX_TOKENS = Number(process.env.MAXIMUM_SESSION) || 5;
    if (userTokens.length >= MAX_TOKENS) {
      const tokensToDelete = userTokens.slice(
        0,
        userTokens.length - MAX_TOKENS + 1
      );
      await db.refreshToken.deleteMany({
        where: {
          id: { in: tokensToDelete.map((t) => t.id) },
        },
      });
    }

    const accessToken = generateAccessToken({ id: existingUser.id });
    const refreshToken = await storeRefreshToken(existingUser.id);

    const refreshtoken = generateRefreshToken({ token: refreshToken });

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth" });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: accessTokenExpiresIn,
      path: "/",
    });

    res.cookie("refreshToken", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: refreshTokenExpiresIn,
      path: "/api/auth",
    });

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

    const verificationToken = await createToken(email, "EmailVerification");

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      await sendMail({
        to: email,
        subject: `Verification of Email Address`,
        html: emailTemplates.verificationEmail({
          userName: name,
          verificationLink: verificationUrl,
        }),
      });
    } catch (err) {
      console.error("Failed to send verification email:", err);
      throw new ErrorHandler(
        "Failed to send verification email. Please check your email address and try again.",
        500
      );
    }

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
      if (profilePicPublicId) {
        await deleteFromCloudinary(profilePicPublicId);
      }

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

    //@ts-ignore
    const token = req.token;

    const validateddata = changePasswordSchema.parse(req.body);

    const { currentPassword, newPassword } = validateddata;

    const isMatch = await bcrypt.compare(currentPassword, req.user?.password!);
    if (!isMatch) throw new ErrorHandler("Current password is incorrect", 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await db.refreshToken.deleteMany({
      where: {
        userId,
        token: { not: token },
      },
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

    //@ts-ignore
    const oldToken = req.token;
    if (!oldToken) throw new ErrorHandler("Refresh token missing", 401);

    await db.refreshToken.deleteMany({ where: { token: oldToken } });

    res.clearCookie("accessToken", { httpOnly: true, path: "/" });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
);

export const refresh = catchAsync(async (req: Request, res: Response) => {
  //@ts-ignore
  const oldToken = req.token;
  if (!oldToken) throw new ErrorHandler("Refresh token missing", 401);

  const dbToken = await db.refreshToken.findUnique({
    where: { token: oldToken },
  });

  if (dbToken) {
    await db.refreshToken.deleteMany({
      where: { userId: dbToken.userId, expiresAt: { lt: new Date() } },
    });
  }

  if (!dbToken || dbToken.expiresAt < new Date()) {
    throw new ErrorHandler("Invalid or expired refresh token", 401);
  }

  const newRefreshToken = await rotateRefreshToken(
    oldToken,
    dbToken.userId,
    dbToken.expiresAt
  );

  const accessToken = generateAccessToken({ id: dbToken.userId });

  const refreshtoken = generateRefreshToken(
    { token: newRefreshToken },
    dbToken.expiresAt
  );

  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth" });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: accessTokenExpiresIn,
    path: "/",
  });

  res.cookie("refreshToken", refreshtoken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: dbToken.expiresAt.getTime() - Date.now(),
    path: "/api/auth",
  });

  res.json({ message: "Tokens refreshed" });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    throw new ErrorHandler("Verification token is missing", 400);
  }

  await db.tokens.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  });

  const dbToken = await db.tokens.findUnique({
    where: { token },
  });

  if (!dbToken || dbToken.type !== "EmailVerification") {
    throw new ErrorHandler("Invalid verification token", 400);
  }

  // First, check if the token is expired
  if (dbToken.expires < new Date()) {
    await db.tokens.delete({ where: { token } });
    throw new ErrorHandler("Verification token has expired", 400);
  }

  // Then, check if the user is already verified
  const user = await db.user.findFirst({
    where: { email: dbToken.email },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  if (user.emailVerified) {
    await db.tokens.delete({ where: { token } }); // Optional: clean up
    throw new ErrorHandler("Email already verified.", 400);
  }

  // Mark user as verified
  await db.user.update({
    where: { email: dbToken.email },
    data: { emailVerified: true },
  });

  // Delete the token after use
  await db.tokens.delete({ where: { token } });

  res.status(200).json({ message: "Email verified successfully" });
});

export const sendResetPassword = catchAsync(
  async (req: Request, res: Response) => {
    const validatedData = resetpassword.parse(req.body);

    const { email } = validatedData;

    const user = await db.user.findFirst({
      where: {
        email,
        emailVerified: true,
      },
    });

    if (!user) throw new ErrorHandler("Email does not exists");

    await db.tokens.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    const resetToken = await createToken(user.email, "PasswordReset");

    const resetUrl = `${process.env.FRONTEND_URL}/new-password?token=${resetToken}`;

    try {
      await sendMail({
        to: user.email,
        subject: `Reset Your Password`,
        html: emailTemplates.forgotPasswordEmail({
          userName: user.name,
          resetLink: resetUrl,
        }),
      });
    } catch (err) {
      console.error("Failed to send verification email:", err);
      throw new ErrorHandler(
        "Failed to send password reset email. Please try again.",
        500
      );
    }

    res.status(200).json({ message: "Email verified successfully" });
  }
);

export const resetPasswordWithToken = catchAsync(
  async (req: Request, res: Response) => {
    const { token } = req.params;

    const validatedData = resetpasswordWithToken.parse(req.body);

    const { password } = validatedData;

    if (!token || typeof token !== "string") {
      throw new ErrorHandler("Verification token is missing", 400);
    }

    await db.tokens.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    const dbToken = await db.tokens.findUnique({
      where: { token },
    });

    if (!dbToken || dbToken.type !== "PasswordReset") {
      throw new ErrorHandler("Invalid verification token", 400);
    }

    // First, check if the token is expired
    if (dbToken.expires < new Date()) {
      await db.tokens.delete({ where: { token } });
      throw new ErrorHandler("Verification token has expired", 400);
    }

    const user = await db.user.findFirst({
      where: { email: dbToken.email },
    });

    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await db.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Delete the token after use
    await db.tokens.delete({ where: { token } });

    res.status(200).json({
      message:
        "Password reset successful. All sessions have been logged out very soon.",
    });
  }
);
