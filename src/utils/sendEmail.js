import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"E-Commerce" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

export default sendEmail;


// import nodemailer from 'nodemailer';

// const sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: false,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS
//     }
//   });

//   await transporter.sendMail({
//     from: `"E-Commerce" <${process.env.SMTP_USER}>`,
//     to,
//     subject,
//     html
//   });
// };

// export default sendEmail;
