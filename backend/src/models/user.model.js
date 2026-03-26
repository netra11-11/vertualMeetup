import { Schema } from "mongoose";
import mongoose from "mongoose";
const userSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    token: { type: String },
});

const User = mongoose.model("User", userSchema);
export { User };