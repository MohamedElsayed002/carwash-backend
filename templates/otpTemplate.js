export const otpTemplate = (otp) => `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #4CAF50; padding: 20px; color: white; text-align: center;">
      <h2>OTP Verification</h2>
    </div>
    <div style="padding: 20px; text-align: center;">
      <p style="font-size: 16px; color: #333;">Use the following OTP to verify your email:</p>
      <h1 style="letter-spacing: 5px; color: #4CAF50;">${otp}</h1>
      <p style="font-size: 14px; color: #666;">This OTP will expire in <b>10 minutes</b>.</p>
    </div>
    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      &copy; ${new Date().getFullYear()} ToDo App. All rights reserved.
    </div>
  </div>
`;
