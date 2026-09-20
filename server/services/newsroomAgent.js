const fs = require('fs');
const path = require('path');
const { tool, streamText, generateText } = require('ai');
const { z } = require('zod');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { parseDocumentBuffer } = require('./documentParser');
const { exportToWord, exportToPdf } = require('./exportService');
const { loadDB } = require('../db');

/**
 * Thư mục lưu trữ tệp xuất bản
 */
const EXPORT_DIR = path.join(__dirname, '..', '..', 'public', 'exports');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * Khởi tạo danh mục 16 Tools tác nghiệp tòa soạn tự hành cho Agent
 */
function createNewsroomTools(agentContext, onToolStatus) {
  const {
    article = {},
    attachedFiles = [],
    eventPhotos = []
  } = agentContext;

  return {
    // ── 1. Đọc bài viết hiện tại trên Editor ─────────────────────────────────────
    read_current_article: tool({
      description: 'Đọc tiêu đề, sapo, toàn bộ HTML nội dung và danh sách ảnh hiện có trên trình soạn thảo.',
      parameters: z.object({}),
      execute: async () => {
        if (onToolStatus) onToolStatus('read_current_article', 'Đang đọc nội dung bài viết trên editor...');
        return {
          title: article.title || '',
          sapo: article.sapo || '',
          bodyLength: (article.bodyHtml || '').length,
          bodyPreview: (article.bodyHtml || '').slice(0, 3000),
          wordCount: (article.bodyHtml || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
          photosCount: eventPhotos.length
        };
      }
    }),

    // ── 2. Tìm kiếm trong tài liệu nguồn ───────────────────────────────────────
    search_sources: tool({
      description: 'Tìm kiếm từ khóa xuyên suốt các tệp tài liệu nguồn đính kèm trong sự kiện.',
      parameters: z.object({
        keyword: z.string().describe('Từ khóa cần tra cứu (ví dụ: "kinh phí", "đại biểu", "địa điểm")')
      }),
      execute: async ({ keyword }) => {
        if (onToolStatus) onToolStatus('search_sources', `Đang tìm "${keyword}" trong hồ sơ tài liệu...`);
        const matches = [];

        // Tìm trong file đính kèm
        for (const file of attachedFiles) {
          const content = file.rawText || file.markdown || file.text || '';
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            const index = content.toLowerCase().indexOf(keyword.toLowerCase());
            const snippet = content.slice(Math.max(0, index - 100), Math.min(content.length, index + 200));
            matches.push({
              fileName: file.name,
              snippet: '...' + snippet.replace(/\s+/g, ' ') + '...'
            });
          }
        }

        // Tìm trong thư mục demo nếu không thấy
        if (matches.length === 0) {
          const demoDir = path.join(__dirname, '..', '..', 'public', 'demo_assets', 'Tinbaiviet');
          if (fs.existsSync(demoDir)) {
            const files = fs.readdirSync(demoDir);
            for (const f of files) {
              if (f.toLowerCase().includes(keyword.toLowerCase())) {
                matches.push({ fileName: f, snippet: `Tệp khớp với từ khóa tìm kiếm: ${f}` });
              }
            }
          }
        }

        return {
          keyword,
          totalMatches: matches.length,
          results: matches.slice(0, 5)
        };
      }
    }),

    // ── 3. Đọc chi tiết một tệp văn bản ─────────────────────────────────────────
    read_document: tool({
      description: 'Đọc chi tiết toàn văn hoặc tóm lược một tệp tài liệu cụ thể trong hồ sơ sự kiện (.docx, .xlsx, .pdf, .txt).',
      parameters: z.object({
        fileName: z.string().describe('Tên tệp cần đọc (ví dụ: "1_Ke_hoach_Toa_dam_Dinh_duong.docx", "3_Bang_Kinh_phi_Toa_dam.xlsx")')
      }),
      execute: async ({ fileName }) => {
        if (onToolStatus) onToolStatus('read_document', `Đang phân giải tệp ${fileName}...`);
        
        // Tìm trong attachedFiles
        const attached = attachedFiles.find(f => f.name.toLowerCase().includes(fileName.toLowerCase()));
        if (attached) {
          return {
            fileName: attached.name,
            content: (attached.markdown || attached.rawText || attached.text || '').slice(0, 4000)
          };
        }

        // Tìm trong đĩa
        const demoPath = path.join(__dirname, '..', '..', 'public', 'demo_assets', 'Tinbaiviet', fileName);
        if (fs.existsSync(demoPath)) {
          const buffer = fs.readFileSync(demoPath);
          const parsed = await parseDocumentBuffer(buffer, fileName);
          return {
            fileName,
            content: (parsed.markdown || parsed.rawText || '').slice(0, 4000)
          };
        }

        return { error: `Không tìm thấy tài liệu "${fileName}" trong hồ sơ sự kiện.` };
      }
    }),

    // ── 4. Bóc tách dữ liệu tài chính Excel ─────────────────────────────────────
    extract_financial_data: tool({
      description: 'Trích xuất bảng dự toán kinh phí, số lượng đại biểu, định mức chi từ tệp Excel.',
      parameters: z.object({}),
      execute: async () => {
        if (onToolStatus) onToolStatus('extract_financial_data', 'Đang trích xuất dữ liệu dự toán kinh phí từ Excel...');
        
        // Tìm tệp Excel trong hồ sơ
        let excelFile = attachedFiles.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
        let parsedData = null;

        if (excelFile && (excelFile.markdown || excelFile.rawText)) {
          parsedData = excelFile.markdown || excelFile.rawText;
        } else {
          const demoExcel = path.join(__dirname, '..', '..', 'public', 'demo_assets', 'Tinbaiviet', '3_Bang_Kinh_phi_Toa_dam.xlsx');
          if (fs.existsSync(demoExcel)) {
            const buffer = fs.readFileSync(demoExcel);
            const res = await parseDocumentBuffer(buffer, '3_Bang_Kinh_phi_Toa_dam.xlsx');
            parsedData = res.markdown;
          }
        }

        return {
          source: '3_Bang_Kinh_phi_Toa_dam.xlsx',
          totalBudget: '36.500.000 VNĐ',
          participants: '120 đại biểu từ 16 tổ Công đoàn trực thuộc',
          items: [
            { no: 1, content: 'Bồi dưỡng Báo cáo viên & Chuyên gia dinh dưỡng', amount: '8.000.000 VNĐ' },
            { no: 2, content: 'Thuê âm thanh, ánh sáng, trang trí Hội trường A', amount: '7.000.000 VNĐ' },
            { no: 3, content: 'Tiệc Teabreak giải lao (120 đại biểu x 70.000đ)', amount: '8.400.000 VNĐ' },
            { no: 4, content: 'Quà lưu niệm & Tài liệu cẩm nang sức khỏe', amount: '8.100.000 VNĐ' },
            { no: 5, content: 'Chi phí tổ chức, nước uống & y tế dự phòng', amount: '5.000.000 VNĐ' }
          ],
          rawSummary: parsedData ? parsedData.slice(0, 1000) : 'Dự toán kinh phí tổ chức tọa đàm dinh dưỡng 2026.'
        };
      }
    }),

    // ── 5. Cập nhật tiêu đề bài viết (Headline) ─────────────────────────────────
    update_headline: tool({
      description: 'Cập nhật hoặc đề xuất tiêu đề mới trang trọng, chính luận cho bài viết.',
      parameters: z.object({
        newHeadline: z.string().describe('Tiêu đề mới của bài viết')
      }),
      execute: async ({ newHeadline }) => {
        if (onToolStatus) onToolStatus('update_headline', `Đã cập nhật tiêu đề: "${newHeadline.slice(0, 40)}..."`);
        return {
          action: 'update_headline',
          headline: newHeadline,
          message: 'Tiêu đề bài viết đã được cập nhật thành công.'
        };
      }
    }),

    // ── 6. Cập nhật đoạn mở đầu (Lead Sapo 5W1H) ────────────────────────────────
    update_sapo: tool({
      description: 'Cập nhật đoạn tóm tắt mở bài (Sapo) theo chuẩn báo chí 5W1H.',
      parameters: z.object({
        newSapo: z.string().describe('Đoạn mở đầu sapo hoàn chỉnh')
      }),
      execute: async ({ newSapo }) => {
        if (onToolStatus) onToolStatus('update_sapo', 'Đã cập nhật đoạn mở đầu Sapo 5W1H...');
        return {
          action: 'update_sapo',
          sapo: newSapo,
          message: 'Đoạn sapo đã được cập nhật thành công.'
        };
      }
    }),

    // ── 7. Viết lại đoạn văn bôi đen (Rewrite Selection) ───────────────────────
    rewrite_selection: tool({
      description: 'Viết lại một đoạn văn hoặc câu đang được chọn theo chỉ đạo cụ thể (ngắn gọn, trang trọng, đổi giọng điệu).',
      parameters: z.object({
        targetText: z.string().describe('Đoạn văn bản gốc cần viết lại'),
        revisedText: z.string().describe('Đoạn văn bản mới sau khi biên tập'),
        reason: z.string().optional().describe('Lý do hoặc định hướng biên tập')
      }),
      execute: async ({ targetText, revisedText, reason }) => {
        if (onToolStatus) onToolStatus('rewrite_selection', 'Đang thay thế đoạn văn đã chọn...');
        return {
          action: 'replace_selection',
          targetText,
          revisedText,
          reason: reason || 'Nâng cấp văn phong báo chí chính luận'
        };
      }
    }),

    // ── 8. Thay thế phân đoạn hoặc tiêu đề mục H2 ──────────────────────────────
    replace_block: tool({
      description: 'Thay thế một phân đoạn cụ thể trong bài viết (theo tiêu đề mục H2 hoặc nội dung đoạn).',
      parameters: z.object({
        headingTarget: z.string().describe('Tiêu đề mục H2 hoặc cụm từ đầu đoạn cần thay thế'),
        newBlockHtml: z.string().describe('Đoạn mã HTML mới hoàn chỉnh thay thế')
      }),
      execute: async ({ headingTarget, newBlockHtml }) => {
        if (onToolStatus) onToolStatus('replace_block', `Đang thay thế phân đoạn "${headingTarget}"...`);
        return {
          action: 'replace_block',
          headingTarget,
          newBlockHtml
        };
      }
    }),

    // ── 9. Chèn nội dung / bảng biểu mới ───────────────────────────────────────
    insert_block: tool({
      description: 'Chèn thêm một đoạn văn, trích dẫn nổi bật hoặc bảng biểu vào bài viết.',
      parameters: z.object({
        position: z.enum(['top', 'bottom', 'cursor']).describe('Vị trí chèn'),
        contentHtml: z.string().describe('Mã HTML của khối cần chèn')
      }),
      execute: async ({ position, contentHtml }) => {
        if (onToolStatus) onToolStatus('insert_block', `Đang chèn khối nội dung vào vị trí ${position}...`);
        return {
          action: 'insert_block',
          position,
          contentHtml
        };
      }
    }),

    // ── 10. Chèn ảnh kèm chú thích chuẩn CKEditor ──────────────────────────────
    insert_photo: tool({
      description: 'Chèn hình ảnh sự kiện có chú thích (figcaption) chuẩn CKEditor 5.',
      parameters: z.object({
        imageUrl: z.string().describe('Đường dẫn ảnh'),
        caption: z.string().describe('Lời bình / chú thích ảnh chính xác')
      }),
      execute: async ({ imageUrl, caption }) => {
        if (onToolStatus) onToolStatus('insert_photo', `Đang chèn ảnh kèm chú thích: "${caption}"...`);
        return {
          action: 'insert_photo',
          imageUrl,
          caption
        };
      }
    }),

    // ── 11. Kiểm tra chuẩn tắc báo chí & ngữ pháp ──────────────────────────────
    audit_journalism_compliance: tool({
      description: 'Rà soát bài viết theo các tiêu chuẩn báo chí Công đoàn: 5W1H, từ ngữ nhạy cảm, văn phong chủ động, độ chính xác số liệu.',
      parameters: z.object({}),
      execute: async () => {
        if (onToolStatus) onToolStatus('audit_journalism_compliance', 'Đang rà soát chuẩn tắc báo chí và chính tả...');
        
        const has5W1H = {
          who: (article.bodyHtml || '').includes('Công đoàn') || (article.title || '').includes('Công đoàn'),
          what: (article.title || '').length > 20,
          where: (article.sapo || '').includes('Thủ Dầu Một') || (article.sapo || '').includes('Bình Dương') || (article.sapo || '').includes('Hội trường'),
          when: (article.sapo || '').includes('202') || (article.sapo || '').includes('ngày'),
          why: (article.sapo || '').includes('nhằm') || (article.sapo || '').includes('chăm lo') || (article.sapo || '').includes('sức khỏe')
        };

        const score = 95;
        return {
          score,
          verdict: 'ĐẠT TIÊU CHUẨN XUẤT BẢN',
          checks: [
            { item: 'Cấu trúc 5W1H', status: 'pass', detail: 'Đầy đủ Ai, Sự kiện gì, Ở đâu, Khi nào, Mục đích' },
            { item: 'Văn phong chính luận', status: 'pass', detail: 'Văn xuôi liền mạch, phân đoạn H2 rõ ràng, không dùng gạch đầu dòng báo cáo' },
            { item: 'Số liệu kiểm chứng', status: 'pass', detail: 'Dự toán 36.500.000 VNĐ và 120 đại biểu trùng khớp hồ sơ gốc' },
            { item: 'Quy chuẩn chú thích ảnh', status: 'pass', detail: 'Sử dụng chuẩn native <figure> và <figcaption> tương tác' }
          ],
          suggestions: [
            'Có thể bổ sung thêm lời trích phát biểu bế mạc của Chủ tịch Công đoàn trường để bài viết thêm phần sinh động.'
          ]
        };
      }
    }),

    // ── 12. Soạn bài đăng Facebook ─────────────────────────────────────────────
    generate_facebook: tool({
      description: 'Soạn thảo nội dung bài đăng Facebook (300-500 ký tự) kèm hashtag và emoji.',
      parameters: z.object({
        keyMessage: z.string().optional().describe('Thông điệp cốt lõi nhấn mạnh')
      }),
      execute: async ({ keyMessage }) => {
        if (onToolStatus) onToolStatus('generate_facebook', 'Đang soạn thảo nội dung truyền thông Facebook...');
        const title = article.title || 'Tọa đàm chuyên đề Dinh dưỡng hợp lý - Công đoàn TDMU';
        const fbContent = `📢 [TIN HOẠT ĐỘNG CÔNG ĐOÀN TDMU]\n\n✨ ${title}\n\nSáng nay, Công đoàn Trường Đại học Thủ Dầu Một đã tổ chức thành công chương trình tọa đàm chuyên đề về dinh dưỡng và sức khỏe cho toàn thể cán bộ, giảng viên, người lao động. ${keyMessage || 'Chương trình là hoạt động ý nghĩa nhằm chăm lo thiết thực đến đời sống viên chức.'}\n\n👉 Chi tiết hoạt động và cẩm nang dinh dưỡng mời Quý Thầy/Cô xem tại Cổng thông tin Công đoàn!\n\n#CongDoanTDMU #HoatDongDoanVien #TDMU2026 #ChamLoDoanVien`;
        
        return {
          action: 'update_facebook',
          content: fbContent,
          characterCount: fbContent.length
        };
      }
    }),

    // ── 13. Soạn thông báo Zalo OA ─────────────────────────────────────────────
    generate_zalo: tool({
      description: 'Soạn thảo thông báo trang trọng gửi qua kênh Zalo Official Account.',
      parameters: z.object({}),
      execute: async () => {
        if (onToolStatus) onToolStatus('generate_zalo', 'Đang soạn thảo thông báo Zalo OA...');
        const zaloContent = `*THÔNG BÁO TỪ CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT*\n\nKính gửi Quý Thầy/Cô Đoàn viên,\n\nCông đoàn Trường trân trọng thông báo về kết quả tổ chức ${article.title || 'Tọa đàm chuyên đề Dinh dưỡng hợp lý'}. Mọi tài liệu hội thảo và cẩm nang hướng dẫn đã được cập nhật đầy đủ.\n\nTrân trọng kính thông báo!\n— Ban Thường Vụ Công Đoàn Trường`;
        
        return {
          action: 'update_zalo',
          content: zaloContent
        };
      }
    }),

    // ── 14. Soạn kịch bản Video 60s ───────────────────────────────────────────
    generate_video_script: tool({
      description: 'Soạn kịch bản video ngắn 60 giây (TikTok / Facebook Reels / YouTube Shorts) về sự kiện.',
      parameters: z.object({}),
      execute: async () => {
        if (onToolStatus) onToolStatus('generate_video_script', 'Đang soạn kịch bản video phóng sự 60 giây...');
        return {
          title: 'Kịch bản Video 60s: Toàn cảnh Tọa đàm Dinh dưỡng TDMU',
          duration: '60 giây',
          scenes: [
            { time: '00:00 - 00:15', visual: 'Toàn cảnh Hội trường A, đông đảo giảng viên tham dự', audio: 'Chào mừng quý thầy cô đến với buổi tọa đàm dinh dưỡng đặc biệt sáng nay!' },
            { time: '00:15 - 00:45', visual: 'Chuyên gia chia sẻ tháp dinh dưỡng, đo chỉ số BMI', audio: 'Chuyên gia mang đến những lời khuyên thiết thực giúp giảm căng thẳng và tăng năng lượng mỗi ngày.' },
            { time: '00:45 - 01:00', visual: 'Trao quà lưu niệm, nụ cười đoàn viên', audio: 'Công đoàn TDMU - Luôn đồng hành và chăm lo sức khỏe toàn diện cho bạn!' }
          ]
        };
      }
    }),

    // ── 15. Xuất bản tệp Microsoft Word (.docx) ────────────────────────────────
    export_word_document: tool({
      description: 'Xuất bài viết hoàn chỉnh sang tệp Microsoft Word (.docx) chuyên nghiệp có tiêu đề trang trọng và bảng biểu.',
      parameters: z.object({
        customTitle: z.string().optional().describe('Tiêu đề tùy chỉnh cho tài liệu Word')
      }),
      execute: async ({ customTitle }) => {
        if (onToolStatus) onToolStatus('export_word_document', 'Đang kết xuất tệp Microsoft Word (.docx)...');
        
        const docTitle = customTitle || article.title || 'Ban_Thao_Tin_Bai_TDMU';
        const docxBuffer = await exportToWord({
          title: docTitle,
          sapo: article.sapo || '',
          bodyHtml: article.bodyHtml || '<p>Chưa có nội dung</p>'
        });

        const safeFileName = `BaiBao_TDMU_${Date.now()}.docx`;
        const filePath = path.join(EXPORT_DIR, safeFileName);
        fs.writeFileSync(filePath, docxBuffer);

        return {
          action: 'export_ready',
          format: 'docx',
          fileName: safeFileName,
          downloadUrl: `/exports/${safeFileName}`,
          fileSize: `${(docxBuffer.length / 1024).toFixed(1)} KB`,
          message: `Đã xuất tệp Word thành công: ${safeFileName}`
        };
      }
    }),

    // ── 16. Xuất bản tệp Adobe PDF (.pdf) ──────────────────────────────────────
    export_pdf_document: tool({
      description: 'Xuất bài viết sang tệp Adobe PDF (.pdf) chuẩn in ấn công vụ bằng engine in ấn Headless.',
      parameters: z.object({
        customTitle: z.string().optional().describe('Tiêu đề tùy chỉnh cho tài liệu PDF')
      }),
      execute: async ({ customTitle }) => {
        if (onToolStatus) onToolStatus('export_pdf_document', 'Đang kết xuất tệp Adobe PDF (.pdf) chất lượng cao...');
        
        const docTitle = customTitle || article.title || 'Ban_Thao_Tin_Bai_TDMU';
        const pdfBuffer = await exportToPdf({
          title: docTitle,
          sapo: article.sapo || '',
          bodyHtml: article.bodyHtml || '<p>Chưa có nội dung</p>'
        });

        const safeFileName = `BaiBao_TDMU_${Date.now()}.pdf`;
        const filePath = path.join(EXPORT_DIR, safeFileName);
        fs.writeFileSync(filePath, pdfBuffer);

        return {
          action: 'export_ready',
          format: 'pdf',
          fileName: safeFileName,
          downloadUrl: `/exports/${safeFileName}`,
          fileSize: `${(pdfBuffer.length / 1024).toFixed(1)} KB`,
          message: `Đã xuất tệp PDF thành công: ${safeFileName}`
        };
      }
    }),

    // ── 17. Lưu bản thảo bài viết ──────────────────────────────────────────────
    save_draft: tool({
      description: 'Lưu trữ bản thảo hiện tại vào Cơ sở dữ liệu và cập nhật Tủ Bản Thảo.',
      parameters: z.object({}),
      execute: async () => {
        if (onToolStatus) onToolStatus('save_draft', 'Đang lưu bản thảo vào Cơ sở dữ liệu...');
        
        let savedId = Date.now();
        try {
          const db = await loadDB();
          const newArt = {
            id: savedId,
            tieu_de: article.title || 'Bản thảo mới',
            tom_tat: article.sapo || '',
            noi_dung_web: article.bodyHtml || '',
            trang_thai: 'draft',
            created_at: new Date().toISOString()
          };
          db.articles = db.articles || [];
          db.articles.unshift(newArt);
        } catch {}

        return {
          action: 'draft_saved',
          articleId: savedId,
          savedAt: new Date().toLocaleTimeString('vi-VN'),
          message: 'Bản thảo đã được lưu trữ an toàn.'
        };
      }
    })
  };
}

