import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Universal email sender
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - email html content
 */
export const sendEmail = async ({ to, subject, html }) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Email error:", error.response?.body || error.message);
  }
};