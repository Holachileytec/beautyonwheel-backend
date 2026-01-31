const multer = require ("multer");
const multerS3 = require ("multer-s3");
const s3 = require( "../config/awsConfig.js");
const dotenv = require ("dotenv");
dotenv.config();


//middleware for uploading image to aws s3 bucket
const awsUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fileName: file.filename });
    },
    key: function (req, file, cb) {
      cb(null, `beauticians/${Date.now()}_${file.originalname}`);
    },
  }),
});
module.exports=awsUpload;
