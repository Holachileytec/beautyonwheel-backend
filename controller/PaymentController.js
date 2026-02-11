const Payment = require("../models/PaymentSchema.js");
const Membership = require("../models/subscriptionSchema.js")

const createPayment = async (req, res) => {
  // create payment
  console.log("am i hiiting the APi");
  console.log("create payment reached");
  try {
    const { userId, bookingId, planId, amount, paymentMethod, currency, status, paymentType } = req.body
    if (paymentType === "booking" && !bookingId) {
      return res.status(400).json({ message: 'Booking Id is required!' })
    }
    if (paymentType === "subscription" && !planId) {
      return res.status(400).json({ message: 'Plan Id is required! ' })
    }

    const newPayment = await Payment.create({
      userId,
      bookingId,
      planId,
      amount,
      paymentType,
      paymentMethod,
      currency,
      status: status || "pending"
    });
    res.status(201).json(newPayment);
  } catch (error) {
    console.log("internal error", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
// update the payent
const updatePayment = async (req, res) => {
    // We look for 'id' (from URL params) OR 'reference' (from req.body)
    const { id } = req.params;
    const { reference, status } = req.body; 

    try {
        // Find by ID if it exists, otherwise find by the Paystack reference
        const query = id ? { _id: id } : { reference: reference };
        const payment = await Payment.findOne(query);

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found" });
        }
        payment.status = status || payment.status;
        await payment.save();

        // TRIGGER MEMBERSHIP LOGIC
        if (payment.status === "successful" && payment.paymentType === "subscription") {
            const existingMembership = await Membership.findOne({ paymentId: payment._id });
            
            if (!existingMembership) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
                
                await Membership.create({
                    user: payment.userId,
                    plan: payment.planId,
                    paymentId: payment._id,
                    endDate: endDate,
                    isActive: true
                });
                console.log("Subscription activated via Update API");
            }
        }

        res.status(200).json({ message: "Payment updated and processed", payment });
    } catch (error) {
        res.status(500).json({ message: "Update error", error: error.message });
    }
};

const getPayment = async (req, res) => {
  try {
    console.log("reached single transaction Api");
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "payment not found" });
    }
    res.json(payment);
  } catch (error) {
    console.log("error in fetching the payment", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
const getAllPayment = async (req, res) => {
  try {
    const payment = await Payment.find();
    if (!payment) {
      return res.status(404).json({ message: "payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.log("error retriving payemnt", error);
    res.status(200).json({ message: "internall server error", error });
  }
};


module.exports = { getAllPayment, getPayment, createPayment, updatePayment }
