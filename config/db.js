const mongoose = require ("mongoose");



// Database connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.mongodb_url);
    console.log(`MongoDb connected sucessfully: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};
module.exports=  connectDB;
