import sendEmail from "../../utils/sendEmail.js";

export const contactus = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // ✅ Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "جميع الحقول مطلوبة",
            });
        }

        // ✅ Send email
        await sendEmail({
            to: process.env.EMAIL_USER,
            subject: "رسالة جديدة من صفحة التواصل",
            html: `
        <div style="font-family:Arial; line-height:1.6">
          <h2>رسالة جديدة</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>البريد:</strong> ${email}</p>
          <p><strong>الرسالة:</strong></p>
          <p>${message}</p>
        </div>
      `,
        });

        // ✅ Always respond
        return res.status(200).json({
            success: true,
            message: "تم إرسال الرسالة بنجاح",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء الإرسال",
        });
    }
};
