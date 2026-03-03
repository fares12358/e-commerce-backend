import nodemailer from "nodemailer";
import notificationModel from "../modules/notification/notification.model.js";

const sendEmail = async ({ to, subject, html }) => {
  try {
    const settings = await notificationModel.findOne();
    if (!settings) return;

    if (!settings.email || !settings.appPassword) return;

    let transporter;

    /* =============================
       CASE 1: SMTP Server Enabled
       ============================= */
    if (settings.SmtpServer) {
      if (!settings.host || !settings.port) {
        console.log("SMTP enabled but host/port missing");
        return;
      }

      transporter = nodemailer.createTransport({
        host: settings.host,
        port: Number(settings.port),
        secure: settings.secure, // true for 465, false for 587
        auth: {
          user: settings.email,
          pass: settings.appPassword,
        },
      });
    }

    /* =============================
       CASE 2: Default Provider (Gmail etc)
       ============================= */
    else {
      transporter = nodemailer.createTransport({
        service: "gmail", // تقدر تغيرها لو حاب
        auth: {
          user: settings.email,
          pass: settings.appPassword,
        },
      });
    }

    await transporter.sendMail({
      from: `"E-Commerce" <${settings.email}>`,
      to,
      subject,
      html,
    });

  } catch (error) {
    console.error("Email send error:", error.message);
  }
};

export default sendEmail;