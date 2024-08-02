import { catchError } from "../../middleware/catchError.js";
import { User } from "./../../../database/models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "./../../utilities/appError.js";
import { sendEmails } from "../email/email.js";
import { Application } from "../../../database/models/application.model.js";
import { Company } from "../../../database/models/company.model.js";
import { Job } from "../../../database/models/job.model.js";

/**
 * @api {post} /users/signup User Sign-Up
 * @apiDescription Register a new user account. The user needs to provide a firstName, lastName, username email, recoveryEmail, password, DOB, mobileNumber and a role.
 * @apiPermission {string} schema Validation for user's data.
 * @apiPermission {string} checking if new user's email already exists.
 *
 * @apiBody {String} email User's email address.
 * @apiBody {String} password User's password.
 * @apiBody {String} [firstName] User's first name.
 * @apiBody {String} [lastName] User's last name.
 * @apiBody {String} [username] User's username.
 * @apiBody {Date} [DOB] User's date of birth.
 * @apiBody {String} [mobileNumber] User's mobile number.
 * @apiBody {String} [recoveryEmail] User's recovery email address.
 * @apiBody {String} [role] User's role ['User','company HR'].
 *
 * @apiSuccess {String} message Success message indicating that the user was registered successfully.
 * @apiSuccess {Object} user The newly created user account data.
 */
const signUp = catchError(async (req, res) => {
  let user = await User.insertMany(req.body);
  user[0].password = undefined;
  res.status(201).json({ message: "Success", user });
});

/**
 * @api {post} /users/signIn User Sign-In
 * @apiDescription Log in to an existing user account. The user needs to provide an email and password. A JWT token will be issued for authentication.
 * @apiPermission schema Validation for sign in input.
 *
 * @apiBody {String} email User's email address.
 * @apiBody {String} [recoveryEmail] User's recovery email address.
 * @apiBody {String} password User's password.
 *
 * @apiSuccess {String} message Success message indicating that the user was logged in successfully.
 * @apiSuccess {Object} user The user account data.
 * @apiSuccess {String} token JWT token for authentication.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const signIn = catchError(async (req, res, next) => {
  let user = await User.findOne(
    { email: req.body.email } || { recoveryEmail: req.body.recoveryEmail }
  );

  if (!user || !bcrypt.compareSync(req.body.password, user.password))
    return next(new AppError("Incorrect password or email.", 404));
  user.status = "online";
  await user.save();
  jwt.sign(
    { userId: user._id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    (err, token) => {
      res.json({ message: "success", token });
    }
  );
});

/**
 * @api {patch} /users/updateAcc Update User Account
 * @apiDescription Update user account information such as email, mobile number, recovery email, date of birth, last name, and first name. The request must include a token for authentication. The user must be the owner of the account to perform this operation.
 * @apiPermission User
 * @apiPermission {string} Validation using Joi
 * @apiHeader {String} Authorization  token for authentication.
 *
 * @apiBody {String} [email] New email address for the user.
 * @apiBody {String} [mobileNumber] New mobile number for the user.
 * @apiBody {String} [recoveryEmail] New recovery email address for the user.
 * @apiBody {Date} [DOB] New date of birth for the user.
 * @apiBody {String} [lastName] New last name for the user.
 * @apiBody {String} [firstName] New first name for the user.
 *
 * @apiSuccess {String} message Success message indicating that the account was updated successfully.
 * @apiSuccess {Object} user The updated user account data without showing password.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const updateAcc = catchError(async (req, res, next) => {
  const { email, mobileNumber } = req.body;
  const userId = req.user.userId;

  if (email) {
    const emailExists = await User.findOne({ email: email });
    if (emailExists && emailExists._id.toString() !== userId)
      return next(new AppError("Email Already Exist.", 404));
  }
  if (mobileNumber) {
    const mobileExists = await User.findOne({ mobileNumber: mobileNumber });
    if (mobileExists && mobileExists._id.toString() !== userId)
      next(new AppError("Mobile Number Already Exist.", 404));
  }
  let account = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
  }).select("-password");

  res.json({ message: "success", account });
});

/**
 * @api {delete} /users/ Delete User Account
 * @apiDescription Delete the user account. The request must include a  token for authentication. The user must be the owner of the account to perform this operation. Related documents in other collections will also be removed.
 * @apiPermission User
 * @apiHeader {String} Authorization  token for authentication.
 *
 * @apiSuccess {String} message Success message indicating that the account was deleted successfully.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 *
 */
const deleteAcc = catchError(async (req, res, next) => {
  const userId = req.user.userId;

  const company = await Company.findOne({ companyHR: userId });
  if (company) {
    const jobs = await Job.find({ addedBy: company.companyHR });

    const jobIds = jobs.map((job) => job._id);

    await Application.deleteMany({ jobId: { $in: jobIds } });

    await Job.deleteMany({ addedBy: company.companyHR });

    await Company.findByIdAndDelete(company._id);
  }
  await Token.deleteMany({ userId });

  let account = await User.findByIdAndDelete(userId);
  if (!account) {
    return next(new AppError("User Not Found.", 404));
  }

  res.json({ message: "success", account });
});

