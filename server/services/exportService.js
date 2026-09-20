const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const htmlToDocx = require('html-to-docx');

/**
 * Tạo khung HTML phong phú cho PDF (chuẩn A4 công vụ)
 */
function buildOfficialPdfHtml({ title, sapo, bodyHtml, author = 'Ban Truyền thông Công đoàn TDMU', date }) {
  const currentDate = date || new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${title || 'Bản Thảo Tin Bài Công Đoàn TDMU'}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 20mm 20mm 25mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #111827;
      margin: 0;
      padding: 10px;
    }
    .official-header {
      width: 100%;
      margin-bottom: 25px;
      border-bottom: 2px solid #002855;
      padding-bottom: 12px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
    }
    .header-left {
      text-align: center;
      width: 45%;
      font-size: 11pt;
      font-weight: bold;
      color: #002855;
      line-height: 1.3;
    }
    .header-right {
      text-align: center;
      width: 55%;
      font-size: 11pt;
      font-weight: bold;
      line-height: 1.3;
    }
    .header-right .motto {
      font-style: italic;
      font-weight: normal;
      font-size: 11pt;
    }
    .article-title {
      font-size: 18pt;
      font-weight: bold;
      color: #002855;
      text-align: center;
      margin: 25px 0 15px 0;
      line-height: 1.35;
      text-transform: uppercase;
    }
    .article-meta {
      text-align: center;
      font-style: italic;
      color: #4B5563;
      font-size: 11pt;
      margin-bottom: 20px;
    }
    .article-sapo {
      font-size: 13pt;
      font-weight: bold;
      font-style: italic;
      line-height: 1.6;
      background: #F8FAFC;
      border-left: 4px solid #0284C7;
      padding: 12px 18px;
      margin-bottom: 24px;
      border-radius: 4px;
      text-align: justify;
    }
    .article-body {
      font-size: 13pt;
      line-height: 1.6;
      text-align: justify;
    }
    .article-body h2 {
      font-size: 15pt;
      color: #002855;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 4px;
    }
    .article-body h3 {
      font-size: 13.5pt;
      color: #0369A1;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    .article-body p {
      margin-bottom: 14px;
      text-indent: 1.25cm;
    }
    .article-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 11.5pt;
    }
    .article-body th, .article-body td {
      border: 1px solid #CBD5E1;
      padding: 8px 12px;
      text-align: left;
    }
    .article-body th {
      background: #F1F5F9;
      font-weight: bold;
      color: #0F172A;
    }
    .article-body figure.image {
      margin: 24px auto;
      text-align: center;
    }
    .article-body figure.image img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .article-body figcaption {
      font-size: 10.5pt;
      font-style: italic;
      color: #475569;
      margin-top: 6px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="official-header">
    <table class="header-table">
      <tr>
        <td class="header-left">
          CÔNG ĐOÀN TRƯỜNG ĐH THỦ DẦU MỘT<br>
          <span style="font-weight: normal; font-size: 10pt;">BAN TRUYỀN THÔNG & ĐOÀN VIÊN</span>
        </td>
        <td class="header-right">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <span class="motto">Độc lập - Tự do - Hạnh phúc</span>
        </td>
      </tr>
    </table>
  </div>

  <div class="article-title">${title || 'TIÊU ĐỀ BÀI VIẾT'}</div>
  <div class="article-meta">Bình Dương, ngày ${currentDate} | Nguồn: ${author}</div>

  ${sapo ? `<div class="article-sapo">${sapo}</div>` : ''}

  <div class="article-body">
    ${bodyHtml || '<p>Chưa có nội dung bài viết.</p>'}
  </div>

  <table style="width: 100%; border: none; margin-top: 40px;">
    <tr>
      <td style="border: none; width: 50%;"></td>
      <td style="border: none; width: 50%; text-align: center; font-size: 12pt;">
        <b>TM. BAN THƯỜNG VỤ CÔNG ĐOÀN</b><br>
        <i>(Đã duyệt lưu chiểu)</i><br><br><br><br>
        <b>Ban Biên Tập Tin Bài TDMU</b>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Tạo khung HTML sạch, không chứa CSS xung đột XML cho html-to-docx
 */
function buildCleanWordHtml({ title, sapo, bodyHtml, author = 'Ban Truyền thông Công đoàn TDMU', date }) {
  const currentDate = date || new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p align="center"><b>CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</b></p>
  <p align="center"><i>Bình Dương, ngày ${currentDate}</i></p>
  <hr />
  <h1 align="center">${title || 'TIÊU ĐỀ BÀI VIẾT'}</h1>
  ${sapo ? `<blockquote><b>Tóm tắt Sapo:</b> <i>${sapo}</i></blockquote>` : ''}
  <div>
    ${bodyHtml || '<p>Chưa có nội dung bài viết.</p>'}
  </div>
  <br /><br />
  <p align="right"><b>TM. BAN THƯỜNG VỤ CÔNG ĐOÀN</b><br><i>${author}</i></p>
</body>
</html>`;
}

/**
 * Xuất bài viết sang tệp Word (.docx)
 */
async function exportToWord({ title, sapo, bodyHtml, author, date }) {
  const cleanHtml = buildCleanWordHtml({ title, sapo, bodyHtml, author, date });
  
  const docxBuffer = await htmlToDocx(cleanHtml, null, {
    title: title || 'Tin bài Công đoàn TDMU',
    header: true,
    footer: true,
    font: 'Times New Roman',
    fontSize: 26 // 13pt
  });

  return docxBuffer;
}

/**
 * Xuất bài viết sang tệp PDF (.pdf) bằng Microsoft Edge Headless
 */
async function exportToPdf({ title, sapo, bodyHtml, author, date }) {
  const fullHtml = buildOfficialPdfHtml({ title, sapo, bodyHtml, author, date });
  const exportDir = path.join(__dirname, '..', '..', 'public', 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = Date.now();
  const tempHtmlPath = path.join(exportDir, `temp_${timestamp}.html`);
  const tempPdfPath = path.join(exportDir, `export_${timestamp}.pdf`);

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${tempPdfPath}" "${tempHtmlPath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error) => {
      // Dọn tệp HTML tạm
      try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch {}

      if (error) {
        return reject(error);
      }

      if (!fs.existsSync(tempPdfPath)) {
        return reject(new Error('Tệp PDF không được tạo thành công'));
      }

      try {
        const pdfBuffer = fs.readFileSync(tempPdfPath);
        fs.unlinkSync(tempPdfPath);
        resolve(pdfBuffer);
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  buildOfficialPdfHtml,
  buildCleanWordHtml,
  exportToWord,
  exportToPdf
};
