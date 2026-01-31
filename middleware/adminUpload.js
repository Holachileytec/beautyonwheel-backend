const multer = require ("multer");

//middleware for uploading image to local server

const localStorage = multer.diskStorage({
  destination: function (req, File, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
 const localUpload = multer({ storage: localStorage });
module.exports=localUpload;
