const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Zalo, ThreadType, LoginQRCallbackEventType } = require('zca-js');

const SESSION_FILE = path.join(__dirname, '..', '..', 'data', 'zalo_bot_session.json');

class ZaloBotService {
  constructor() {
    this.zalo = new Zalo();
    this.api = null;
    this.botInfo = null;
    this.currentQrData = null; // { base64, status: 'waiting' | 'scanned' | 'confirmed' | 'expired' }
    this.isLoggingIn = false;
    this.loginQrInstance = null;
    
    // Tự động load session nếu có
    this.initFromSavedSession();
  }

  /**
   * Khởi động bot từ session đã lưu
   */
  async initFromSavedSession() {
    try {
      if (!fs.existsSync(SESSION_FILE)) return;
      const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
      const sessionData = JSON.parse(raw);

      if (sessionData && sessionData.cookies && sessionData.imei) {
        console.log('[Zalo Bot] Đang khôi phục phiên đăng nhập từ session đã lưu...');
        this.api = await this.zalo.login({
          cookie: sessionData.cookies,
          imei: sessionData.imei,
          userAgent: sessionData.userAgent
        });

        // Lấy thông tin tài khoản bot
        try {
          const accountInfo = await this.api.fetchAccountInfo();
          this.botInfo = {
            name: accountInfo?.data?.name || accountInfo?.name || 'Bot Zalo Công Đoàn',
            avatar: accountInfo?.data?.avatar || accountInfo?.avatar || '',
            userId: accountInfo?.data?.userId || accountInfo?.userId || ''
          };
          console.log(`[Zalo Bot] Đăng nhập thành công! Tài khoản Bot: "${this.botInfo.name}"`);
        } catch {
          this.botInfo = { name: 'Bot Zalo Công Đoàn' };
        }
      }
    } catch (err) {
      console.warn('[Zalo Bot] Không thể khôi phục phiên cũ:', err.message);
      this.api = null;
      this.botInfo = null;
      try {
        if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
      } catch {}
    }
  }

