import { AppError } from "../utilities/appError.js";

export const validate = (schema) => {
  return async (req, res, next) => {
    let { error } = schema.validate({ ...req.body }, { abortEarly: false });

    if (!error) {
      next();
    } else {
      let errMsgs = error.details.map((err) => err.message);

      next(new AppError(errMsgs, 404));
    }
  };
};
