const createRide = async (userId, rideDetails) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");
    if (user.blockedStatus)
      throw new Error("User is blocked from publishing rides");
    if (user.suspiciousCount >= 3)
      throw new Error("User has too many suspicious activities");
    if (!user.lastRidePaymentReceived)
      throw new Error("Pending payment for the last ride");

    // Ensure at least 1-hour gap from last ride
    const lastRide = await Ride.findOne({ driver: user._id }).sort({
      date: -1,
      time: -1,
    });
    if (lastRide) {
      const lastRideTime = new Date(`${lastRide.date}T${lastRide.time}`);
      const newRideTime = new Date(`${rideDetails.date}T${rideDetails.time}`);
      if (Math.abs(newRideTime - lastRideTime) < 60 * 60 * 1000) {
        throw new Error(
          "Ride conflicts with the last ride, must have at least 1-hour gap"
        );
      }
    }

    const newRide = new Ride({ driver: user._id, ...rideDetails });
    await newRide.save();
    return { message: "Ride created successfully" };
  } catch (error) {
    throw new Error(error.message);
  }
};
module.exports = { createRide };
