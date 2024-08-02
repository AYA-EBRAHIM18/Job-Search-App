import { Company } from "../../../database/models/company.model.js";
import { Job } from "../../../database/models/job.model.js";
import { User } from "../../../database/models/user.model.js";
import { catchError } from "../../middleware/catchError.js";
import { AppError } from "../../utilities/appError.js";
import { Application } from "./../../../database/models/application.model.js";
import XLSX from "xlsx";

/**
 * @route POST /applications
 * @desc Apply to a job by creating a new application document.
 * @access User
 * @param {string} req.body.jobId - The ID of the job to apply for.
 * @param {Array<string>} req.body.userTechSkills - Technical skills of the user applying for the job.
 * @param {Array<string>} req.body.userSoftSkills - Soft skills of the user applying for the job.
 * @param {file} req.file - The resume file in PDF format.
 * @returns {Object} 201 - The created application document.
 * @returns {Error} 403 - Unauthorized if the user does not have the correct role.
 * @returns {Error} 404 - Not Found if the job or user is not found.
 * @returns {Error} 400 - Bad Request if required fields are missing or the resume is not a PDF.
 */
const applyToJob = catchError(async (req, res, next) => {
  const userId = req.user.userId;
  let user = await User.findById(userId);
  if (!user) return next(new AppError("User not found.", 404));
  if (!user.role.includes("User")) {
    return next(new AppError("Access denied", 403));
  }

  const job = await Job.findById(req.body.jobId);
  if (!job) return next(new AppError("Job not found", 404));

  // Create new application
  req.body.userId = userId;
  const userResume = req.file.filename;
  const applicationData = {
    jobId: req.body.jobId,
    userId: userId,
    userTechSkills: req.body.userTechSkills,
    userSoftSkills: req.body.userSoftSkills,
    userResume: userResume,
  };
  const application = await Application.insertMany(applicationData);
  res.status(201).json({ message: "success", application });
});

/**
 * @route GET /applications/export
 * @desc Collects the applications for a specific company on a specific day and creates an Excel sheet and download it auto in the same folder.
 * @param {String} companyId - The ID of the company
 * @param {String} date - The specific date (YYYY-MM-DD)
 * @access Company_HR
 */
const getApplicationsByCompanyAndDate = catchError(async (req, res, next) => {
  const { companyId, date } = req.query;

  const company = await Company.findById(companyId);
  if (!company) return next(new AppError("Company not found", 404));

  if (company.companyHR.toString() !== req.user.userId.toString())
    return next(new AppError("Access denied", 403));

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);
  const jobs = await Job.find({ addedBy: company.companyHR });
  const jobIds = jobs.map((job) => job._id);

  const applications = await Application.find({
    jobId: { $in: jobIds },
    createdAt: { $gte: startDate, $lt: endDate },
  }).populate("userId");

  if (applications.length === 0)
    return next(
      new AppError("No applications found for the specified criteria", 404)
    );

  const worksheetData = applications.map((application) => ({
    UserID: application.userId._id.toString(),
    JobID: application.jobId.toString(),
    UserTechSkills: application.userTechSkills.join(", "),
    UserSoftSkills: application.userSoftSkills.join(", "),
    ResumeURL: application.userResume,
    ApplicationDate: application.createdAt,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

  const filename = `Applications_${companyId}_${date}.xlsx`;
  XLSX.writeFile(workbook, filename);

  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.download(filename, (err) => {
    if (err) {
      res.status(500).json({ error: "Error while downloading the file" });
    }
  });
});

export { applyToJob, getApplicationsByCompanyAndDate };
