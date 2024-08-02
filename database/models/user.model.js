import { model, Schema } from "mongoose";
import { AppError } from "../../src/utilities/appError.js";

const schema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    recoveryEmail: {
      type: String,
      required: false,
    },
    DOB: {
      type: Date,
      required: true,
    },
    mobileNumber: {
      type: String,
      unique: true,
      required: true,
    },
    role: {
      type: String,
      enum: ["User", "Company_HR"],
      required: true,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    passwordResetOtp: String,
    passwordResetOtpExpiry: Date,
  },
  {
    timestamps: { updatedAt: false },
    versionKey: false,
  }
);

export const User = model("User", schema);
