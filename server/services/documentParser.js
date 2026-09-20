const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const officeParser = require('officeparser');

/**
 * =============================================================================
 * MULTI-FORMAT DOCUMENT INGESTION & FILTERING ENGINE FOR LLM / RAG PIPELINE
 * Supports: PDF, DOCX, XLSX, XLS, PPTX, CSV, TXT
 * =============================================================================
 */

// 1. VIETNAMESE FONT REPAIR & NORMALIZATION ENGINE (UNICODE NFC)
const acuteMap = {
  'a': 'á', 'A': 'Á', 'ă': 'ắ', 'Ă': 'Ắ', 'â': 'ấ', 'Â': 'Ấ',
  'e': 'é', 'E': 'É', 'ê': 'ế', 'Ê': 'Ế',
  'i': 'í', 'I': 'Í',
  'o': 'ó', 'O': 'Ó', 'ô': 'ố', 'Ô': 'Ố', 'ơ': 'ớ', 'Ơ': 'Ớ',
  'u': 'ú', 'U': 'Ú', 'ư': 'ứ', 'Ư': 'Ứ',
  'y': 'ý', 'Y': 'Ý'
};

const graveMap = {
  'a': 'à', 'A': 'À', 'ă': 'ằ', 'Ă': 'Ằ', 'â': 'ầ', 'Â': 'Ầ',
  'e': 'è', 'E': 'È', 'ê': 'ề', 'Ê': 'Ề',
  'i': 'ì', 'I': 'Ì',
  'o': 'ò', 'O': 'Ò', 'ô': 'ồ', 'Ô': 'Ồ', 'ơ': 'ờ', 'Ơ': 'Ờ',
  'u': 'ù', 'U': 'Ù', 'ư': 'ừ', 'Ư': 'Ừ',
  'y': 'ỳ', 'Y': 'Ỳ'
};

const tildeMap = {
  'a': 'ã', 'A': 'Ã', 'ă': 'ẵ', 'Ă': 'Ẵ', 'â': 'ẫ', 'Â': 'Ẫ',
  'e': 'ẽ', 'E': 'Ẽ', 'ê': 'ễ', 'Ê': 'Ễ',
  'i': 'ĩ', 'I': 'Ĩ',
  'o': 'õ', 'O': 'Õ', 'ô': 'ỗ', 'Ô': 'Ỗ', 'ơ': 'ỡ', 'Ơ': 'Ỡ',
  'u': 'ũ', 'U': 'Ũ', 'ư': 'ữ', 'Ư': 'Ữ',
  'y': 'ỹ', 'Y': 'Ỹ'
};

const hookMap = {
  'a': 'ả', 'A': 'Ả', 'ă': 'ẳ', 'Ă': 'Ẳ', 'â': 'ẩ', 'Â': 'Ẩ',
  'e': 'ẻ', 'E': 'Ẻ', 'ê': 'ể', 'Ê': 'Ể',
  'i': 'ỉ', 'I': 'Ỉ',
  'o': 'ỏ', 'O': 'Ỏ', 'ô': 'ổ', 'Ô': 'Ổ', 'ơ': 'ở', 'Ơ': 'Ở',
  'u': 'ủ', 'U': 'Ủ', 'ư': 'ử', 'Ư': 'Ử',
  'y': 'ỷ', 'Y': 'Ỷ'
};

const dotMap = {
  'a': 'ạ', 'A': 'Ạ', 'ă': 'ặ', 'Ă': 'Ặ', 'â': 'ậ', 'Â': 'Ậ',
  'e': 'ẹ', 'E': 'Ẹ', 'ê': 'ệ', 'Ê': 'Ệ',
  'i': 'ị', 'I': 'Ị',
  'o': 'ọ', 'O': 'Ọ', 'ô': 'ộ', 'Ô': 'Ộ', 'ơ': 'ợ', 'Ơ': 'Ợ',
  'u': 'ụ', 'U': 'Ụ', 'ư': 'ự', 'Ư': 'Ự',
  'y': 'ỵ', 'Y': 'Ỵ'
};

const circumflexMap = {
  'a': 'â', 'A': 'Â',
  'e': 'ê', 'E': 'Ê',
  'o': 'ô', 'O': 'Ô'
};

