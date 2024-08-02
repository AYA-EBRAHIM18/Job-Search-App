import { model, Schema } from "mongoose";

const schema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userTechSkills: {
      type: [String],
      required: true,
    },
    userSoftSkills: {
      type: [String],
      required: true,
    },
    userResume: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { updatedAt: false },
    versionKey: false,
  }
);
schema.post("init", function (doc) {
  if (doc.userResume) {
    doc.userResume = "http://localhost:3000/uploads/" + doc.userResume;
  }
});

export const Application = model("Application", schema);