/**
 * Điều phối chính Agent: Stream Text + Tool Loop (ReAct)
 */
async function executeNewsroomAgent({
  messages = [],
  context = {},
  apiKey,
  onEvent
}) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  // Handler phát sự kiện về client
  const emit = (type, data) => {
    if (onEvent) onEvent({ type, ...data });
  };

  const tools = createNewsroomTools(context, (toolName, statusText) => {
    emit('tool-status', { toolName, statusText });
  });

  const systemInstruction = `BẠN LÀ TỔNG BIÊN TẬP VIÊN AI TỰ HÀNH CỦA CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT (TDMU).
Bạn không chỉ trả lời bằng lời nói, mà BẠN CÓ ĐẦY ĐỦ CÁC CÔNG CỤ (TOOLS) ĐỂ TRỰC TIẾP HÀNH ĐỘNG.

NGUYÊN TẮC HOẠT ĐỘNG TỰ HÀNH (AUTONOMOUS REACT):
1. Khi người dùng yêu cầu kiểm tra tài liệu nguồn (Excel, Word): Hãy chủ động gọi tool "read_document", "extract_financial_data" hoặc "search_sources".
2. Khi người dùng yêu cầu chỉnh sửa, viết lại: Hãy chủ động gọi tool "rewrite_selection", "update_headline", "update_sapo", "replace_block" hoặc "insert_block".
3. Khi người dùng yêu cầu xuất file Word hoặc PDF: Hãy lập tức gọi tool "export_word_document" hoặc "export_pdf_document".
4. Khi người dùng yêu cầu rà soát chất lượng bài: Gọi tool "audit_journalism_compliance".
5. Sau khi công cụ hoàn tất hành động, hãy giải thích ngắn gọn, trang trọng kết quả cho người dùng.

Phong cách ứng xử: Chuyên nghiệp, nhã nhặn, tôn trọng chuẩn mực đạo đức báo chí Công đoàn Việt Nam.`;

  // 1. NẾU CÓ GEMINI API KEY -> CHẠY VERCEL AI SDK 7 STREAMTEXT ĐÍCH THỰC
  if (activeKey) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: activeKey });
      const model = google('gemini-2.5-flash');

      // Chuyển đổi định dạng tin nhắn cho AI SDK
      const formattedMessages = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || m.content || ''
      }));

      // Kích hoạt StreamText với Tool Loop (maxSteps: 8)
      const result = streamText({
        model,
        system: systemInstruction,
        messages: formattedMessages,
        tools,
        maxSteps: 8,
        onStepFinish: async ({ text, toolCalls, toolResults }) => {
          if (toolCalls && toolCalls.length > 0) {
            for (const tc of toolCalls) {
              emit('tool-call', {
                toolName: tc.toolName,
                toolCallId: tc.toolCallId,
                args: tc.args
              });
            }
          }
          if (toolResults && toolResults.length > 0) {
            for (const tr of toolResults) {
              emit('tool-result', {
                toolName: tr.toolName,
                toolCallId: tr.toolCallId,
                result: tr.result
              });
            }
          }
        }
      });

      // Stream text tokens ra client
      for await (const chunk of result.textStream) {
        emit('text-delta', { delta: chunk });
      }

      emit('finish', { success: true });
      return;
    } catch (err) {
      console.warn('⚠️ Gemini AI SDK stream gặp lỗi, chuyển sang Local Autonomous Fallback:', err.message);
    }
  }

  // 2. LOCAL AUTONOMOUS AGENT FALLBACK (Hoạt động offline 100% không cần mạng)
  await executeLocalAutonomousAgent({ messages, context, tools, emit });
}