function fixVietnameseFont(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str.normalize('NFC');

  // Acute: ´ (U+00B4), ˊ (U+02CA)
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[´\u02CA]/g, (m, c) => acuteMap[c] || m);
  // Grave: ` (U+0060), ˋ (U+02CB)
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[`\u02CB]/g, (m, c) => graveMap[c] || m);
  // Tilde: ~ (U+007E), ˜ (U+02DC)
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[~\u02DC]/g, (m, c) => tildeMap[c] || m);
  // Hook: ˀ (U+02C0), ̉ (U+0309)
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[\u02C0\u0309]/g, (m, c) => hookMap[c] || m);
  // Dot: ̣ (U+0323)
  s = s.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])\u0323/g, (m, c) => dotMap[c] || m);
  // Circumflex: ^, ˆ (U+02C6)
  s = s.replace(/([aeoAEO])[\^ˆ]/g, (m, c) => circumflexMap[c] || m);

  // Clean stray accent marks immediately following letters
  s = s.replace(/([a-zA-ZÀ-ỹ])[´`\u02CA\u02CB]/g, '$1');

  return s.normalize('NFC');
}

// 2. DATA CLEANING & FILTERING UTILITIES
function cleanAndFilterText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Strip null bytes and non-printable control characters (except tabs and newlines)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip common repetitive page headers / footers / page numbering
  // Examples: "Trang 1/5", "Page 2 of 10", "- 1 -", "Trang 2"
  text = text.replace(/(?:^|\n)\s*(?:Trang|Page)\s+\d+(?:\s*(?:\/|of|-)\s*\d+)?\s*(?=\n|$)/gi, '\n');
  text = text.replace(/(?:^|\n)\s*-\s*\d+\s*-\s*(?=\n|$)/g, '\n');

  // Remove trailing whitespace from lines
  text = text.split('\n').map(line => line.trimEnd()).join('\n');

  // Collapse 3+ consecutive newlines into 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Fix words hyphenated across line breaks (e.g. "hoạt-\nđộng" -> "hoạt động")
  text = text.replace(/(\p{L}+)-\n(\p{L}+)/gu, '$1$2');

  // Fix decomposed / corrupt Vietnamese fonts across all ingested text
  text = fixVietnameseFont(text);

  return text.trim();
}

// 2. METADATA & ENTITY EXTRACTION HEURISTICS
function extractMetadataAndFacts(text) {
  const metadata = {
    dates: [],
    locations: [],
    budgets: [],
    organizations: [],
    signers: []
  };

  if (!text) return metadata;

  // Dates
  const dateRegex = /\b(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}|\d{1,2}\s+tháng\s+\d{1,2}(?:\s+năm\s+\d{4})?)\b/gi;
  const foundDates = text.match(dateRegex) || [];
  metadata.dates = [...new Set(foundDates)].slice(0, 5);

  // Locations
  const locRegex = /(?:tại|ở|địa điểm:?)\s+([A-ZÀ-Ỹ0-9][^,\.\n;\(\)]{3,60})/gi;
  let match;
  while ((match = locRegex.exec(text)) !== null) {
    const loc = match[1].trim();
    if (loc && !metadata.locations.includes(loc)) {
      metadata.locations.push(loc);
    }
  }
  metadata.locations = metadata.locations.slice(0, 5);

  // Budgets / Money
  const budgetRegex = /\b(?:\d{1,3}(?:[.,]\d{3})*(?:\s*(?:VNĐ|đồng|nghìn|triệu|tỷ))|\d+\s*(?:VNĐ|đồng|triệu))\b/gi;
  const foundBudgets = text.match(budgetRegex) || [];
  metadata.budgets = [...new Set(foundBudgets)].slice(0, 5);

  // Organizations
  const orgRegex = /(?:Công đoàn\s+[A-ZÀ-Ỹ0-9\s]+|Đảng ủy\s+[A-ZÀ-Ỹ0-9\s]+|Ban Giám hiệu|Ban Thường vụ|Tổ Công đoàn\s+[A-ZÀ-Ỹ0-9\s]+)/g;
  const foundOrgs = text.match(orgRegex) || [];
  metadata.organizations = [...new Set(foundOrgs.map(o => o.trim()))].slice(0, 6);

  // Signers / Officers
  const signerRegex = /(?:TS\.|ThS\.|PGS\.|GS\.|Đ\/c|Đồng chí)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4})/g;
  let signerMatch;
  while ((signerMatch = signerRegex.exec(text)) !== null) {
    const s = signerMatch[0].trim();
    if (!metadata.signers.includes(s)) metadata.signers.push(s);
  }
  metadata.signers = metadata.signers.slice(0, 4);

  return metadata;
}

