import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { AppError } from "../utilities/appError.js";
const fileUpload = () => {
  // const upload = multer({ dest: "uploads/" });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, uuidv4() + " " + file.originalname);
    },
  });
  function fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("application")) {
      cb(null, true);
    } else {
      cb(new AppError("file must be a pdf", 400), false);
    }
  }
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
    },
  });
  return upload;
};
export const uploadSingleFile = (fieldName) => fileUpload().single(fieldName);
