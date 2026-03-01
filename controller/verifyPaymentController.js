const axios = require("axios");
const Payment = require("../models/PaymentSchema.js");
const Membership = require("../models/subscriptionSchema.js");
const {
  createNotification,
} = require("../controller/notificationController.js");

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params; // Usually passed in URL

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    if (response.data.data.status === "success") {
      // Instead of writing update logic again, we just call a helper or
      // perform the update right here using the logic we built
      const payment = await Payment.findOne({ reference });
      if (payment) {
        payment.status = "successful";
        await payment.save();

        // Trigger Membership (Copy-paste the Membership.create logic here or move to a shared function)
        // ... (Membership creation code) ...
        if (
          payment.status === "successful" &&
          payment.paymentType === "subscription"
        ) {
          const existingMembership = await Membership.findOne({
            paymentId: payment._id,
          });

          if (!existingMembership) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            await Membership.create({
              user: payment.userId,
              plan: payment.planId,
              paymentId: payment._id,
              endDate: endDate,
              isActive: true,
            });
            console.log("Subscription activated via Update API");
          }
        }
        if (
          payment.status === "successful" &&
          payment.paymentType === "booking"
        ) {
          await createNotification(
            req.user.id,
            "Booking Successful!",
            "Your Payment was successful. You have successfully booked a service with us!",
          );
        } else if (
          payment.status === "successful" &&
          payment.paymentType === "subscription"
        ) {
          await createNotification(
            req.user.id,
            "Subscription Activated!",
            `You have successfully subscribed to our membership. Your subscription is only valid for 30 days.`,
          );
        }

        return res.status(200).json({ success: true, message: "Verified" });
      }
    }
    res.status(400).json({ success: false, message: "Payment failed" });
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

module.exports = { verifyPayment };