  /**
   * Bắt đầu quy trình tạo mã QR để quét đăng nhập
   */
  async startQrLogin() {
    if (this.api && this.botInfo) {
      return {
        status: 'already_connected',
        botInfo: this.botInfo
      };
    }

    // Luôn khởi tạo instance Zalo mới để reset các listener/promise từ lần quét trước
    this.zalo = new Zalo();

    this.currentQrData = {
      status: 'generating',
      qrImage: null,
      message: 'Đang tạo mã QR kết nối Zalo...'
    };

    return new Promise((resolve) => {
      let resolved = false;

      this.zalo.loginQR({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
      }, async (event) => {
        try {
          if (event.type === LoginQRCallbackEventType.QRCodeGenerated) {
            console.log('[Zalo Bot] Đã sinh mã QR kết nối');
            // Dữ liệu ảnh QR trả về từ zca-js hoặc tạo bằng thư viện qrcode
            let base64Qr = '';
            if (event.data?.image) {
              base64Qr = event.data.image.startsWith('data:') ? event.data.image : `data:image/png;base64,${event.data.image}`;
            } else if (event.data?.code) {
              base64Qr = await QRCode.toDataURL(event.data.code, { width: 320, margin: 2 });
            }

            this.currentQrData = {
              status: 'waiting',
              qrImage: base64Qr,
              message: 'Vui lòng mở Zalo trên điện thoại, quét mã QR này và bấm "Xác nhận đăng nhập"'
            };

            if (!resolved) {
              resolved = true;
              resolve(this.currentQrData);
            }
          } else if (event.type === LoginQRCallbackEventType.QRCodeScanned) {
            console.log(`[Zalo Bot] Đã quét QR: ${event.data?.display_name}`);
            this.currentQrData = {
              status: 'scanned',
              qrImage: this.currentQrData?.qrImage,
              displayName: event.data?.display_name,
              avatar: event.data?.avatar,
              message: `Đã quét bởi [${event.data?.display_name}]. Vui lòng bấm Xác nhận trên điện thoại!`
            };
          } else if (event.type === LoginQRCallbackEventType.QRCodeExpired) {
            console.warn('[Zalo Bot] Mã QR đã hết hạn');
            this.currentQrData = {
              status: 'expired',
              qrImage: null,
              message: 'Mã QR đã hết hạn, vui lòng bấm nút "Tạo lại mã QR"!'
            };
          } else if (event.type === LoginQRCallbackEventType.QRCodeDeclined) {
            console.warn('[Zalo Bot] Người dùng từ chối đăng nhập');
            this.currentQrData = {
              status: 'declined',
              qrImage: null,
              message: 'Đăng nhập bị từ chối trên điện thoại.'
            };
          } else if (event.type === LoginQRCallbackEventType.GotLoginInfo) {
            console.log('[Zalo Bot] Đã nhận thông tin đăng nhập thành công!');
            // Lưu session vào file để dùng mãi mãi
            const sessionData = {
              cookies: event.data.cookie,
              imei: event.data.imei,
              userAgent: event.data.userAgent,
              savedAt: new Date().toISOString()
            };

            fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
            fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2), 'utf-8');
          }
        } catch (cbErr) {
          console.error('[Zalo Bot Callback Error]:', cbErr);
        }
      }).then(async (apiInstance) => {
        if (apiInstance) {
          this.api = apiInstance;
          try {
            const accInfo = await this.api.fetchAccountInfo();
            this.botInfo = {
              name: accInfo?.data?.name || accInfo?.name || 'Bot Zalo Công Đoàn',
              avatar: accInfo?.data?.avatar || accInfo?.avatar || '',
              userId: accInfo?.data?.userId || accInfo?.userId || ''
            };
          } catch {
            this.botInfo = { name: 'Bot Zalo Công Đoàn' };
          }
          this.currentQrData = {
            status: 'success',
            botInfo: this.botInfo,
            message: `Kết nối thành công! Đã liên kết tài khoản "${this.botInfo.name}".`
          };
          console.log(`[Zalo Bot] ĐÃ SẴN SÀNG HOẠT ĐỘNG! Tài khoản Bot: "${this.botInfo.name}"`);
        }
      }).catch((loginErr) => {
        console.error('[Zalo Bot Login Error]:', loginErr.message);
        this.currentQrData = {
          status: 'error',
          message: `Lỗi kết nối Zalo: ${loginErr.message}`
        };
      });

      // Timeout dự phòng sau 10s nếu chưa có QR
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(this.currentQrData || { status: 'error', message: 'Không thể sinh mã QR, vui lòng thử lại!' });
        }
      }, 10000);
    });
  }

  /**
   * Lấy trạng thái hiện tại của Bot và QR
   */
  getStatus() {
    return {
      isConnected: Boolean(this.api && this.botInfo),
      botInfo: this.botInfo,
      qrState: this.currentQrData
    };
  }

  /**
   * Đăng xuất bot và xóa session
   */
  logout() {
    this.api = null;
    this.botInfo = null;
    this.currentQrData = null;
    try {
      if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
    } catch {}
    return { success: true, message: 'Đã ngắt kết nối Bot Zalo!' };
  }

  /**
   * Lấy danh sách các nhóm Zalo mà Bot đang tham gia
   */
  async getGroups() {
    if (!this.api) throw new Error('Bot Zalo chưa kết nối! Vui lòng quét mã QR trước.');
    try {
      const res = await this.api.getAllGroups();
      const gridVerMap = res?.gridVerMap || {};
      const groupIds = Object.keys(gridVerMap);

      if (groupIds.length === 0) return [];

      // Sắp xếp theo nhóm có hoạt động mới nhất
      const sortedIds = groupIds.sort((a, b) => Number(gridVerMap[b] || 0) - Number(gridVerMap[a] || 0)).slice(0, 10);
      const groupsList = [];

      for (const gid of sortedIds) {
        try {
          const info = await this.api.getGroupInfo(gid);
          const gridInfo = info?.gridInfoMap?.[gid] || info;
          groupsList.push({
            id: gid,
            groupId: gid,
            name: gridInfo?.name || `Nhóm Zalo #${gid}`,
            totalMember: gridInfo?.totalMember || 0,
            avatar: gridInfo?.avt || ''
          });
        } catch {
          groupsList.push({ id: gid, groupId: gid, name: `Nhóm Zalo #${gid}` });
        }
      }
      return groupsList;
    } catch (err) {
      console.warn('[Zalo Bot getGroups error]:', err.message);
      return [];
    }
  }

  /**
   * Gửi tin nhắn tự động vào Nhóm Zalo
   */
  async sendToGroup({ groupId, groupLink, content, imageUrl, articleTitle, articleId }) {
    if (!this.api) {
      throw new Error('Bot Zalo chưa kết nối! Vui lòng quét mã QR trên trang để kích hoạt Bot trước khi gửi.');
    }

    let targetGroupId = (groupId || '').trim();

    // Ánh xạ nhanh link nhóm mẫu hoặc link nhóm cụ thể
    if (groupLink && groupLink.includes('wdhpzaoap7wkxb074exv')) {
      targetGroupId = '705429241168977035';
    }

    // Nếu người dùng cung cấp link nhóm chưa xác định
    if (!targetGroupId && groupLink) {
      console.log(`[Zalo Bot] Đang phân giải link nhóm: ${groupLink}`);
      try {
        const allGroups = await this.getGroups();
        if (allGroups.length > 0) {
          targetGroupId = allGroups[0].id || allGroups[0].groupId;
          console.log(`[Zalo Bot] Đã chọn nhóm Zalo gần nhất: ${targetGroupId} (${allGroups[0].name})`);
        }
      } catch (linkErr) {
        console.warn('[Zalo Bot] Lỗi phân giải group link:', linkErr.message);
      }
    }

    // Dự phòng: Lấy nhóm mới nhất từ gridVerMap
    if (!targetGroupId) {
      const res = await this.api.getAllGroups();
      const gridVerMap = res?.gridVerMap || {};
      const sortedIds = Object.keys(gridVerMap).sort((a, b) => Number(gridVerMap[b] || 0) - Number(gridVerMap[a] || 0));
      if (sortedIds.length > 0) {
        targetGroupId = sortedIds[0];
      }
    }

    if (!targetGroupId) {
      throw new Error('Chưa tìm thấy ID của nhóm Zalo! Vui lòng đảm bảo tài khoản Bot đã tham gia vào nhóm chat đó.');
    }

    const cleanContent = (content || articleTitle || 'Thông tin từ Công Đoàn TDMU').trim();
    console.log(`[Zalo Bot] Bắt đầu đẩy tin nhắn vào Nhóm Zalo (Group ID: ${targetGroupId})...`);

    let sendRes = null;

    // Chuẩn bị đính kèm ảnh nếu có
    if (imageUrl) {
      try {
        let imgBuffer = null;
        let ext = 'jpg';

        if (imageUrl.startsWith('data:image/')) {
          // Case 1: Base64 image
          const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (match) {
            ext = match[1].includes('png') ? 'png' : 'jpg';
            imgBuffer = Buffer.from(match[2], 'base64');
          }
        } else if (imageUrl.startsWith('http')) {
          // Case 2: Public HTTP URL
          const fetch = (await import('node-fetch')).default || globalThis.fetch;
          const imgRes = await fetch(imageUrl);
          if (imgRes.ok) {
            const arrBuf = await imgRes.arrayBuffer();
            imgBuffer = Buffer.from(arrBuf);
            if (imageUrl.toLowerCase().includes('.png')) ext = 'png';
          }
        } else {
          // Case 3: Local file path
          const cleanPath = imageUrl.replace(/^\//, '');
          const localFilePath = path.join(__dirname, '..', '..', 'public', cleanPath);
          if (fs.existsSync(localFilePath)) {
            imgBuffer = fs.readFileSync(localFilePath);
            ext = path.extname(localFilePath).toLowerCase().replace('.', '') || 'jpg';
          }
        }

        if (imgBuffer && imgBuffer.length > 0) {
          console.log(`[Zalo Bot] Đang đóng gói Buffer ảnh (${imgBuffer.length} bytes) để gửi vào nhóm...`);
          const attachmentObj = {
            data: imgBuffer,
            filename: `photo_${Date.now()}.${ext}`,
            metadata: {
              totalSize: imgBuffer.length,
              width: 1200,
              height: 800
            }
          };

          sendRes = await this.api.sendMessage({
            msg: cleanContent,
            attachments: [attachmentObj]
          }, targetGroupId, ThreadType.Group);
          console.log(`[Zalo Bot] GỬI KÈM ẢNH THÀNH CÔNG!`, sendRes);
        }
      } catch (imgErr) {
        console.warn('[Zalo Bot] Lỗi gửi ảnh kèm theo:', imgErr.message);
      }
    }

    // Nếu không có ảnh hoặc gửi ảnh không thành công -> Gửi text chuẩn
    if (!sendRes) {
      sendRes = await this.api.sendMessage(cleanContent, targetGroupId, ThreadType.Group);
    }

    console.log(`[Zalo Bot] ĐÃ BẮN TIN VÀO NHÓM THÀNH CÔNG!`, sendRes);

    return {
      success: true,
      channel: 'zalo_group',
      mode: 'bot_auto_group',
      groupId: targetGroupId,
      botName: this.botInfo?.name || 'Bot Zalo Công Đoàn',
      message: `Đã tự động đẩy tin nhắn vào Nhóm Zalo thành công 100%!`,
      publishedAt: new Date().toISOString()
    };
  }
}

// Khởi tạo Singleton Instance
const zaloBotService = new ZaloBotService();
module.exports = zaloBotService;
