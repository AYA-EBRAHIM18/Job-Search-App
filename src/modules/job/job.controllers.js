import { Application } from "../../../database/models/application.model.js";
import { Company } from "../../../database/models/company.model.js";
import { Job } from "../../../database/models/job.model.js";
import { User } from "../../../database/models/user.model.js";
import { catchError } from "../../middleware/catchError.js";
import { AppError } from "../../utilities/appError.js";

/**
 * @route POST /jobs
 * @desc Add a new job to the database.
 * @access Company_HR
 * @param {string} req.body.jobTitle - The title of the job.
 * @param {string} req.body.jobLocation - The location of the job (e.g., 'onsite', 'remotely', 'hybrid').
 * @param {string} req.body.workingTime - The working time (e.g., 'part-time', 'full-time').
 * @param {string} req.body.seniorityLevel - The seniority level of the job (e.g., 'Junior', 'Mid-Level', 'Senior').
 * @param {string} req.body.jobDescription - A detailed description of the job responsibilities and requirements.
 * @param {Array<string>} req.body.technicalSkills - An array of required technical skills.
 * @param {Array<string>} req.body.softSkills - An array of required soft skills.
 * @param {string} req.body.addedBy - The ID of the Company HR who is adding this job.
 * @returns {Object} 201 - The created job document.
 * @returns {Error} 403 - Unauthorized if the user does not have the correct role.
 * @returns {Error} 400 - Bad Request if required fields are missing or invalid.
 */
const addJob = catchError(async (req, res, next) => {
  req.body.addedBy = req.user.userId;
  const job = await Job.insertMany(req.body);
  res.status(201).json({ message: "success", job });
});

/**
 * @route PUT /jobs/:jobId
 * @desc Update the details of a specific job.
 * @access Company_HR
 * @param {string} req.params.jobId - The ID of the job to be updated.
 * @param {string} [req.body.jobTitle] - The new title of the job (optional).
 * @param {string} [req.body.jobLocation] - The new location of the job (e.g., 'onsite', 'remotely', 'hybrid') (optional).
 * @param {string} [req.body.workingTime] - The new working time (e.g., 'part-time', 'full-time') (optional).
 * @param {string} [req.body.seniorityLevel] - The new seniority level of the job (e.g., 'Junior', 'Mid-Level', 'Senior') (optional).
 * @param {string} [req.body.jobDescription] - The new description of the job responsibilities and requirements (optional).
 * @param {Array<string>} [req.body.technicalSkills] - An array of new required technical skills (optional).
 * @param {Array<string>} [req.body.softSkills] - An array of new required soft skills (optional).
 * @returns {Object} 200 - The updated job document.
 * @returns {Error} 403 - Unauthorized if the user does not have the correct role.
 * @returns {Error} 404 - Not Found if the job with the specified ID does not exist.
 */
const updateJob = catchError(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new AppError("Job not found", 404));
  const updatedJob = await Job.findByIdAndUpdate(req.params.jobId, req.body, {
    new: true,
  });

  res.status(200).json({ message: "success", updatedJob });
});

/**
 * @route DELETE /jobs/:jobId
 * @desc Delete a specific job from the database with applications.
 * @access Company_HR
 * @param {string} params.jobId - The ID of the job to be deleted.
 * @returns {Object} 200 - Success message indicating that the job has been deleted.
 * @returns {Error} 403 - Unauthorized if the user does not have the correct role.
 * @returns {Error} 404 - Not Found if the job with the specified ID does not exist.
 */
const deleteJob = catchError(async (req, res, next) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found", 404));
  if (job.addedBy.toString() !== req.user.userId.toString())
    return next(new AppError("Access Denied not owner", 403));
  const deletedJob = await Job.findByIdAndDelete(jobId);
  await Application.deleteMany({ jobId });

  res.status(200).json({ message: "success", deletedJob });
});

