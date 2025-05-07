const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cart: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: Number }]
});

module.exports = mongoose.model("User", userSchema);
