import Joi from "joi";

export const applyToJobValidation = Joi.object({
  jobId: Joi.string().hex().length(24).required(),
  userTechSkills: Joi.array().items(Joi.string()).required(),
  userSoftSkills: Joi.array().items(Joi.string()).required(),
  userResume: Joi.string().required(),
});