/**
 * @api {get} /jobs Get All Jobs with Company Information
 * @apiDescription Get all jobs with their associated company information.
 * @apiPermission User, Company_HR
 * @apiHeader {String} Authorization token for authentication.
 *
 * @apiSuccess {Object[]} jobs Array of job objects with company information.
 *
 * @apiError {String} message Error message indicating what went wrong.
 * @apiError {Number} statusCode HTTP status code corresponding to the error.
 */

const getJobsWithCompanyInfo = catchError(async (req, res, next) => {
  const jobs = await Job.find();

  const jobsWithCompanyInfo = [];

  for (const job of jobs) {
    const companyHR = await User.findById(job.addedBy).select("companyHR");
    if (!companyHR) {
      return next(new AppError("Company HR not found", 404));
    }
    const company = await Company.findOne({ companyHR: companyHR._id });

    jobsWithCompanyInfo.push({
      ...job.toObject(),
      company: company
        ? {
            companyName: company.companyName,
            description: company.description,
            industry: company.industry,
            address: company.address,
            numberOfEmployees: company.numberOfEmployees,
            companyEmail: company.companyEmail,
          }
        : null,
    });
  }
  res.status(200).json({ message: "success", jobsWithCompanyInfo });
});

/**
 * @route GET /jobs/jobsByCom
 * @desc Retrieve all jobs associated with a specific company.
 * @access User, Company_HR
 * @param {string} req.query.companyName - The name of the company whose jobs are to be retrieved.
 * @returns {Object[]} 200 - A list of job documents associated with the specified company.
 * @returns {Error} 403 - Unauthorized if the user does not have the correct role.
 * @returns {Error} 404 - Not Found if no jobs are found for the specified company.
 */
const getJobsForCompany = catchError(async (req, res, next) => {
  const { companyName } = req.query;
  const company = await Company.findOne({ companyName });
  if (!company) return next(new AppError("Company not found", 404));

  const jobs = await Job.find({ addedBy: company.companyHR });
  if (jobs.length == 0)
    return next(new AppError("No jobs added by this company.", 404));

  res.status(201).json({ message: "success", jobs });
});

/**
 * @route GET /jobs/filter
 * @desc Retrieve all jobs that match the specified filters.
 * @access User, Company_HR
 * @param {string} [req.query.workingTime] - Filter by the working time of the job (e.g., 'part-time', 'full-time').
 * @param {string} [req.query.jobLocation] - Filter by the job location (e.g., 'onsite', 'remotely', 'hybrid').
 * @param {string} [req.query.seniorityLevel] - Filter by the seniority level of the job (e.g., 'Junior', 'Mid-Level', 'Senior').
 * @param {string} [req.query.jobTitle] - Filter by the job title.
 * @param {string[]} [req.query.technicalSkills] - Filter by an array of required technical skills.
 * @returns {Object[]} 200 - A list of job documents that match the specified filters.
 * @returns {Error} 403 - Unauthorized if the user does not have the correct role.
 * @returns {Error} 400 - Bad Request if the provided filters are invalid.
 */
const filterJobs = catchError(async (req, res, next) => {
  const {
    workingTime,
    jobLocation,
    seniorityLevel,
    jobTitle,
    technicalSkills,
  } = req.query;

  let filter = {};

  if (workingTime) filter.workingTime = workingTime;
  if (jobLocation) filter.jobLocation = jobLocation;
  if (seniorityLevel) filter.seniorityLevel = new RegExp(seniorityLevel, "i");
  if (jobTitle) filter.jobTitle = new RegExp(jobTitle, "i");
  if (technicalSkills)
    filter.technicalSkills = { $in: technicalSkills.split(",") };

  const jobs = await Job.find(filter);
  if (jobs.length == 0) return next(new AppError("No Result", 404));
  res.status(200).json({ message: "success", jobs });
});
export {
  addJob,
  updateJob,
  deleteJob,
  getJobsForCompany,
  filterJobs,
  getJobsWithCompanyInfo,
};
