import { Router } from "express";
import {
  addCompany,
  deleteCompany,
  getApplicationByJob,
  getCompanyData,
  searchCompany,
  updateComData,
} from "./company.controllers.js";
import { addCompanyVal, roleVal, updateComVal } from "./company.validation.js";
import { validate } from "../../middleware/validate.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const companyRouter = Router();

companyRouter.post(
  "/addCompany",
  validate(addCompanyVal),
  verifyToken,
  roleVal,
  addCompany
);
companyRouter.put(
  "/:companyId",
  validate(updateComVal),
  verifyToken,
  roleVal,
  updateComData
);
companyRouter.delete("/:companyId", verifyToken, roleVal, deleteCompany);
companyRouter.get(
  "/getComData/:companyId",
  verifyToken,
  roleVal,
  getCompanyData
);
companyRouter.get("/searchCompany", verifyToken, searchCompany);
companyRouter.get(
  "/getApplications/:jobId",
  verifyToken,
  roleVal,
  getApplicationByJob
);
export default companyRouter;
