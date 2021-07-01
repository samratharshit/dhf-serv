const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let otpSchema = new Schema(
	{
		email: { type: String },
		generated_otp: { type: String }
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("Otp", otpSchema);