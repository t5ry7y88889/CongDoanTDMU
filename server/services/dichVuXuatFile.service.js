const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const htmlToDocx = require('html-to-docx');
const cheerio = require('cheerio');

/**
 * Trợ thủ chuyển đổi các đường dẫn ảnh (URL tương đối hoặc local) sang Base64
 * để nhúng trực tiếp vào tệp PDF và Word (.docx) mà không phụ thuộc môi trường mạng
 */
function embedImagesAsBase64(htmlContent) {
  if (!htmlContent) return '';
  try {
    const $ = cheerio.load(htmlContent, null, false);
    $('img').each((_, el) => {
      let src = $(el).attr('src') || '';
      if (!src || src.startsWith('data:image/')) return;

      // Tìm vị trí tệp thực tế trên ổ đĩa
      let diskPath = null;
      if (src.startsWith('/uploads/')) {
        diskPath = path.join(__dirname, '../../public', src);
      } else if (src.startsWith('/images/')) {
        diskPath = path.join(__dirname, '../../public', src);
      } else if (src.includes('/uploads/')) {
        const sub = src.substring(src.indexOf('/uploads/'));
        diskPath = path.join(__dirname, '../../public', sub);
      } else if (src.includes('/images/')) {
        const sub = src.substring(src.indexOf('/images/'));
        diskPath = path.join(__dirname, '../../public', sub);
      } else if (!src.startsWith('http://') && !src.startsWith('https://')) {
        // Tương đối khác
        const tryPath1 = path.join(__dirname, '../../public/uploads', path.basename(src));
        const tryPath2 = path.join(__dirname, '../../Ho_So_Bai_Viet_Tieu_Chuan', path.basename(src));
        if (fs.existsSync(tryPath1)) diskPath = tryPath1;
        else if (fs.existsSync(tryPath2)) diskPath = tryPath2;
      }

      if (diskPath && fs.existsSync(diskPath)) {
        try {
          const ext = path.extname(diskPath).toLowerCase().replace('.', '') || 'jpeg';
          const mime = ext === 'jpg' ? 'image/jpeg' : (ext === 'png' ? 'image/png' : `image/${ext}`);
          const buf = fs.readFileSync(diskPath);
          const b64 = buf.toString('base64');
          $(el).attr('src', `data:${mime};base64,${b64}`);
        } catch (e) {
          console.warn('[Export embed image warning]:', e.message);
        }
      }
    });
    return $.html();
  } catch (err) {
    console.warn('[embedImagesAsBase64 Error]:', err.message);
    return htmlContent;
  }
}

/**
 * Khử trùng lặp tiêu đề H1 và Sapo trong phần thân bài viết khi xuất bản
 */
function cleanBodyForExport(bodyHtml, title, sapo) {
  if (!bodyHtml) return '';
  try {
    const $ = cheerio.load(bodyHtml, null, false);
    
    // Nếu trong body đã có thẻ h1 khớp với title, gỡ bỏ để tránh lặp 2 lần tiêu đề
    $('h1').each((_, el) => {
      const h1Text = $(el).text().trim().toLowerCase();
      const normTitle = (title || '').trim().toLowerCase();
      if (!normTitle || h1Text === normTitle || normTitle.includes(h1Text) || h1Text.includes(normTitle)) {
        $(el).remove();
      }
    });

    // Nếu trong body có thẻ p.sapo trùng với sapo truyền vào, gỡ bỏ
    if (sapo && sapo.trim()) {
      $('p.sapo, div.sapo').each((_, el) => {
        const sText = $(el).text().trim().toLowerCase();
        const normSapo = sapo.trim().toLowerCase();
        if (sText.slice(0, 50) === normSapo.slice(0, 50)) {
          $(el).remove();
        }
      });
    }

    return $.html();
  } catch {
    return bodyHtml;
  }
}

/**
 * Tạo khung HTML phong cách Báo chí Đại học hiện đại cho PDF
 * (Loại bỏ khuôn mẫu hành chính rập khuôn, tối ưu mỹ thuật tạp chí/báo chí)
 */
