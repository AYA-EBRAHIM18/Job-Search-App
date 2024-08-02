import bcrypt from "bcryptjs";
import { User } from "../../database/models/user.model.js";
import { AppError } from "./../utilities/appError.js";

export const checkEmail = async (req, res, next) => {
  let isFound = await User.findOne({ email: req.body.email });
  if (isFound) return next(new AppError("Email Already Exists", 404));

  req.body.password = bcrypt.hashSync(req.body.password, 8);
  next();
};
