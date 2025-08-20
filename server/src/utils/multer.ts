import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up the multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Folder for storing files temporarily (optional)
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Keep the file extension
  },
});

// Set up multer with file size limit (e.g., 5MB)
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error("Only JPG, JPEG, and PNG files are allowed.");
      return cb(error as any, false); // Reject the upload if the mime type is not valid
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (
      fileExtension !== ".jpg" &&
      fileExtension !== ".jpeg" &&
      fileExtension !== ".png"
    ) {
      const error = new Error(
        "Only JPG, JPEG, and PNG file extensions are allowed."
      );
      return cb(error as any, false); // Reject the upload if the extension is not valid
    }

    // If file is valid, pass `null` for the error and `true` to indicate upload is allowed
    cb(null, true);
  },
});

// Upload file to Cloudinary function
const unlinkFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(new Error(`Error deleting the file: ${err.message}`)); // Reject with error message
      } else {
        resolve(); // Resolve if the file is deleted successfully
      }
    });
  });
};

export const uploadToCloudinary = async (filePath: string) => {
  let cloudinaryResult;
  try {
    // 1. Upload the file to Cloudinary
    cloudinaryResult = await cloudinary.uploader.upload(filePath, {
      folder: "uploads", // Cloudinary folder (optional)
      resource_type: "auto", // Automatically detect the file type
    });

    // 2. If upload is successful, delete the local file
    await unlinkFile(filePath);

    // 3. Return the Cloudinary result if everything is successful
    return {
      url: cloudinaryResult.secure_url, // Cloudinary URL of the uploaded image
      public_id: cloudinaryResult.public_id, // Cloudinary public_id (useful for deletion or management)
    };
  } catch (error) {
    // 4. If any operation fails, log the error and throw it
    console.error("Error in the upload or delete process:", error);
    // Rollback: Even if Cloudinary upload fails, try to delete the file (no-op if file doesn't exist)
    if (cloudinaryResult) {
      console.log(
        `Cloudinary upload failed, but rollback handled. Cloudinary public_id: ${cloudinaryResult.public_id}`
      );
    }

    // Delete the file if it's partially uploaded and the deletion hasn't happened yet
    try {
      await unlinkFile(filePath); // Attempt file deletion
    } catch (deleteError) {
      console.error("Error deleting file during rollback:", deleteError);
    }

    throw new Error("Error during file upload or deletion process");
  }
};
