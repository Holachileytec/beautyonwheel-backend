const Membership = require("../models/subscriptionSchema.js");
const Plan = require("../models/planSchema.js");
const User = require("../models/UserSchema.js");

// Create a new subscription/membership
const createSubscription = async (req, res) => {
  try {
    const { planId, paymentId } = req.body;
    const userId = req.userId;

    if (!planId || !paymentId) {
      return res.status(400).json({ message: "Plan ID and Payment ID are required" });
    }

    // Check if plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Membership.findOne({
      user: userId,
      isActive: true,
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: "User already has an active subscription",
        subscription: existingSubscription,
      });
    }

    // Calculate end date (30 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Create new subscription
    const newSubscription = await Membership.create({
      user: userId,
      plan: planId,
      paymentId: paymentId,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
    });

    // Update user's membership info
    await User.findByIdAndUpdate(userId, {
      membership: {
        type: plan.name,
        expiryDate: endDate,
      },
    });

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all subscriptions (Admin only)
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Membership.find()
      .populate("user", "name email phone")
      .populate("plan", "name price");

    res.status(200).json({
      message: "Subscriptions fetched successfully",
      subscriptions,
    });
  } catch (error) {
    console.error("Get all subscriptions error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get user's subscription
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await Membership.findOne({ user: userId })
      .populate("plan", "name price")
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ message: "No subscription found for this user" });
    }

    res.status(200).json({
      message: "Subscription fetched successfully",
      subscription,
    });
  } catch (error) {
    console.error("Get user subscription error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get single subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Membership.findById(id)
      .populate("user", "name email phone")
      .populate("plan", "name price");

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      message: "Subscription fetched successfully",
      subscription,
    });
  } catch (error) {
    console.error("Get subscription by ID error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update subscription (extend or change plan)
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, extendDays, isActive } = req.body;

    const subscription = await Membership.findById(id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Update plan if provided
    if (planId) {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      subscription.plan = planId;
    }

    // Extend subscription if days provided
    if (extendDays) {
      const currentEndDate = new Date(subscription.endDate);
      currentEndDate.setDate(currentEndDate.getDate() + parseInt(extendDays));
      subscription.endDate = currentEndDate;
    }

    // Update active status if provided
    if (typeof isActive === "boolean") {
      subscription.isActive = isActive;
    }

    await subscription.save();

    res.status(200).json({
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Cancel/Deactivate subscription
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Membership.findById(id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.isActive = false;
    await subscription.save();

    // Update user's membership info
    await User.findByIdAndUpdate(subscription.user, {
      membership: {
        type: "normal",
        expiryDate: null,
      },
    });

    res.status(200).json({
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete subscription (Admin only)
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Membership.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Delete subscription error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Check and update expired subscriptions
const checkExpiredSubscriptions = async (req, res) => {
  try {
    const now = new Date();

    // Find all expired but still active subscriptions
    const expiredSubscriptions = await Membership.find({
      endDate: { $lt: now },
      isActive: true,
    });

    // Deactivate them
    for (const sub of expiredSubscriptions) {
      sub.isActive = false;
      await sub.save();

      // Update user's membership
      await User.findByIdAndUpdate(sub.user, {
        membership: {
          type: "normal",
          expiryDate: null,
        },
      });
    }

    res.status(200).json({
      message: `${expiredSubscriptions.length} expired subscriptions deactivated`,
      count: expiredSubscriptions.length,
    });
  } catch (error) {
    console.error("Check expired subscriptions error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getUserSubscription,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
  checkExpiredSubscriptions,
};
