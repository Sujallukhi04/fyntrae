import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import multer, { StorageEngine, FileFilterCallback } from "multer";
import { Request } from "express";
import { config } from "../config/config";

dotenv.config();

cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void
  ) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    callback(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    console.log(file);
    const allowedExtensions = [".jpg", ".jpeg", ".png"];

    if (
      file.mimetype &&
      file.mimetype.startsWith("image/") &&
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed.") as any, false);
    }
  },
});

const unlinkFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(new Error(`Error deleting the file: ${err.message}`));
      } else {
        resolve();
      }
    });
  });
};

export const uploadToCloudinary = async (filePath: string) => {
  let cloudinaryResult;
  try {
    cloudinaryResult = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
      resource_type: "auto",
    });

    await unlinkFile(filePath);

    return {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
    };
  } catch (error) {
    console.error("Error in the upload or delete process:", error);
    if (cloudinaryResult) {
      console.log(
        `Cloudinary upload failed, but rollback handled. Cloudinary public_id: ${cloudinaryResult.public_id}`
      );
    }

    try {
      await unlinkFile(filePath);
    } catch (deleteError) {
      console.error("Error deleting file during rollback:", deleteError);
    }

    throw new Error("Error during file upload or deletion process");
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  return await cloudinary.uploader.destroy(publicId);
};
