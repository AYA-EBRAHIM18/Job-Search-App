process.on("uncaughtException", (err) => {
  console.log("coding error", err);
});
import "dotenv/config";
import express from "express";
import { dbConnection } from "./database/dbConnection.js";
import userRouter from "./src/modules/user/user.routes.js";
import errorHandler from "./src/middleware/globalErrorHandling.js";
import { AppError } from "./src/utilities/appError.js";
import companyRouter from "./src/modules/company/company.routes.js";
import jobRouter from "./src/modules/job/job.routes.js";
import applicationRouter from "./src/modules/application/application.routes.js";
import { Application } from "./database/models/application.model.js";
const app = express();
const port = process.env.PORT || 3000;

// const jwtSecret = process.env.JWT_SECRET;
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/pdf", async (req, res, next) => {
  let pdf = await Application.find();

  //pre, post
  res.json({ message: "success", pdf });
});
app.use("/users", userRouter);
app.use("/companies", companyRouter);
app.use("/jobs", jobRouter);
app.use("/applications", applicationRouter);
app.use("*", (req, res, next) => {
  next(new AppError(`Route Not Found ${req.originalUrl}`, 404));
});
app.use(errorHandler);
process.on("unhandledRejection", (err) => {
  console.log("error", err);
});
app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
