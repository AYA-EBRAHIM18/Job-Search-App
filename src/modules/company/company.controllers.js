import { Application } from "../../../database/models/application.model.js";
import { Job } from "../../../database/models/job.model.js";
import { User } from "../../../database/models/user.model.js";
import { catchError } from "../../middleware/catchError.js";
import { AppError } from "../../utilities/appError.js";
import { Company } from "./../../../database/models/company.model.js";

/**
 * @api {post}  /companies/addCompany Add Company
 * @apiDescription Add a new company. Only users with the role 'Company_HR' can perform this action.
 * @apiPermission Company_HR
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiBody {String} companyName The name of the company.
 * @apiBody {String} description A description of the company's activities and services.
 * @apiBody {String} industry The industry the company belongs to.
 * @apiBody {String} address The address of the company.
 * @apiBody {String} numberOfEmployees The range of the number of employees in the company.
 * @apiBody {String} companyEmail The email address of the company.
 * @apiBody {String} companyHR The user ID of the HR responsible for the company.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} company The newly created company data.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */ const addCompany = catchError(async (req, res, next) => {
  req.body.companyHR = req.user.userId;
  let company = await Company.insertMany(req.body);

  res.status(201).json({ message: "success", company });
});

/**
 * @api {patch} /companies/:companyId Update Company Data
 * @apiDescription Update company data. Only the owner of the company (Company_HR) can update the data.
 * @apiPermission Joi Validation updateComVal
 * @apiPermission Company_HR
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiParam {String} companyId The ID of the company to update.
 *
 * @apiBody {String} [companyName] The name of the company.
 * @apiBody {String} [description] A description of the company's activities and services.
 * @apiBody {String} [industry] The industry the company belongs to.
 * @apiBody {String} [address] The address of the company.
 * @apiBody {String} [numberOfEmployees] The range of the number of employees in the company.
 * @apiBody {String} [companyEmail] The email address of the company.
 * @apiBody {String} [companyHR] The user ID of the HR responsible for the company.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} company The updated company data.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const updateComData = catchError(async (req, res, next) => {
  const { companyId } = req.params;

  let company = await Company.findById(companyId);
  if (!company) return next(new AppError("Company not found", 404));

  if (company.companyHR.toString() !== req.user.userId.toString()) {
    return next(new AppError("Access denied", 403));
  }

  company = await Company.findByIdAndUpdate(companyId, req.body, {
    new: true,
  });

  res.status(200).json({ message: "Success", company });
});

/**
 * @api {delete} /companies/:companyId Delete Company Data
 * @apiDescription Delete company data. Only the owner of the company (Company_HR) can delete the data.
 * @apiPermission Company_HR
 * @apiHeader {String} Authorization Bearer token for authentication.
 *
 * @apiParam {String} companyId The ID of the company to delete.
 *
 * @apiSuccess {String} message Success message.
 *
 * @apiError {String} message Error:company message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const deleteCompany = catchError(async (req, res, next) => {
  const { companyId } = req.params;

  let company = await Company.findById(companyId);
  if (!company) return next(new AppError("Company not found", 404));

  if (company.companyHR.toString() !== req.user.userId.toString()) {
    return next(new AppError("Access denied", 403));
  }
  const jobs = await Job.find({ addedBy: company.companyHR });

  if (!jobs) return console.log(jobs);
  const jobIds = jobs.map((job) => job._id);
  await Application.deleteMany({ jobId: { $in: jobIds } });
  await Job.deleteMany({ addedBy: company.companyHR });

  await Company.findByIdAndDelete(companyId);

  res.status(200).json({ message: "Company deleted successfully" });
});

/**
 * @api {get} /companies/getComData/:companyId Get Company Data
 * @apiDescription Get data of a specific company by its ID with its jobs. Only users with the role 'Company_HR' can perform this action.
 * @apiPermission Company_HR
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiParam {String} companyId The ID of the company to retrieve.
 *
 * @apiSuccess {Object} company The company data with jobs.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */

const getCompanyData = catchError(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await Company.findById(companyId);
  if (!company) return next(new AppError("Company not found", 404));

  if (company.companyHR.toString() !== req.user.userId.toString()) {
    return next(new AppError("Access denied", 403));
  }
  const jobs = await Job.find({ addedBy: company.companyHR });

  const companyData = {
    ...company.toObject(),
    jobs,
  };
  res.status(200).json({ message: "Success", companyData });
});

/**
 * @api {get} /companies/searchCompany Search for a Company by Name
 * @apiDescription Search for a company by its name. Available for users with the role 'Company_HR' or 'User'.
 * @apiPermission Company_HR, User
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiParam {String} name The name of the company to search for.
 *
 * @apiSuccess {Object[]} companies An array of companies that match the search criteria.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */
const searchCompany = catchError(async (req, res, next) => {
  const { name } = req.query;

  if (!name) {
    return next(new AppError("Company name query parameter is required", 400));
  }
  const companies = await Company.find({
    companyName: { $regex: new RegExp(name, "i") },
  });
  if (companies.length == 0) return next(new AppError("Not Found", 404));

  res.status(200).json({ message: "Success", companies });
});

/**
 * @api {get} /companies/getApplications/:jobId Get All Applications for Specific Job
 * @apiDescription Get all applications for a specific job posted by a company HR. Only the company HR can access this data.
 * @apiPermission Company_HR
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiParam {String} jobId The ID of the job to get applications for.
 *
 * @apiSuccess {Object[]} applications An array of applications for the specified job, each with user data.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */

const getApplicationByJob = catchError(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found", 404));

  if (job.addedBy.toString() !== req.user.userId.toString()) {
    return next(new AppError("Access denied", 403));
  }

  const applications = await Application.find({ jobId }).select("-userId");

  if (!applications.length)
    return next(new AppError("No applications found for this job", 404));
  res.status(200).json({ message: "success", applications });
});

export {
  addCompany,
  updateComData,
  deleteCompany,
  getCompanyData,
  searchCompany,
  getApplicationByJob,
};
