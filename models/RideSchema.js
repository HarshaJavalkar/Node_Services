const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  rideId: { type: String, unique: true, default: () => nanoid(10) },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  vehicle: { type: VehicleSchema, required: true },
  costPerSeat: { type: Number, required: true },
  plusPoints: [{ type: String }],
  availableSeats: {
    coDriver: { type: Boolean, default: true },
    rearLeft: { type: Boolean, default: true },
    rearRight: { type: Boolean, default: true },
    rearCenter: { type: Boolean, default: true },
  },
  bookedSeats: [
    {
      passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      seatType: {
        type: String,
        enum: ["coDriver", "rearLeft", "rearRight", "rearCenter"],
      },
      bookedAt: { type: Date, default: Date.now },
      otpConfirmed: { type: Boolean, default: false },
      pickupCoordinates: { type: { lat: Number, lng: Number } },
      dropCoordinates: { type: { lat: Number, lng: Number } },
    },
  ],
});
const Ride = mongoose.model("Ride", RideSchema, "rides");
module.exports = { Ride };
