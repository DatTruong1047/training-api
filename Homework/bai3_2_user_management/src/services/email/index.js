const nodemailer = require('nodemailer');
const crypto = require('crypto');

require('dotenv').config();


const USER_EMAIL = process.env.USER_EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;



/**
 *  Transporter
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.APP_PASSWORD, 
    },
});

const sendVerificationEmail = async (email, verificationLink) => {

    console.log(USER_EMAIL,APP_PASSWORD);

    const mailOptions = {
      from: USER_EMAIL,
      to: email,
      subject: 'Xác thực email của bạn',
      html: `<p>Vui lòng nhấp vào liên kết sau để xác thực email của bạn: <a href="${verificationLink}">${verificationLink}</a></p>`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email xác thực đã được gửi');
    } catch (error) {
      console.error('Lỗi gửi email xác thực:', error);
      throw error;
    }
  };

module.exports = {sendVerificationEmail}