// 3. IMAGE EXTRACTION & FILE PERSISTENCE HELPERS
function getImageDimensions(buf) {
  if (!buf || buf.length < 24) return null;
  // PNG: bytes 16-19 width, 20-23 height
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: scan for SOF0 (0xFFC0) or SOF2 (0xFFC2)
  for (let i = 0; i < buf.length - 8; i++) {
    if (buf[i] === 0xFF && (buf[i + 1] === 0xC0 || buf[i + 1] === 0xC2)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
  }
  return null;
}

function saveExtractedImage(imageBuffer, ext = 'png', prefix = 'doc') {
  try {
    const uploadsDir1 = path.join(__dirname, '../../public/uploads');
    const uploadsDir2 = path.join(__dirname, '../../frontend/public/uploads');
    if (!fs.existsSync(uploadsDir1)) fs.mkdirSync(uploadsDir1, { recursive: true });
    if (!fs.existsSync(uploadsDir2)) fs.mkdirSync(uploadsDir2, { recursive: true });

    const cleanExt = (ext || 'png').replace(/^\./, '').toLowerCase();
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${cleanExt}`;
    
    fs.writeFileSync(path.join(uploadsDir1, fileName), imageBuffer);
    if (fs.existsSync(path.join(__dirname, '../../frontend/public'))) {
      fs.writeFileSync(path.join(uploadsDir2, fileName), imageBuffer);
    }

    return {
      url: `/uploads/${fileName}`,
      fileName
    };
  } catch (err) {
    console.warn('[Save Extracted Image Warning]:', err.message);
    return null;
  }
}

async function extractImagesFromPdfBuffer(buffer, originalFilename = 'document.pdf', maxImages = 12) {
  const images = [];
  const seenHashes = new Set();

  // Strategy A: Direct scan for embedded JPEG streams (/Filter /DCTDecode)
  try {
    let offset = 0;
    while (offset < buffer.length - 4 && images.length < maxImages) {
      const soi = buffer.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), offset);
      if (soi === -1) break;

      let eoi = buffer.indexOf(Buffer.from([0xFF, 0xD9]), soi + 3);
      if (eoi === -1) {
        offset = soi + 3;
        continue;
      }
      eoi += 2;

      const imgBuf = buffer.slice(soi, eoi);
      if (imgBuf.length >= 2048 && imgBuf.length <= 30 * 1024 * 1024) {
        const dim = getImageDimensions(imgBuf);

        // Filter out tiny watermarks, logos, icon bullets (like CamScanner banner 240x90)
        if (dim && (dim.width < 320 || dim.height < 200 || (dim.width * dim.height < 70000))) {
          offset = eoi;
          continue;
        }

        const hash = imgBuf.slice(0, 64).toString('hex') + '_' + imgBuf.length;
        if (!seenHashes.has(hash)) {
          seenHashes.add(hash);
          const saved = saveExtractedImage(imgBuf, 'jpg', 'pdf');
          if (saved) {
            const isPortraitScan = dim ? (dim.height / dim.width >= 1.25 && dim.width >= 650 && dim.height >= 900) : false;
            images.push({
              url: saved.url,
              caption: `Ảnh ${images.length + 1} trích xuất từ tài liệu PDF: ${path.basename(originalFilename)}`,
              fileName: saved.fileName,
              width: dim ? dim.width : null,
              height: dim ? dim.height : null,
              isPortraitScan,
              buffer: imgBuf
            });
          }
        }
      }
      offset = eoi;
    }
  } catch (scanErr) {
    console.warn('[PDF Raw Scan Notice]:', scanErr.message);
  }

  // Strategy B: Use PDFParse.prototype.getImage if no raw JPEGs found
  if (images.length === 0) {
    try {
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      const res = await parser.getImage({ imageBuffer: true, imageDataUrl: true });
      if (res && res.pages) {
        for (const page of res.pages) {
          if (page.images && page.images.length > 0) {
            for (const img of page.images) {
              if (images.length >= maxImages) break;
              let imgBuf = null;
              if (img.data && img.data.length > 2048) {
                imgBuf = Buffer.from(img.data);
              } else if (img.dataUrl && img.dataUrl.length > 500) {
                const b64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
                imgBuf = Buffer.from(b64, 'base64');
              }
              if (imgBuf) {
                const dim = getImageDimensions(imgBuf);
                if (dim && (dim.width < 320 || dim.height < 200 || (dim.width * dim.height < 70000))) {
                  continue;
                }
                const saved = saveExtractedImage(imgBuf, 'png', 'pdf');
                if (saved) {
                  const isPortraitScan = dim ? (dim.height / dim.width >= 1.25 && dim.width >= 650 && dim.height >= 900) : false;
                  images.push({
                    url: saved.url,
                    caption: `Ảnh ${images.length + 1} trích xuất từ tài liệu PDF: ${path.basename(originalFilename)}`,
                    fileName: saved.fileName,
                    width: dim ? dim.width : null,
                    height: dim ? dim.height : null,
                    isPortraitScan,
                    buffer: imgBuf
                  });
                }
              }
            }
          }
        }
      }
    } catch (parseErr) {
      console.warn('[PDFParse getImage Notice]:', parseErr.message);
    }
  }

  return images;
}

// 4. SPECIALIZED FORMAT PARSERS

// 4.1 PDF Parser
async function parsePdf(buffer, originalFilename = 'document.pdf') {
  let text = '';
  let pagesCount = 1;

  // Extract text using PDFParse
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const textData = await parser.getText();
    const info = await parser.getInfo().catch(() => ({ total: 1 }));
    text = textData.text || '';
    pagesCount = textData.total || (textData.pages ? textData.pages.length : info.total || 1);
  } catch (err) {
    console.warn('[PDFParse Text Notice]:', err.message, '-> Trying officeParser fallback');
    try {
      if (typeof officeParser.parseOffice === 'function') {
        const fallbackText = await officeParser.parseOffice(buffer, { fileType: 'pdf' });
        text = fallbackText || '';
      }
    } catch (officeErr) {
      console.warn('[officeParser PDF Fallback failed]:', officeErr.message);
    }
  }

  let clean = cleanAndFilterText(text || '');
  const extractedImages = await extractImagesFromPdfBuffer(buffer, originalFilename);

  // Detect Scanned Document (image-based PDF with paper scans and little to no text layer)
  const isScannedDoc = (
    clean.length < 250 &&
    extractedImages.length > 0 &&
    extractedImages.every(img => img.isPortraitScan || (img.height && img.width && img.height > img.width))
  );

  let finalImages = [];
  let scannedPages = [];

  if (isScannedDoc) {
    // 1. This is a scanned document (Trang văn bản scan từ giấy)
    scannedPages = extractedImages.map(img => ({
      url: img.url,
      fileName: img.fileName,
      caption: `Trang scan: ${path.basename(originalFilename)}`
    }));

    // 2. Set informative scan notice for raw inspection (instant, no slow network AI blocking upload)
    if (!clean || clean.length < 50) {
      clean = `[Tài Liệu Scan]: Văn bản scan gồm ${extractedImages.length} trang giấy từ tệp "${path.basename(originalFilename)}". Toàn bộ nội dung sẽ được AI tự động đọc hiểu khi phân tích bài báo.`;
    }
    // 3. For a scanned document, DO NOT treat the black & white scanned paper pages as event photos!
    // Event photos are photos of people, ceremonies, banners. Scanned pages are document text.
    finalImages = [];
  } else {
    // Normal digital PDF with embedded illustrations / photos
    finalImages = extractedImages.map(img => ({
      url: img.url,
      caption: img.caption,
      fileName: img.fileName
    }));
  }

  // Clean memory buffers before returning
  extractedImages.forEach(img => { delete img.buffer; });

  return {
    fileType: 'pdf',
    pagesCount: isScannedDoc ? Math.max(pagesCount, extractedImages.length) : pagesCount,
    isScannedDoc,
    markdown: clean,
    rawText: clean,
    images: finalImages,
    scannedPages
  };
}

// 4.2 Word (.docx) Parser
async function parseDocx(buffer, originalFilename = 'document.docx') {
  let markdown = '';
  let rawText = '';
  const images = [];

  try {
    const options = {
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read('base64');
        const ext = (image.contentType || 'image/png').split('/')[1] || 'png';
        const saved = saveExtractedImage(Buffer.from(imageBuffer, 'base64'), ext, 'docx');
        if (saved) {
          images.push({
            url: saved.url,
            caption: `Ảnh ${images.length + 1} trích xuất từ tài liệu Word: ${path.basename(originalFilename)}`,
            fileName: saved.fileName
          });
          return { src: saved.url };
        }
        return { src: '' };
      })
    };

    const htmlResult = await mammoth.convertToHtml({ buffer }, options);
    const rawResult = await mammoth.extractRawText({ buffer });
    rawText = cleanAndFilterText(rawResult.value || '');

    // Convert basic HTML to clean structured Markdown
    let md = htmlResult.value || '';
    md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
           .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
           .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
           .replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n')
           .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
           .replace(/<em>(.*?)<\/em>/gi, '*$1*')
           .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
           .replace(/<\/ul>|<\/ol>/gi, '\n')
           .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
           .replace(/<table.*?>/gi, '\n')
           .replace(/<\/table>/gi, '\n')
           .replace(/<tr>/gi, '|')
           .replace(/<\/tr>/gi, '|\n')
           .replace(/<t[hd].*?>(.*?)<\/t[hd]>/gi, ' $1 |')
           .replace(/<[^>]*>/g, '');

    markdown = cleanAndFilterText(md);
  } catch (e) {
    try {
      if (typeof officeParser.parseOffice === 'function') {
        const parsed = await officeParser.parseOffice(buffer, { fileType: 'docx' });
        rawText = cleanAndFilterText(parsed || '');
        markdown = rawText;
      }
    } catch (oErr) {
      console.warn('[Docx Fallback Error]:', oErr.message);
    }
  }

  // Backup image extraction via JSZip if mammoth didn't catch them
  if (images.length === 0) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const mediaKeys = Object.keys(zip.files).filter(k => k.startsWith('word/media/'));
      for (const k of mediaKeys.slice(0, 10)) {
        const file = zip.files[k];
        const buf = await file.async('nodebuffer');
        if (buf.length > 2048) {
          const ext = path.extname(k).slice(1) || 'png';
          const saved = saveExtractedImage(buf, ext, 'docx');
          if (saved) {
            images.push({
              url: saved.url,
              caption: `Ảnh ${images.length + 1} trích xuất từ tài liệu Word: ${path.basename(originalFilename)}`,
              fileName: saved.fileName
            });
          }
        }
      }
    } catch (zipErr) {}
  }

  return {
    fileType: 'docx',
    markdown: markdown || rawText,
    rawText,
    images
  };
}

// 4.3 Excel (.xlsx, .xls, .csv) Parser
function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames || [];
  let fullMarkdown = '';
  let fullRawText = '';
  const sheetsDetail = [];

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    const nonEmptyRows = rows.filter(r => Array.isArray(r) && r.some(cell => cell !== null && cell !== ''));
    if (nonEmptyRows.length === 0) continue;

    sheetsDetail.push({
      name: sheetName,
      rowCount: nonEmptyRows.length,
      colCount: nonEmptyRows[0] ? nonEmptyRows[0].length : 0
    });

    fullMarkdown += `### Bảng: ${sheetName}\n\n`;

    const previewRows = nonEmptyRows.slice(0, 100);
    if (previewRows.length > 0) {
      const headerRow = previewRows[0].map(cell => String(cell).replace(/\|/g, '\\|').trim() || '-');
      fullMarkdown += `| ${headerRow.join(' | ')} |\n`;
      fullMarkdown += `| ${headerRow.map(() => '---').join(' | ')} |\n`;

      for (let i = 1; i < previewRows.length; i++) {
        const rowCells = previewRows[i].map(cell => String(cell).replace(/\|/g, '\\|').trim());
        while (rowCells.length < headerRow.length) rowCells.push('');
        fullMarkdown += `| ${rowCells.slice(0, headerRow.length).join(' | ')} |\n`;
        fullRawText += rowCells.join(' ') + '\n';
      }
      fullMarkdown += '\n';
      if (nonEmptyRows.length > 100) {
        fullMarkdown += `*(Đã hiển thị 100/${nonEmptyRows.length} dòng dữ liệu của bảng)*\n\n`;
      }
    }
  }

  return {
    fileType: 'xlsx',
    sheetsCount: sheetNames.length,
    sheetsDetail,
    markdown: fullMarkdown.trim(),
    rawText: fullRawText.trim(),
    images: []
  };
}

// 4.4 PowerPoint (.pptx) Parser
async function parsePptx(buffer, originalFilename = 'document.pptx') {
  let slideMarkdown = '';
  let slidesCount = 1;
  const images = [];

  try {
    const zip = await JSZip.loadAsync(buffer);

    // 1. Extract slide texts in order
    const slideFiles = Object.keys(zip.files)
      .filter(k => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0], 10);
        const numB = parseInt(b.match(/\d+/)[0], 10);
        return numA - numB;
      });

    slidesCount = Math.max(1, slideFiles.length);
    let slideIdx = 1;

    for (const sf of slideFiles) {
      const xml = await zip.files[sf].async('string');
      const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
      const texts = matches.map(m => m.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
      if (texts.length > 0) {
        slideMarkdown += `#### Phân cảnh / Slide ${slideIdx}:\n` + texts.join(' ') + '\n\n';
      }
      slideIdx++;
    }

    // 2. Extract embedded images from ppt/media/
    const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith('ppt/media/'));
    for (const k of mediaFiles.slice(0, 10)) {
      const file = zip.files[k];
      const buf = await file.async('nodebuffer');
      if (buf.length > 2048) {
        const ext = path.extname(k).slice(1) || 'png';
        const saved = saveExtractedImage(buf, ext, 'pptx');
        if (saved) {
          images.push({
            url: saved.url,
            caption: `Ảnh ${images.length + 1} trích xuất từ slide thuyết trình: ${path.basename(originalFilename)}`,
            fileName: saved.fileName
          });
        }
      }
    }

  } catch (zipErr) {
    console.warn('[JSZip PPTX parsing notice]:', zipErr.message, '-> Trying officeParser');
    try {
      if (typeof officeParser.parseOffice === 'function') {
        const parsedText = await officeParser.parseOffice(buffer, { fileType: 'pptx' });
        slideMarkdown = cleanAndFilterText(parsedText || '');
      }
    } catch (oErr) {
      console.warn('[officeParser PPTX Fallback failed]:', oErr.message);
    }
  }

  const clean = cleanAndFilterText(slideMarkdown || '');

  return {
    fileType: 'pptx',
    slidesCount,
    markdown: clean,
    rawText: clean,
    images
  };
}

