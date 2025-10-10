const { model, Schema } = require("mongoose");

const user_schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: true,
      select: false,
    }
  },
  { timestamps: true }
);

module.exports = model("users", user_schema);
