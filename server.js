const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Environment variables
const SECRET = process.env.JWT_SECRET || "fallback-secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const PORT = process.env.PORT || 3000;

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 MongoDB connected");
  } catch (err) {
    console.error("🔴 MongoDB connection error:", err.message);
    process.exit(1);
  }
};
connectDB();

// Mongoose schemas
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  image: String,
  category: String,
});

const orderSchema = new mongoose.Schema({
  email: String,
  name: String,
  address: String,
  cart: Array,
  date: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" },
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Models
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);
const User = mongoose.model("User", userSchema);

// API Endpoints

// Get all products
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Checkout: create an order
app.post("/api/checkout", async (req, res) => {
  const { name, email, address, cart } = req.body;
  if (!email) return res.status(401).json({ error: "User must be logged in to place an order" });
  await Order.create({ name, email, address, cart });
  res.status(200).json({ message: "Order placed" });
});

// Get user's orders
app.get("/api/orders", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    const orders = await Order.find({ email: decoded.email });
    res.json(orders);
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Admin: Get all orders
app.get("/api/admin/orders", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: "Access denied" });
    }
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Admin: Update order status
app.put("/api/admin/orders/:id/status", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.email !== ADMIN_EMAIL) return res.status(403).json({ error: "Access denied" });

    const { status } = req.body;
    if (!status || !["Pending", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Admin: Edit order name and address
app.put("/api/admin/orders/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.email !== ADMIN_EMAIL) return res.status(403).json({ error: "Access denied" });

    const { name, address } = req.body;
    if (!name || !address) return res.status(400).json({ error: "Name and address required" });

    await Order.findByIdAndUpdate(req.params.id, { name, address });
    res.json({ message: "Order updated successfully" });
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});

// User Registration
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashedPassword });
  res.status(201).json({ message: "User registered successfully" });
});

// User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const expiresIn = email === ADMIN_EMAIL ? "24h" : "1h";
  const token = jwt.sign({ email }, SECRET, { expiresIn });
  res.json({ token });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
