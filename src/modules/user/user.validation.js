import Joi from "joi";

const signUpVal = Joi.object({
  firstName: Joi.string().min(2).max(20).required(),
  lastName: Joi.string().min(2).max(20).required(),
  username: Joi.string().min(2).max(40).required(),
  email: Joi.string()
    .pattern(/^[a-zA-Z0-9_.]{3,200}@(gmail|yahoo)\.com$/)
    .required(),
  recoveryEmail: Joi.string().email(),
  password: Joi.string()
    .pattern(/^[A-Z][A-Za-z0-9]{8,40}$/)
    .required(),
  DOB: Joi.date().iso().required(),
  mobileNumber: Joi.string()
    .pattern(/^(002|\+2)?01[0125][0-9]{8}$/)
    .required(),
  role: Joi.string().valid("User", "Company_HR").required(),
});

const signInVal = Joi.object({
  email: Joi.string()
    .pattern(/^[a-zA-Z0-9_.]{3,200}@(gmail|yahoo)\.com$/)
    .required(),
  password: Joi.string()
    .pattern(/^[A-Z][A-Za-z0-9]{8,40}$/)
    .required(),
});

const updateVal = Joi.object({
  email: Joi.string().pattern(/^[a-zA-Z0-9_.]{3,200}@(gmail|yahoo)\.com$/),
  recoveryEmail: Joi.string().email(),
  DOB: Joi.date().iso(),
  mobileNumber: Joi.string().pattern(/^(002|\+2)?01[0125][0-9]{8}$/),
  firstName: Joi.string().min(2).max(20),
  lastName: Joi.string().min(2).max(20),
});
const updatePasswordVal = Joi.object({
  currentPassword: Joi.string()
    .pattern(/^[A-Z][A-Za-z0-9]{8,40}$/)
    .required(),
  newPassword: Joi.string()
    .pattern(/^[A-Z][A-Za-z0-9]{8,40}$/)
    .required(),
});
export { signUpVal, signInVal, updateVal, updatePasswordVal };