/**
 * @api {get} /users/ Get User Account Data
 * @apiDescription Retrieve the currently logged-in user's account data. The request must include a token for authentication. Only the owner of the account can access their own data.
 * @apiPermission User
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiSuccess {String} message Success message indicating that the account was retrieved successfully.
 * @apiSuccess {Object} user The user's account data.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const getUserData = catchError(async (req, res, next) => {
  const userId = req.user.userId;

  let account = await User.findById(userId).select("-password");
  if (!account) {
    return next(new AppError("User Not Found.", 404));
  }
  res.json({ message: "success", account });
});

/**
 * @api {get} /users/:userId Get User Profile
 * @apiDescription Retrieve the profile information of a specific user by their ID. The request must include a token for authentication.
 *
 * @apiParam {String} userId The ID of the user whose profile is being retrieved.
 *
 * @apiSuccess {Object} profile The profile data of the specified user.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const getUserProfile = catchError(async (req, res, next) => {
  const { userId } = req.params;
  let profile = await User.findById(userId).select("-password");
  if (!profile) {
    return next(new AppError("User Not Found.", 404));
  }
  res.json({ message: "success", profile });
});

/**
 * @api {patch} /users/updatePass Update User Password
 * @apiDescription Update the user's password. The user must provide their current password and a new password. The request must include a token for authentication.
 * @apiPermission User
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiBody {String} oldPassword Current password.
 * @apiBody {String} newPassword New password to set.
 *
 * @apiSuccess {String} message Success message indicating that the password was updated successfully.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const updatePassword = catchError(async (req, res, next) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (!user) return next(new AppError("User Not Found.", 404));
  if (!bcrypt.compareSync(req.body.currentPassword, user.password))
    return next(new AppError("Current password is incorrect .", 404));
  let hashedPassword = (req.body.newPassword = bcrypt.hashSync(
    req.body.newPassword,
    8
  ));
  user.password = hashedPassword;
  await user.save();

  res.json({ message: "Password Updated Successfully." });
});

const addMinutesToDate = (date, n) => {
  date.setTime(date.getTime() + n * 60_000);
  return date;
};

/**
 * @api {post} /users/forgetPassReq Forget Password Request
 * @apiDescription Initiate a password reset request. The user needs to provide their recovery email address. An email with an OTP will be sent if the email is associated with an account.
 * @apiPermission None
 *
 * @apiBody {String} email User's recovery email address.
 *
 * @apiSuccess {String} message Success message indicating that the OTP email was sent.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const forgetPassReq = catchError(async (req, res, next) => {
  const { recoveryEmail } = req.body;
  const user = await User.findOne({ recoveryEmail: recoveryEmail });
  if (!user)
    return next(new AppError("No Account Found With this Email.", 404));
  let otp = Math.floor(100000 + Math.random() * 900000);
  let otpExpire = addMinutesToDate(new Date(), 10);
  user.passwordResetOtp = otp;
  user.passwordResetOtpExpiry = otpExpire;
  await user.save();
  sendEmails(recoveryEmail, otp);

  res.json({ message: "OTP sent to your email." });
});

/**
 * @api {patch} /users/resetPass Reset Password
 * @apiDescription Reset the user's password using a valid OTP. The user needs to provide the new password and the OTP.
 * @apiPermission None
 *
 * @apiBody {String} recovery Email.
 * @apiBody {String} OTP.
 * @apiBody {String} newPassword New password to set.
 *
 * @apiSuccess {String} message Success message indicating that the password was reset successfully.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const resetPass = catchError(async (req, res, next) => {
  let { recoveryEmail, otp, newPassword } = req.body;
  const user = await User.findOne({ recoveryEmail: recoveryEmail });
  if (!user)
    return next(new AppError("No Account Found With this Email.", 404));
  if (
    user.passwordResetOtp !== otp ||
    Date.now() > user.passwordResetOtpExpiry
  ) {
    return next(new AppError("Invalid or expired OTP.", 404));
  }
  let hashedPassword = (newPassword = bcrypt.hashSync(newPassword, 8));
  user.password = hashedPassword;
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpiry = undefined;
  await user.save();
  res.json({ message: "Password has been reset successfully" });
});

/**
 * @api {get} /users/accByRecoveryEmail Get Accounts by Recovery Email
 * @apiDescription Retrieve all user accounts associated with a specific recovery email.
 * @apiPermission User
 *
 * @apiParam {String} recoveryEmail The recovery email address to search for associated accounts.
 *
 * @apiSuccess {Object[]} users An array of user profiles associated with the provided recovery email.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const getAccByRecovery = catchError(async (req, res, next) => {
  const { recoveryEmail } = req.query;
  if (!recoveryEmail) return next(AppError("Recovery email is required", 404));

  const users = await User.find({ recoveryEmail: recoveryEmail }).select(
    "-password"
  );

  if (users.length === 0)
    return next(AppError("No accounts found with this recovery email", 404));

  res.json({ message: "success", users });
});
export {
  signUp,
  signIn,
  updateAcc,
  deleteAcc,
  getUserData,
  getUserProfile,
  updatePassword,
  forgetPassReq,
  resetPass,
  getAccByRecovery,
};
