const Payment = require("../models/PaymentSchema.js");
const handlePaymentWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (event.event === "charge.success") {
      const data = event.data;

      await Payment.findOneAndUpdate(
        { transactionId: data.reference },
        { status: "success" },
        { amount: data.amount / 100 },
        { new: true }
      );
    }
    res.status(200).send("Webhook received successfully", handlePaymentWebhook);
  } catch (error) {
    console.log("error in payment webhook", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
module.exports={handlePaymentWebhook}