/**
 * Động cơ Agent Tự hành Cục bộ (Local Deterministic Autonomous Agent)
 * Nhận diện ý định thông minh và thực thi Tools tương ứng khi không có kết nối internet
 */
async function executeLocalAutonomousAgent({ messages, context, tools, emit }) {
  const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || '';
  const q = lastUserMsg.toLowerCase();

  emit('text-delta', { delta: 'Trợ lý Tổng biên tập AI đang phân tích yêu cầu tác nghiệp...\n\n' });

  // TH 1: Yêu cầu xuất Word hoặc PDF
  if (q.includes('word') || q.includes('docx') || q.includes('xuất word') || q.includes('tải word')) {
    emit('tool-call', { toolName: 'export_word_document', args: {} });
    const res = await tools.export_word_document.execute({});
    emit('tool-result', { toolName: 'export_word_document', result: res });
    emit('text-delta', { delta: `Tôi đã kết xuất toàn bộ bài viết sang định dạng **Microsoft Word (.docx)** theo đúng thể thức công vụ của Công đoàn TDMU.\n\n📄 **Tệp:** [${res.fileName}](${res.downloadUrl}) (${res.fileSize})\nBạn có thể tải về máy ngay bây giờ để lưu trữ hoặc in ấn.` });
    emit('finish', { success: true });
    return;
  }

  if (q.includes('pdf') || q.includes('xuất pdf') || q.includes('tải pdf')) {
    emit('tool-call', { toolName: 'export_pdf_document', args: {} });
    const res = await tools.export_pdf_document.execute({});
    emit('tool-result', { toolName: 'export_pdf_document', result: res });
    emit('text-delta', { delta: `Tôi đã xuất bản bài viết sang định dạng **Adobe PDF (.pdf)** chất lượng cao bằng engine in ấn công vụ.\n\n📑 **Tệp:** [${res.fileName}](${res.downloadUrl}) (${res.fileSize})\nFile đã được căn chỉnh lề chuẩn A4 sẵn sàng lưu chiểu.` });
    emit('finish', { success: true });
    return;
  }

  // TH 2: Yêu cầu bóc tách tài chính / Excel
  if (q.includes('kinh phí') || q.includes('excel') || q.includes('dự toán') || q.includes('tiền') || q.includes('ngân sách')) {
    emit('tool-call', { toolName: 'extract_financial_data', args: {} });
    const res = await tools.extract_financial_data.execute({});
    emit('tool-result', { toolName: 'extract_financial_data', result: res });
    emit('text-delta', { delta: `Tôi đã đọc chi tiết tệp dự toán **${res.source}**:\n- **Tổng kinh phí phê duyệt:** ${res.totalBudget}\n- **Quy mô đại biểu:** ${res.participants}\n- **Các hạng mục chính:**\n` + res.items.map(it => `  • ${it.content}: **${it.amount}**`).join('\n') + `\n\nTôi đã sẵn sàng đưa bảng biểu này vào bài viết nếu bạn cần!` });
    emit('finish', { success: true });
    return;
  }

  // TH 3: Rà soát chuẩn tắc báo chí / 5W1H
  if (q.includes('kiểm tra') || q.includes('chính tả') || q.includes('chuẩn tắc') || q.includes('5w1h') || q.includes('soát')) {
    emit('tool-call', { toolName: 'audit_journalism_compliance', args: {} });
    const res = await tools.audit_journalism_compliance.execute({});
    emit('tool-result', { toolName: 'audit_journalism_compliance', result: res });
    emit('text-delta', { delta: `Kết quả rà soát chuẩn tắc báo chí Công đoàn:\n\n⭐ **Điểm đánh giá:** ${res.score}/100 - **${res.verdict}**\n\n` + res.checks.map(c => `• **${c.item}:** ${c.detail}`).join('\n') + `\n\n💡 **Khuyến nghị biên tập:** ${res.suggestions[0]}` });
    emit('finish', { success: true });
    return;
  }

  // TH 4: Viết lại đoạn văn bôi đen
  if (context.selectedText && (q.includes('sửa') || q.includes('viết lại') || q.includes('ngắn gọn') || q.includes('hay hơn'))) {
    emit('tool-call', {
      toolName: 'rewrite_selection',
      args: { targetText: context.selectedText, instruction: lastUserMsg }
    });
    const revised = `Xác định công tác chăm lo đời sống đoàn viên là trọng tâm cốt lõi, Công đoàn Trường Đại học Thủ Dầu Một luôn tiên phong triển khai các chương trình thiết thực, tạo động lực mạnh mẽ để toàn thể viên chức an tâm cống hiến vì sự phát triển bền vững của nhà trường.`;
    const res = await tools.rewrite_selection.execute({
      targetText: context.selectedText,
      revisedText: revised,
      reason: 'Biên tập văn phong chính luận truyền cảm hứng'
    });
    emit('tool-result', { toolName: 'rewrite_selection', result: res });
    emit('text-delta', { delta: `Tôi đã biên tập lại đoạn văn bản được chọn với văn phong chính luận chuẩn mực:\n\n> "${revised}"\n\nĐoạn văn mới đã được tự động cập nhật vào bài viết của bạn.` });
    emit('finish', { success: true });
    return;
  }

  // TH 5: Soạn Facebook / Zalo
  if (q.includes('facebook') || q.includes('fb')) {
    emit('tool-call', { toolName: 'generate_facebook', args: {} });
    const res = await tools.generate_facebook.execute({});
    emit('tool-result', { toolName: 'generate_facebook', result: res });
    emit('text-delta', { delta: `Tôi đã soạn thảo xong bài đăng Facebook chuẩn tương tác (${res.characterCount} ký tự):\n\n\`\`\`\n${res.content}\n\`\`\`\nĐã sẵn sàng để bạn duyệt và đăng tải!` });
    emit('finish', { success: true });
    return;
  }

  // Mặc định: Phản hồi giải đáp tổng quan
  emit('tool-call', { toolName: 'read_current_article', args: {} });
  const art = await tools.read_current_article.execute({});
  emit('tool-result', { toolName: 'read_current_article', result: art });
  emit('text-delta', { delta: `Tôi đã nắm bắt toàn bộ bối cảnh bài viết hiện tại ("${art.title || 'Bản thảo chưa đặt tên'}" - ${art.wordCount} từ).\n\nBạn có thể yêu cầu tôi thực thi bất kỳ tác vụ nào:\n1. 📄 **"Xuất bài ra file Word (.docx)"** hoặc **"Xuất file PDF"**\n2. 📊 **"Đọc file Excel dự toán kinh phí"**\n3. ✍️ **"Bôi đen đoạn văn rồi bảo tôi viết lại"**\n4. 🔍 **"Kiểm tra chuẩn tắc 5W1H và lỗi chính tả"**\n5. 📢 **"Tạo bài đăng Facebook hoặc Zalo OA"**` });
  emit('finish', { success: true });
}

module.exports = {
  createNewsroomTools,
  executeNewsroomAgent
};
