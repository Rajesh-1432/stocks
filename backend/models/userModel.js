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
    password: {
      type: String,
      required: true,
      select: false,
    }
  },
  { timestamps: true }
);

module.exports = model("users", user_schema);
