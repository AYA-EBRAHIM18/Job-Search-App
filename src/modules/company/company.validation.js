import { User } from "../../../database/models/user.model.js";
import { AppError } from "../../utilities/appError.js";
import Joi from "joi";

const roleVal = async (req, res, next) => {
  // const userId = req.user.userId;
  // let user = await User.findById(userId);
  // if (user.role.includes("User")) {
  //   return next(new AppError("Access denied", 404));
  // }
  if (!req.user.role.includes("Company_HR")) {
    return next(new AppError("Access denied", 403));
  }
  next();
};

const addCompanyVal = Joi.object({
  companyName: Joi.string().min(2).max(20).required(),
  description: Joi.string().min(10).max(400).required(),
  industry: Joi.string().min(2).max(40).required(),
  address: Joi.string().min(2).max(100).required(),
  companyEmail: Joi.string()
    .pattern(/^[a-zA-Z0-9_.]{3,200}@(gmail|yahoo)\.(com|net)$/)
    .required(),
  numberOfEmployees: Joi.string()
    .valid(
      "1-10",
      "11-20",
      "21-50",
      "51-100",
      "101-200",
      "201-500",
      "501-1000",
      "1000+"
    )
    .required(),
});

const updateComVal = Joi.object({
  companyName: Joi.string().min(2).max(20),
  description: Joi.string().min(10).max(400),
  industry: Joi.string().min(2).max(40),
  address: Joi.string().min(2).max(100),
  companyEmail: Joi.string().pattern(
    /^[a-zA-Z0-9_.]{3,200}@(gmail|yahoo)\.(com|net)$/
  ),
  companyHR: Joi.string().hex().length(24),
  numberOfEmployees: Joi.string().valid(
    "1-10",
    "11-20",
    "21-50",
    "51-100",
    "101-200",
    "201-500",
    "501-1000",
    "1000+"
  ),
});

export { addCompanyVal, roleVal, updateComVal };
