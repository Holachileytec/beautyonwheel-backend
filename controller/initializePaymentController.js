const axios = require("axios");
const  Payment  = require("../models/PaymentSchema.js");

const initializePayment = async (req, res) => {
  try {
    const { amount, email, userId, bookingId, planId, paymentType } = req.body;

    // 1. Basic Validation
    if (!amount || !email || !userId || !paymentType) {
      return res.status(400).json({ message: "Missing required fields (amount, email, userId, or paymentType)" });
    }

    // 2. Initialize with Paystack
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount: Math.round(amount * 100), // Convert to Kobo
        email,
        // Optional: Tell Paystack where to send the user back to
        callback_url: "http://localhost:5173/payment-success", 
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = response.data.data;

    // 3. Create the Payment Record in your DB
    // This works for both because it takes whatever ID you provided
    await Payment.create({
      userId,
      bookingId: bookingId || null, // Saves bookingId if it exists
      planId: planId || null,       // Saves planId if it exists
      amount,
      paymentType,                  // "booking" or "subscription"
      reference: reference, 
      status: "pending",
      paymentMethod: "paystack",
      currency: "NGN",
    });
    

    // 4. Send the URL back to Frontend
    return res.status(200).json({
      message: "Payment initialized",
      data: response.data.data, 
    });

  } catch (error) {
    console.error("Paystack Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Initialization failed" });
  }
};

module.exports = { initializePayment };