const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const {
  logActivity
} = require("./activities");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| TEMPORARY OTP STORE
|--------------------------------------------------------------------------
|
| Demo only.
| Use Redis/DB for production.
|
|--------------------------------------------------------------------------
*/

let otpStore = {};
// {
//   phone: {
//     otp: "123456",
//     expiresAt: 1690000000000
//   }
// }

/*
|--------------------------------------------------------------------------
| HELPER: GENERATE OTP
|--------------------------------------------------------------------------
*/

function generateOTP() {
  return Math.floor(
    100000 +
    Math.random() * 900000
  ).toString();
}

/*
|--------------------------------------------------------------------------
| STEP 1: REQUEST OTP
|--------------------------------------------------------------------------
*/

router.post(
  "/request",
  async (req, res) => {
    const {
      number
    } = req.body;

    if (!number) {
      return res.status(400).json({
        message:
          "Phone number is required"
      });
    }

    const otp =
      generateOTP();

    const expiresAt =
      Date.now() +
      2 *
        60 *
        1000;

    otpStore[number] = {
      otp,
      expiresAt
    };

    console.log(
      `✅ Simulated OTP for ${number}: ${otp}`
    );

    res.json({
      success: true,

      message:
        "OTP generated successfully (check backend console)"
    });
  }
);

/*
|--------------------------------------------------------------------------
| STEP 2: VERIFY OTP
|--------------------------------------------------------------------------
*/

router.post(
  "/verify",
  async (req, res) => {
    const {
      number,
      otp
    } = req.body;

    if (
      !number ||
      !otp
    ) {
      return res.status(400).json({
        message:
          "Phone number and OTP are required"
      });
    }

    const record =
      otpStore[number];

    if (!record) {
      return res.status(400).json({
        message:
          "OTP not found or expired"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | OTP EXPIRY
    |--------------------------------------------------------------------------
    */

    if (
      record.expiresAt <
      Date.now()
    ) {
      delete otpStore[number];

      return res.status(400).json({
        message:
          "OTP expired"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | OTP VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      record.otp !== otp
    ) {
      return res.status(400).json({
        message:
          "Invalid OTP"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | OTP VERIFIED
    |--------------------------------------------------------------------------
    */

    delete otpStore[number];

    try {
      /*
      |--------------------------------------------------------------------------
      | FETCH USER
      |--------------------------------------------------------------------------
      */

      const user =
        await User.findOne({
          phone: number
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found. Please register first."
        });
      }

      /*
      |--------------------------------------------------------------------------
      | GENERATE JWT
      |--------------------------------------------------------------------------
      */

      const token =
        jwt.sign(
          {
            id:
              user._id,

            phone:
              user.phone
          },

          process.env.JWT_SECRET ||
            "farmai_secret",

          {
            expiresIn:
              "1h"
          }
        );

      /*
      |--------------------------------------------------------------------------
      | GAMIFICATION LOGIN
      |--------------------------------------------------------------------------
      |
      | Important:
      | This runs only after OTP has been successfully
      | verified and the actual user has been found.
      |
      | A gamification error must NEVER prevent
      | successful OTP login.
      |
      |--------------------------------------------------------------------------
      */

      try {
        await logActivity(
          user._id,
          {
            activityType:
              "login",

            title:
              "FarmAI Login",

            description:
              "Logged in successfully to FarmAI using OTP.",

            status:
              "completed",

            result:
              "OTP login successful",

            metadata: {
              method:
                "otp"
            }
          }
        );
      } catch (
        activityError
      ) {
        console.error(
          "OTP login gamification error:",
          activityError
        );
      }

      /*
      |--------------------------------------------------------------------------
      | RETURN USER DATA
      |--------------------------------------------------------------------------
      */

      const userResponse = {
        _id:
          user._id,

        fullName:
          user.fullName,

        phone:
          user.phone,

        preferredLanguage:
          user.preferredLanguage,

        farmLocation:
          user.farmLocation,

        state:
          user.state,

        district:
          user.district,

        pincode:
          user.pincode,

        crops:
          user.crops,

        farmingType:
          user.farmingType,

        profilePhoto:
          user.profilePhoto
      };

      /*
      |--------------------------------------------------------------------------
      | SUCCESS RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({
        success: true,

        message:
          "OTP verified successfully!",

        token,

        user:
          userResponse
      });
    } catch (err) {
      console.error(
        "OTP verification error:",
        err
      );

      return res.status(500).json({
        message:
          "Server error"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
  router;