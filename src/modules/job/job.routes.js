import { Router } from "express";
import { roleVal } from "../company/company.validation.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import {
  addJob,
  updateJob,
  deleteJob,
  getJobsForCompany,
  filterJobs,
  getJobsWithCompanyInfo,
} from "./job.controllers.js";
import { validate } from "../../middleware/validate.js";
import { addJobVal, updateJobVal } from "./job.validation.js";

const jobRouter = Router();
jobRouter.get("/jobsByCom", verifyToken, getJobsForCompany);
jobRouter.get("/filter", verifyToken, filterJobs);

jobRouter.post("/", validate(addJobVal), verifyToken, roleVal, addJob);
jobRouter.put(
  "/:jobId",
  validate(updateJobVal),
  verifyToken,
  roleVal,
  updateJob
);
jobRouter.delete("/:jobId", verifyToken, roleVal, deleteJob);
jobRouter.get("/", verifyToken, getJobsWithCompanyInfo);

export default jobRouter;
