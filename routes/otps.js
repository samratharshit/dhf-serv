const express = require("express");
const router = express.Router();
const multer = require("multer");
const OTP = require("../models/otp");
const shortid = require("shortid");
const mailSender = require("./mailSender");
const {User} = require('../models/user')
const bcrypt = require('bcryptjs');


var storage = multer.memoryStorage();
var upload = multer({ storage: storage });



router.route("/sendotptovisitor").post((req, res, next) => {
    let email = req.body.email;
    let newGeneratedOTP = shortid.generate();
  
    // create the otp and mongo-related data for saving into OTP mongo schema
    let thisOTP_Mongo = {
      email: email,
      generated_otp: newGeneratedOTP
    };

    let data = "Your OTP to reset the password is:   <b>" + newGeneratedOTP+ "</b>" ;
    console.log(data);

    let otpSavedinMongo = new OTP(thisOTP_Mongo);
    otpSavedinMongo.save(async (err, newCode) => {
      try {
       mailSender(email, data);
        res.status(200).send(newCode);
      } catch (err) {
        console.log("Error while sending email is ", err);
      }
    });
  });


  router.route("/resetpwd/:id").put((req, res, next) => {
    let visitorData = req.body;
    let password = req.body.password;
    let email = req.body.email;
    let latestOtp = [];
  
  function findLatestOTP(mongoCollection, callback) {
    mongoCollection
      .find({ email: email })
      .limit(1)
      .sort({ createdAt: -1 })
      .exec((err, record) => {
        if (err) {
          console.log(err);
        } else {
          latestOtp.push(record[0].generated_otp);
          callback();
        }
      });
  }

  findLatestOTP(OTP, function() {
    if (req.body.otp !== latestOtp[0]) {
      return res
        .status(401)
        .send({ success: false, msg: "Incorrect Code was input" });
    } else {
      User.findById(req.params.id, (err, record) => {
        if (err) {
          console.log(err);
        }
        record.passwordHash = bcrypt.hashSync(password, 10);
        record.save((err, updatedRecord) => {
          if (err) {
            return next(err);
          }
          res.status(200).send(updatedRecord);
        });
      });
    }
  });
});


module.exports = router;