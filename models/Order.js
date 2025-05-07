const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    email: String,
    name: String,
    address: String,
    cart: Array,
    date: String,
    status: String,
});

module.exports = mongoose.model("Order", orderSchema);
