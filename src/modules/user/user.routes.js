import { Router } from "express";
import {
  deleteAcc,
  forgetPassReq,
  getUserData,
  getUserProfile,
  signIn,
  signUp,
  updateAcc,
  updatePassword,
  resetPass,
  getAccByRecovery,
} from "./user.controllers.js";
import { validate } from "../../middleware/validate.js";
import {
  signInVal,
  signUpVal,
  updatePasswordVal,
  updateVal,
} from "./user.validation.js";
import { checkEmail } from "./../../middleware/checkEmail.js";
import { verifyToken } from "./../../middleware/verifyToken.js";

const userRouter = Router();
userRouter.get("/accByRecoveryEmail", getAccByRecovery);

userRouter.post("/signUp", validate(signUpVal), checkEmail, signUp);
userRouter.post("/signIn", validate(signInVal), signIn);
userRouter.put(
  "/updatePass",
  validate(updatePasswordVal),
  verifyToken,
  updatePassword
);

userRouter.put("/updateAcc", validate(updateVal), verifyToken, updateAcc);
userRouter.delete("/", verifyToken, deleteAcc);
userRouter.get("/", verifyToken, getUserData);
userRouter.get("/:userId", getUserProfile);
userRouter.post("/forgetPassReq", forgetPassReq);
userRouter.post("/resetPass", resetPass);

export default userRouter;
