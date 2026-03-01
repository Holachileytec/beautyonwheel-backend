const Payment = require("../models/PaymentSchema.js");
const Membership = require("../models/subscriptionSchema.js");
const { verifyPaystackSignature } = require("../services/paystack.service");

// CREATE PAYMENT
const createPayment = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      planId,
      amount,
      paymentMethod,
      currency,
      paymentType,
    } = req.body;

    // VALIDATION
    if (!userId || !amount) {
      return res.status(400).json({ message: "userId and amount are required" });
    }

    if (paymentType === "booking" && !bookingId) {
      return res.status(400).json({ message: "Booking Id is required for booking payments" });
    }

    if (paymentType === "subscription" && !planId) {
      return res.status(400).json({ message: "Plan Id is required for subscription payments" });
    }

    const newPayment = await Payment.create({
      userId,
      bookingId: bookingId || null,
      planId: planId || null,
      amount,
      paymentType,
      paymentMethod: paymentMethod || "paystack",
      currency: currency || "NGN",
      status: "pending",
    });

    res.status(201).json({ message: "Payment created", payment: newPayment });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// PAYSTACK WEBHOOK
const paystackWebhook = async (req, res) => {
  try {
    const isValid = verifyPaystackSignature(req);
    if (!isValid) {
      console.log("❌ Invalid Paystack signature");
      return res.sendStatus(400);
    }

    const event = JSON.parse(req.body.toString());
    console.log("📩 Paystack Event:", event.event);

    // Handle successful charge
    if (event.event === "charge.success") {
      const { reference, amount, customer } = event.data;

      const payment = await Payment.findOne({ reference });
      if (payment) {
        payment.status = "successful";
        await payment.save();

        console.log("✅ Payment successful:", reference, "Amount:", amount / 100, "Email:", customer.email);

        // Activate subscription if paymentType is subscription
        if (payment.paymentType === "subscription") {
          const existingMembership = await Membership.findOne({ paymentId: payment._id });
          if (!existingMembership) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            await Membership.create({
              user: payment.userId,
              plan: payment.planId,
              paymentId: payment._id,
              endDate,
              isActive: true,
            });
            console.log("Subscription activated via webhook");
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};

// UPDATE PAYMENT
const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { reference, status } = req.body;

  try {
    const query = id ? { _id: id } : { reference };
    const payment = await Payment.findOne(query);

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    payment.status = status || payment.status;
    await payment.save();

    // Activate subscription if successful
    if (payment.status === "successful" && payment.paymentType === "subscription") {
      const existingMembership = await Membership.findOne({ paymentId: payment._id });
      if (!existingMembership) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await Membership.create({
          user: payment.userId,
          plan: payment.planId,
          paymentId: payment._id,
          endDate,
          isActive: true,
        });
        console.log("Subscription activated via Update API");
      }
    }

    res.status(200).json({ message: "Payment updated", payment });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// GET SINGLE PAYMENT
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// GET ALL PAYMENTS
const getAllPayment = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json(payments);
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  createPayment,
  paystackWebhook,
  updatePayment,
  getPayment,
  getAllPayment,
};
