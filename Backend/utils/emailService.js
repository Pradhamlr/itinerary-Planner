const nodemailer = require('nodemailer');

// Configure transporter with Gmail credentials from .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send verification code via email
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 */
const sendVerificationCode = async (email, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code - Smart Itinerary Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">Welcome to Smart Itinerary Planner!</h2>
          <p>Thank you for signing up. Please use the code below to verify your email address:</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #0891b2; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p><strong>This code expires in 10 minutes.</strong></p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Verification code sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending verification code:', error.message);
    throw new Error('Failed to send verification code');
  }
};

/**
 * Send verification email with token (legacy support)
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `http://localhost:5173/verify-email/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - Smart Itinerary Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Smart Itinerary Planner!</h2>
          <p>Thank you for signing up. Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy this link in your browser:</p>
          <p><code>${verificationUrl}</code></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending verification email:', error.message);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset code via email
 * @param {string} email - User's email address
 * @param {string} code - 6-digit reset code
 */
const sendPasswordResetCode = async (email, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code - Smart Itinerary Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">Password Reset Code</h2>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #0891b2; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p><strong>This code expires in 10 minutes.</strong></p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset code sent to ${email}`);
  } catch (error) {
    console.error('✗ Error sending password reset code:', error.message);
    throw new Error('Failed to send password reset code');
  }
};

module.exports = {
  sendVerificationCode,
  sendVerificationEmail,
  sendPasswordResetCode,
};
