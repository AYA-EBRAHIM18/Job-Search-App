import { connect } from "mongoose";

export const dbConnection = connect(process.env.MONGODB_URI).then(() => {
  console.log("Database is connected successfully.");
});
