const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, unique: true, default: () => nanoid(10) },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  plateNumber: { type: String, required: true, unique: true },
  condition: {
    type: String,
    enum: ["Excellent", "Good", "Fair", "Poor"],
    required: true,
  },
  isVerified: { type: Boolean, required: false },
});

const Vehicle = mongoose.model("Vehicle", VehicleSchema, "vehicles");
module.exports = { Vehicle };
