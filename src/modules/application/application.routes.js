import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import {
  applyToJob,
  getApplicationsByCompanyAndDate,
} from "./application.controllers.js";
import { applyToJobValidation } from "./application.validation.js";
import { uploadSingleFile } from "../../fileUpload/fileUpload.js";
import { roleVal } from "../company/company.validation.js";

const applicationRouter = Router();

applicationRouter.post(
  "/",
  //! validate(applyToJobValidation),
  verifyToken,
  uploadSingleFile("userResume"),
  applyToJob
);
applicationRouter.get(
  "/export",
  verifyToken,
  roleVal,
  getApplicationsByCompanyAndDate
);

export default applicationRouter;
