const crypto = require("crypto");

const verifyPaystackSignature = (req) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body) // req.body is raw buffer now
    .digest("hex");

  return hash === req.headers["x-paystack-signature"];
};

module.exports = verifyPaystackSignature;