// 5. MAIN INGESTION DISPATCHER
async function parseDocumentBuffer(buffer, originalFilename = 'document.txt') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Dữ liệu tệp không hợp lệ hoặc rỗng!');
  }

  const ext = path.extname(originalFilename || '').toLowerCase();
  let result;

  if (ext === '.pdf') {
    result = await parsePdf(buffer, originalFilename);
  } else if (ext === '.docx' || ext === '.doc') {
    result = await parseDocx(buffer, originalFilename);
  } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    result = parseExcel(buffer);
  } else if (ext === '.pptx' || ext === '.ppt') {
    result = await parsePptx(buffer, originalFilename);
  } else {
    const text = cleanAndFilterText(buffer.toString('utf-8'));
    result = {
      fileType: 'txt',
      markdown: text,
      rawText: text,
      images: []
    };
  }

  const metadata = extractMetadataAndFacts(result.rawText || result.markdown);

  return {
    success: true,
    fileName: path.basename(originalFilename),
    fileExt: ext,
    fileType: result.fileType,
    fileSizeKB: (buffer.length / 1024).toFixed(1),
    charCount: (result.markdown || '').length,
    pagesCount: result.pagesCount || null,
    sheetsCount: result.sheetsCount || null,
    slidesCount: result.slidesCount || null,
    isScannedDoc: !!result.isScannedDoc,
    markdown: result.markdown,
    rawText: result.rawText,
    images: result.images || [],
    scannedPages: result.scannedPages || [],
    metadata
  };
}

module.exports = {
  fixVietnameseFont,
  cleanAndFilterText,
  extractMetadataAndFacts,
  saveExtractedImage,
  extractImagesFromPdfBuffer,
  parseDocumentBuffer,
  parsePdf,
  parseDocx,
  parseExcel,
  parsePptx
};
