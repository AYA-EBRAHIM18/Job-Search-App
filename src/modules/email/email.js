import nodemailer from "nodemailer";
import { emailHtml } from "./emailHtml.js";

// import jwt from "jsonwebtoken";
export const sendEmails = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "aya.ebrahim1824@gmail.com",
      pass: "xzgjbeuxvxdbnhjd",
    },
  });
  const info = await transporter.sendMail({
    from: '"Route course 😊" <aya.ebrahim1824@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello!!", // plain text body
    html: emailHtml(otp),
  });
};