function buildOfficialPdfHtml({ title, sapo, bodyHtml, author = 'Ban Biên Tập Tin Bài — CĐ TDMU', date }) {
  const currentDate = date || new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const cleanedBody = cleanBodyForExport(bodyHtml, title, sapo);
  const finalBodyHtml = embedImagesAsBase64(cleanedBody);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${title || 'Bản Thảo Tin Bài Công Đoàn TDMU'}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 18mm 18mm 20mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", Times, serif;
      font-size: 11.5pt;
      line-height: 1.65;
      color: #1E293B;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
    }

    /* Masthead Tạp chí / Báo chí Hiện đại */
    .press-masthead {
      border-bottom: 2.5px solid #002855;
      padding-bottom: 12px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .masthead-brand {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .brand-org {
      font-size: 11pt;
      font-weight: 800;
      color: #002855;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0284C7;
      letter-spacing: 0.3px;
    }
    .masthead-meta {
      text-align: right;
      font-size: 9pt;
      color: #64748B;
      font-weight: 500;
    }
    .category-badge {
      display: inline-block;
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }

    /* Tiêu đề báo chí chính */
    .article-headline {
      font-size: 21pt;
      font-weight: 800;
      color: #002855;
      line-height: 1.35;
      margin: 0 0 14px 0;
      text-align: left;
    }

    /* Meta bar */
    .article-meta-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 9.5pt;
      color: #64748B;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .meta-item strong {
      color: #334155;
    }

    /* Khung tóm tắt Sapo phong cách Tạp chí */
    .article-sapo-box {
      background: #F8FAFC;
      border-left: 4px solid #0284C7;
      padding: 14px 18px;
      margin-bottom: 24px;
      border-radius: 0 6px 6px 0;
      font-size: 12.5pt;
      font-weight: 600;
      font-style: italic;
      color: #1E293B;
      line-height: 1.6;
      text-align: justify;
    }

    /* Nội dung thân bài */
    .article-body-content {
      font-size: 11.5pt;
      line-height: 1.7;
      color: #1E293B;
      text-align: justify;
    }
    .article-body-content p {
      margin: 0 0 14px 0;
    }
    .article-body-content h2 {
      font-size: 14pt;
      font-weight: 800;
      color: #002855;
      margin: 24px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #E2E8F0;
      line-height: 1.35;
      page-break-after: avoid;
    }
    .article-body-content h3 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #0369A1;
      margin: 18px 0 8px 0;
      page-break-after: avoid;
    }

    /* Ảnh phóng sự & Chú thích báo chí */
    .article-body-content figure.image,
    figure.image {
      margin: 22px auto;
      text-align: center;
      page-break-inside: avoid;
      max-width: 100%;
    }
    .article-body-content figure.image img,
    figure.image img,
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.08);
      border: 1px solid #E2E8F0;
      display: block;
      margin: 0 auto;
    }
    .article-body-content figcaption,
    figcaption {
      font-size: 9.5pt;
      font-style: italic;
      color: #475569;
      margin-top: 8px;
      text-align: center;
      line-height: 1.45;
      padding: 0 15px;
    }

    /* Bảng biểu số liệu */
    .article-body-content table,
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10.5pt;
      page-break-inside: avoid;
    }
    .article-body-content th,
    .article-body-content td,
    th, td {
      border: 1px solid #CBD5E1;
      padding: 8px 12px;
      text-align: left;
    }
    .article-body-content th,
    th {
      background: #F1F5F9;
      font-weight: 700;
      color: #0F172A;
    }
    .article-body-content tr:nth-child(even) td {
      background: #F8FAFC;
    }

    /* Chữ ký xuất bản */
    .article-footer-sign {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px dashed #CBD5E1;
      display: flex;
      justify-content: flex-end;
      text-align: right;
      page-break-inside: avoid;
    }
    .sign-box {
      font-size: 10.5pt;
      color: #334155;
    }
    .sign-box b {
      color: #002855;
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <div class="press-masthead">
    <div class="masthead-brand">
      <div class="brand-org">CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</div>
      <div class="brand-sub">CỔNG THÔNG TIN TRUYỀN THÔNG VÀ BIÊN TẬP TIN BÀI</div>
    </div>
    <div class="masthead-meta">
      Xuất bản ngày: <strong>${currentDate}</strong>
    </div>
  </div>

  <div class="category-badge">BẢN TIN HOẠT ĐỘNG PHONG TRÀO</div>

  <h1 class="article-headline">${title || 'BẢN TIN CÔNG ĐOÀN TDMU'}</h1>

  <div class="article-meta-bar">
    <div class="meta-item">📅 Ngày: <strong>${currentDate}</strong></div>
    <div class="meta-item">•</div>
    <div class="meta-item">✍️ Tác giả: <strong>${author}</strong></div>
    <div class="meta-item">•</div>
    <div class="meta-item">🏛️ Đơn vị: <strong>Đại học Thủ Dầu Một</strong></div>
  </div>

  ${sapo ? `<div class="article-sapo-box">${sapo}</div>` : ''}

  <div class="article-body-content">
    ${finalBodyHtml || '<p>Chưa có nội dung bài viết.</p>'}
  </div>

  <div class="article-footer-sign">
    <div class="sign-box">
      <b>BAN BIÊN TẬP TIN BÀI</b><br>
      <i>Công đoàn Trường Đại học Thủ Dầu Một</i>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Tạo khung HTML sạch, nhúng ảnh Base64 cho html-to-docx
 */
function buildCleanWordHtml({ title, sapo, bodyHtml, author = 'Ban Biên Tập Tin Bài — CĐ TDMU', date }) {
  const currentDate = date || new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const cleanedBody = cleanBodyForExport(bodyHtml, title, sapo);
  const finalBodyHtml = embedImagesAsBase64(cleanedBody);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p align="center"><b>CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</b></p>
  <p align="center"><i>Bình Dương, ngày ${currentDate} | Tác giả: ${author}</i></p>
  <hr />
  <h1 align="center" style="color: #002855;">${title || 'TIÊU ĐỀ BÀI VIẾT'}</h1>
  ${sapo ? `<p style="font-size: 13pt; font-style: italic; background-color: #F8FAFC;"><b>Tóm tắt Sapo:</b> ${sapo}</p>` : ''}
  <div>
    ${finalBodyHtml || '<p>Chưa có nội dung bài viết.</p>'}
  </div>
  <br /><br />
  <p align="right"><b>BAN BIÊN TẬP TIN BÀI</b><br><i>Công đoàn Trường Đại học Thủ Dầu Một</i></p>
</body>
</html>`;
}

/**
 * Xuất bài viết sang tệp Word (.docx) kèm ảnh nhúng hoàn chỉnh
 */
async function exportToWord({ title, sapo, bodyHtml, author, date }) {
  const cleanHtml = buildCleanWordHtml({ title, sapo, bodyHtml, author, date });
  
  const docxBuffer = await htmlToDocx(cleanHtml, null, {
    title: title || 'Tin bài Công đoàn TDMU',
    header: true,
    footer: true,
    font: 'Times New Roman',
    fontSize: 24 // 12pt
  });

  return docxBuffer;
}

/**
 * Xuất bài viết sang tệp PDF (.pdf) bằng Microsoft Edge Headless (Bỏ header/footer mặc định, nhúng ảnh sắc nét)
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
  // --no-pdf-header-footer: loại bỏ ngày giờ và URL in ở mép trang
  // --enable-local-file-access & --run-all-compositor-stages-before-draw: bảo đảm ảnh Base64 render 100% trước khi xuất PDF
  const cmd = `"${edgePath}" --headless --disable-gpu --no-pdf-header-footer --enable-local-file-access --run-all-compositor-stages-before-draw --print-to-pdf="${tempPdfPath}" "${tempHtmlPath}"`;

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
