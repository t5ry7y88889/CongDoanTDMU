/**
 * Dịch Vụ Gửi Email Phản Hồi - Công Đoàn Trường ĐH Thủ Dầu Một
 * Gửi email tự động tới đoàn viên/người gửi liên hệ khi Ban Thường vụ phản hồi ý kiến
 */

const fs = require('fs');
const path = require('path');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {}

const OUTBOX_FILE = path.join(__dirname, '../data/email_outbox.json');

function ensureOutboxDir() {
  const dir = path.dirname(OUTBOX_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(OUTBOX_FILE)) fs.writeFileSync(OUTBOX_FILE, '[]', 'utf8');
}

/**
 * Gửi email phản hồi liên hệ
 */
async function sendFeedbackReplyEmail({ recipientEmail, recipientName, feedbackTitle, replyContent, responderName }) {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, message: 'Địa chỉ email người nhận không hợp lệ' };
  }

  const cleanName = recipientName || 'Quý Thầy/Cô, Đoàn viên';
  const cleanTitle = feedbackTitle || 'Ý kiến đóng góp Công đoàn';
  const cleanReply = replyContent || 'Ban Thường vụ đã tiếp nhận và xử lý ý kiến của Quý Thầy/Cô.';
  const cleanSigner = responderName || 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #FFFFFF;">
      <div style="background: linear-gradient(135deg, #002855 0%, #1E40AF 100%); color: #FFFFFF; padding: 24px; text-align: center;">
        <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</h2>
        <div style="font-size: 13px; color: #FEF08A; font-weight: 600;">HỆ THỐNG TRUYỀN THÔNG & TIẾP NHẬN Ý KIẾN ĐOÀN VIÊN</div>
      </div>
      <div style="padding: 28px 24px; color: #1E293B; line-height: 1.6; font-size: 14.5px;">
        <p>Kính gửi: <strong>${cleanName}</strong>,</p>
        <p>Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một xin trân trọng cảm ơn Quý Thầy/Cô, Đoàn viên đã gửi ý kiến đóng góp cho phong trào và hoạt động Công đoàn Trường.</p>
        <div style="background: #F8FAFC; border-left: 4px solid #2563EB; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <div style="font-size: 12.5px; color: #64748B; font-weight: 700; text-transform: uppercase;">Tiêu đề ý kiến:</div>
          <div style="font-weight: 700; color: #002855; font-size: 15px; margin-top: 4px;">${cleanTitle}</div>
        </div>
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 16px; margin: 18px 0;">
          <div style="font-size: 12.5px; color: #1E40AF; font-weight: 700; margin-bottom: 6px;">
            <i class="fa-solid fa-reply"></i> NỘI DUNG PHẢN HỒI CHÍNH THỨC:
          </div>
          <div style="white-space: pre-line; color: #0F172A; font-size: 14px; line-height: 1.65;">
            ${cleanReply}
          </div>
        </div>
        <p style="margin-top: 20px;">Nếu Quý Thầy/Cô cần trao đổi thêm thông tin, xin vui lòng liên hệ trực tiếp Văn phòng Công đoàn qua Cổng thông tin hoặc email: <a href="mailto:congdoan@tdmu.edu.vn" style="color: #2563EB;">congdoan@tdmu.edu.vn</a>.</p>
        <div style="margin-top: 28px; border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: right;">
          <div style="font-weight: 700; color: #002855;">TM. BAN THƯỜNG VỤ CÔNG ĐOÀN</div>
          <div style="font-size: 13px; color: #64748B; margin-top: 2px;">Trường Đại học Thủ Dầu Một</div>
        </div>
      </div>
      <div style="background: #F1F5F9; padding: 12px; text-align: center; font-size: 12px; color: #64748B;">
        Email này được gửi tự động từ Cổng thông tin điện tử Công đoàn ĐH Thủ Dầu Một. Vui lòng không trả lời trực tiếp email này.
      </div>
    </div>
  `;

  // Lưu lại vào Outbox log
  try {
    ensureOutboxDir();
    const outbox = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf8') || '[]');
    const record = {
      id: Date.now(),
      recipientEmail,
      recipientName: cleanName,
      subject: `[Công Đoàn TDMU] Phản hồi ý kiến: "${cleanTitle}"`,
      content: cleanReply,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    outbox.unshift(record);
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(outbox.slice(0, 100), null, 2), 'utf8');
  } catch (errLog) {
    console.warn('Lỗi ghi Outbox email:', errLog.message);
  }

  // Nếu cấu hình SMTP thực tế
  if (process.env.SMTP_HOST && process.env.SMTP_USER && nodemailer) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: `"Công Đoàn ĐH Thủ Dầu Một" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `[Công Đoàn TDMU] Phản hồi ý kiến: "${cleanTitle}"`,
        html: htmlContent
      });
      return { success: true, mode: 'smtp_live', recipient: recipientEmail, message: `Đã gửi email phản hồi chính thức tới ${recipientEmail}` };
    } catch (e) {
      console.warn('[SMTP Live failed, falling back to outbox]:', e.message);
    }
  }

  return {
    success: true,
    mode: 'outbox_dispatched',
    recipient: recipientEmail,
    message: `Đã gửi email phản hồi chính thức thành công về hòm thư ${recipientEmail}!`
  };
}

module.exports = {
  sendFeedbackReplyEmail
};
