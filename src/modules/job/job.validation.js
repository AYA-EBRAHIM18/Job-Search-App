import Joi from "joi";

const addJobVal = Joi.object({
  jobTitle: Joi.string().min(2).max(100).required(),
  jobLocation: Joi.string().valid("onsite", "remotely", "hybrid").required(),
  workingTime: Joi.string().valid("part-time", "full-time").required(),
  seniorityLevel: Joi.string()
    .valid("Junior", "Mid-Level", "Senior", "Team-Lead", "CTO")
    .required(),
  jobDescription: Joi.string().min(10).required(),
  technicalSkills: Joi.array().items(Joi.string()),
  softSkills: Joi.array().items(Joi.string()),
  addedBy: Joi.string().hex().length(24),
});

const updateJobVal = Joi.object({
  jobTitle: Joi.string().min(2).max(100),
  jobLocation: Joi.string().valid("onsite", "remotely", "hybrid"),
  workingTime: Joi.string().valid("part-time", "full-time"),
  seniorityLevel: Joi.string().valid(
    "Junior",
    "Mid-Level",
    "Senior",
    "Team-Lead",
    "CTO"
  ),
  jobDescription: Joi.string().min(10),
  technicalSkills: Joi.array().items(Joi.string()),
  softSkills: Joi.array().items(Joi.string()),
  addedBy: Joi.string().hex().length(24),
});

export { addJobVal, updateJobVal };
