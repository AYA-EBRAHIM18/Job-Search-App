import jwt from "jsonwebtoken";
import { AppError } from "./../utilities/appError.js";

export const verifyToken = async (req, res, next) => {
  let { token } = req.headers;
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return next(new AppError("Invalid Token"));
    req.user = decoded;
    next();
  });
};
