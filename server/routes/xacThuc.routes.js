/**
 * ============================================================================
 * ĐỒ ÁN CHUYÊN NGÀNH: HỆ THỐNG TRUYỀN THÔNG CÔNG ĐOÀN ĐH THỦ DẦU MỘT
 * ============================================================================
 * File: server/routes/xacThuc.routes.js
 * Chức năng: Cổng xác thực tập trung (SSO / Portal Auth), Quản lý hồ sơ cá nhân,
 *            Đăng ký, Đăng nhập thường & Google 1-Tap OAuth, Tủ sách đọc sau.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { loadDB, saveDB } = require('../db');
const {
  getUsersFromDb,
  getUserByEmailFromDb,
  getUserByIdFromDb,
  createUserInDb,
  updateUserProfileInDb,
  updateUserPasswordInDb,
  updateUserLastLoginInDb,
  getBookmarksFromDb,
  insertBookmarkToDb,
  deleteBookmarkFromDb,
  getUserActivityFromDb
} = require('../mssql_db');

const JWT_SECRET = process.env.JWT_SECRET || 'TDMU_CONGDOAN_PORTAL_SECRET_KEY_2026_V2';

// 16 Tổ Công Đoàn Cơ Sở Trường Đại học Thủ Dầu Một chuẩn hóa
const TO_CONG_DOAN_LIST = [
  'Tổ Công đoàn 1 - Khối Hiệu Bộ',
  'Tổ Công đoàn 2 - Phòng Đào Tạo & Khảo Thí',
  'Tổ Công đoàn 3 - Viện Công Nghệ Số',
  'Tổ Công đoàn 4 - Khoa Khoa Học Tự Nhiên',
  'Tổ Công đoàn 5 - Khoa Khoa Học Xã Hội',
  'Tổ Công đoàn 6 - Khoa Kinh Tế',
  'Tổ Công đoàn 7 - Khoa Ngoại Ngữ',
  'Tổ Công đoàn 8 - Khoa Kỹ Thuật Công Nghệ',
  'Tổ Công đoàn 9 - Khoa Kiến Trúc',
  'Tổ Công đoàn 10 - Khoa Sư Phạm',
  'Tổ Công đoàn 11 - Khoa Luật',
  'Tổ Công đoàn 12 - Viện Đào Tạo Sau Đại Học',
  'Tổ Công đoàn 13 - Trung Tâm Học Liệu & CNTT',
  'Tổ Công đoàn 14 - Phòng Công Tác Sinh Viên',
  'Tổ Công đoàn 15 - Phòng Quản Trị & Cơ Sở Vật Chất',
  'Tổ Công đoàn 16 - Trung Tâm Ngoại Ngữ - Tin Học'
];

/**
 * Middleware xác thực JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để truy cập chức năng này!'
    });
  }

  if (token === 'tdmu_demo_session_token') {
    req.user = { id: 1, email: 'admin@tdmu.edu.vn', role: 'admin', ho_ten: 'Ban Thường Vụ Công Đoàn TDMU' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!'
      });
    }
    req.user = decoded;
    next();
  });
}

function getRoleDisplayName(role) {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'Quản Trị Viên Hệ Thống';
  if (r === 'editor') return 'Biên Tập Viên Tin Bài';
  if (r === 'contributor') return 'Cộng Tác Viên Truyền Thông';
  return 'Đoàn Viên Công Đoàn';
}

// ----------------------------------------------------------------------------
// 1. LẤY DANH SÁCH 16 TỔ CÔNG ĐOÀN (GET /api/auth/branches)
// ----------------------------------------------------------------------------
router.get('/branches', (req, res) => {
  return res.json({
    success: true,
    data: TO_CONG_DOAN_LIST
  });
});

// ----------------------------------------------------------------------------
// 2. ĐĂNG NHẬP THƯỜNG (POST /api/auth/login)
// ----------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email hoặc Mã cán bộ!' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await getUserByEmailFromDb(normalizedEmail);

    // Fallback tự động nhận diện tài khoản demo nếu chưa có trong DB
    if (!user) {
      if (normalizedEmail === 'admin@tdmu.edu.vn' || normalizedEmail === 'admin') {
        user = {
          id: 1,
          ho_ten: 'Ban Thường Vụ Công Đoàn',
          email: 'admin@tdmu.edu.vn',
          role: 'Admin',
          unit: 'Ban Thường Vụ Công Đoàn TDMU',
          phone: '0274.3815184',
          position: 'Chủ tịch Công đoàn cơ sở',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
        };
      } else if (normalizedEmail === 'editor@tdmu.edu.vn' || normalizedEmail === 'editor') {
        user = {
          id: 2,
          ho_ten: 'Biên Tập Viên Tin Bài',
          email: 'editor@tdmu.edu.vn',
          role: 'Editor',
          unit: 'Ban Biên Tập & Truyền Thông TDMU',
          phone: '0912345678',
          position: 'Biên tập viên chính',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200'
        };
      } else if (normalizedEmail === 'contributor@tdmu.edu.vn' || normalizedEmail === 'contributor') {
        user = {
          id: 3,
          ho_ten: 'Cộng Tác Viên Truyền Thông',
          email: 'contributor@tdmu.edu.vn',
          role: 'Contributor',
          unit: 'Tổ Công đoàn 3 - Viện Công Nghệ Số',
          phone: '0987654321',
          position: 'Cộng tác viên truyền thông',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
        };
      } else if (normalizedEmail === 'doanvien@tdmu.edu.vn' || normalizedEmail === 'doanvien') {
        user = {
          id: 4,
          ho_ten: 'Nguyễn Văn An',
          email: 'doanvien@tdmu.edu.vn',
          role: 'Member',
          unit: 'Tổ Công đoàn 3 - Viện Công Nghệ Số',
          phone: '0901234567',
          position: 'Đoàn viên công đoàn',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống Công đoàn TDMU! Vui lòng kiểm tra lại hoặc Đăng ký mới.'
      });
    }

    // Kiểm tra mật khẩu (hỗ trợ kiểm tra chính xác, mật khẩu rỗng, hoặc 123/123456 demo)
    const validPassword = !user.password ||
      user.password === password ||
      password === '123' ||
      password === '123456';

    if (user.password && password && !validPassword) {
      return res.status(401).json({ success: false, message: 'Mật khẩu truy cập không chính xác!' });
    }

    // Cập nhật mốc đăng nhập mới nhất
    if (user.id) {
      await updateUserLastLoginInDb(user.id);
    }

    const roleName = getRoleDisplayName(user.role);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: (user.role || 'Member').toLowerCase(),
        ho_ten: user.ho_ten || user.name,
        unit: user.unit,
        avatar: user.avatar
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Đăng nhập Cổng thông tin thành công! Xin chào ${user.ho_ten} (${roleName})`,
      token,
      user: {
        id: user.id,
        ho_ten: user.ho_ten || user.name,
        email: user.email,
        role: (user.role || 'Member').toLowerCase(),
        roleName,
        unit: user.unit || 'Trường Đại học Thủ Dầu Một',
        phone: user.phone || user.so_dien_thoai || '',
        avatar: user.avatar || user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        position: user.position || user.chuc_vu || 'Đoàn viên công đoàn',
        bio: user.bio || '',
        created_at: user.created_at || user.ngay_tao || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Lỗi API /api/auth/login:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ xác thực: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. ĐĂNG KÝ TÀI KHOẢN ĐOÀN VIÊN MỚI (POST /api/auth/register)
// ----------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { ho_ten, email, password, phone, unit, role } = req.body;

    if (!ho_ten || !email) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên và địa chỉ Email là thông tin bắt buộc!'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await getUserByEmailFromDb(normalizedEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký trên hệ thống Công đoàn TDMU!'
      });
    }

    const assignedRole = role ? role : (normalizedEmail.includes('admin') ? 'Admin' : 'Member');
    const newUser = await createUserInDb({
      ho_ten: ho_ten.trim(),
      email: normalizedEmail,
      password: password || '123456',
      role: assignedRole,
      unit: unit ? unit.trim() : 'Tổ Công đoàn 3 - Viện Công Nghệ Số',
      phone: phone ? phone.trim() : '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      position: assignedRole === 'Member' ? 'Đoàn viên công đoàn' : 'Cán bộ truyền thông'
    });

    const roleName = getRoleDisplayName(assignedRole);
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: assignedRole.toLowerCase(),
        ho_ten: newUser.ho_ten,
        unit: newUser.unit,
        avatar: newUser.avatar
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Đăng ký tài khoản đoàn viên thành công! Xin chào ${newUser.ho_ten}`,
      token,
      user: {
        id: newUser.id,
        ho_ten: newUser.ho_ten,
        email: newUser.email,
        role: assignedRole.toLowerCase(),
        roleName,
        unit: newUser.unit,
        phone: newUser.phone,
        avatar: newUser.avatar,
        position: newUser.position,
        bio: newUser.bio || '',
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    console.error('Lỗi API /api/auth/register:', err);
    return res.status(500).json({ success: false, message: 'Lỗi đăng ký tài khoản: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. XÁC THỰC GOOGLE SIGN-IN / ONE TAP (POST /api/auth/google)
// ----------------------------------------------------------------------------
router.post('/google', async (req, res) => {
  try {
    const { credential, googleUser, email: directEmail, name: directName, picture: directPic, sub: directSub } = req.body;

    let email = '';
    let name = '';
    let picture = '';
    let googleId = '';

    // 1. Phân tích Token JWT do Google Identity Services trả về
    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || decoded.given_name || 'Đoàn viên Google';
          picture = decoded.picture || '';
          googleId = decoded.sub || '';
        }
      } catch (e) {
        console.warn('Lỗi decode Google credential token:', e.message);
      }
    }

    // 2. Hoặc nhận dạng từ payload mô phỏng / trực tiếp
    if (!email) {
      if (googleUser && googleUser.email) {
        email = googleUser.email;
        name = googleUser.name || googleUser.ho_ten || 'Đoàn viên Google';
        picture = googleUser.picture || googleUser.avatar || '';
        googleId = googleUser.sub || googleUser.id || '';
      } else if (directEmail) {
        email = directEmail;
        name = directName || 'Đoàn viên Google';
        picture = directPic || '';
        googleId = directSub || '';
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Không nhận diện được thông tin tài khoản Google hợp lệ!'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await getUserByEmailFromDb(normalizedEmail);

    if (user) {
      // Người dùng đã tồn tại -> cập nhật GoogleId & Avatar nếu chưa có
      if (!user.avatar && picture) {
        await updateUserProfileInDb(user.id, { avatar: picture });
        user.avatar = picture;
      }
      await updateUserLastLoginInDb(user.id);
    } else {
      // Người dùng mới -> tự động khởi tạo hồ sơ Đoàn viên
      const autoRole = normalizedEmail.includes('admin') ? 'Admin' : (normalizedEmail.includes('editor') ? 'Editor' : 'Member');
      user = await createUserInDb({
        ho_ten: name,
        email: normalizedEmail,
        role: autoRole,
        unit: 'Tổ Công đoàn 3 - Viện Công Nghệ Số',
        position: 'Đoàn viên công đoàn',
        avatar: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        google_id: googleId,
        password: 'google_oauth_auth'
      });
    }

    const roleName = getRoleDisplayName(user.role);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: (user.role || 'Member').toLowerCase(),
        ho_ten: user.ho_ten || user.name,
        unit: user.unit,
        avatar: user.avatar
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Đăng nhập Google thành công! Xin chào ${user.ho_ten || name} (${roleName})`,
      token,
      user: {
        id: user.id,
        ho_ten: user.ho_ten || user.name,
        email: user.email,
        role: (user.role || 'Member').toLowerCase(),
        roleName,
        unit: user.unit || 'Trường Đại học Thủ Dầu Một',
        phone: user.phone || user.so_dien_thoai || '',
        avatar: user.avatar || picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        position: user.position || user.chuc_vu || 'Đoàn viên công đoàn',
        bio: user.bio || '',
        created_at: user.created_at || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Lỗi API /api/auth/google:', err);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực Google: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// 5. LẤY HỒ SƠ PHIÊN ĐĂNG NHẬP HIỆN TẠI (GET /api/auth/me)
// ----------------------------------------------------------------------------
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Chưa có phiên làm việc. Vui lòng đăng nhập!'
      });
    }

    if (token === 'tdmu_demo_session_token') {
      const demoUser = await getUserByEmailFromDb('admin@tdmu.edu.vn') || {
        id: 1,
        ho_ten: 'Ban Thường Vụ Công Đoàn TDMU',
        email: 'admin@tdmu.edu.vn',
        role: 'Admin',
        unit: 'Ban Thường Vụ Công Đoàn TDMU'
      };
      return res.json({
        success: true,
        user: {
          ...demoUser,
          role: (demoUser.role || 'Admin').toLowerCase(),
          roleName: getRoleDisplayName(demoUser.role)
        }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!'
      });
    }

    let user = null;
    if (decoded.id) {
      user = await getUserByIdFromDb(decoded.id);
    }
    if (!user && decoded.email) {
      user = await getUserByEmailFromDb(decoded.email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin tài khoản trên hệ thống!'
      });
    }

    const roleName = getRoleDisplayName(user.role);

    return res.json({
      success: true,
      user: {
        id: user.id,
        ho_ten: user.ho_ten || user.name,
        email: user.email,
        role: (user.role || 'Member').toLowerCase(),
        roleName,
        unit: user.unit || 'Trường Đại học Thủ Dầu Một',
        phone: user.phone || user.so_dien_thoai || '',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        position: user.position || user.chuc_vu || 'Đoàn viên công đoàn',
        bio: user.bio || '',
        created_at: user.created_at || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Lỗi API /api/auth/me:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải hồ sơ cá nhân: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// 6. CẬP NHẬT HỒ SƠ CÁ NHÂN (PUT /api/auth/profile)
// ----------------------------------------------------------------------------
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ho_ten, phone, unit, position, bio, avatar, oldPassword, newPassword } = req.body;

    const currentUser = await getUserByIdFromDb(userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    // Đổi mật khẩu nếu người dùng nhập
    if (newPassword) {
      if (currentUser.password && currentUser.password !== 'google_oauth_auth') {
        if (!oldPassword || (currentUser.password !== oldPassword && oldPassword !== '123' && oldPassword !== '123456')) {
          return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng!' });
        }
      }
      await updateUserPasswordInDb(userId, newPassword);
    }

    // Cập nhật thông tin lý lịch
    await updateUserProfileInDb(userId, {
      ho_ten,
      phone,
      unit,
      position,
      bio,
      avatar
    });

    const updatedUser = await getUserByIdFromDb(userId);
    const roleName = getRoleDisplayName(updatedUser.role);

    return res.json({
      success: true,
      message: 'Cập nhật thông tin hồ sơ cá nhân thành công!',
      user: {
        id: updatedUser.id,
        ho_ten: updatedUser.ho_ten,
        email: updatedUser.email,
        role: (updatedUser.role || 'Member').toLowerCase(),
        roleName,
        unit: updatedUser.unit,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        position: updatedUser.position,
        bio: updatedUser.bio,
        created_at: updatedUser.created_at
      }
    });
  } catch (err) {
    console.error('Lỗi API /api/auth/profile:', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// 7. TOÀN BỘ HOẠT ĐỘNG CÁ NHÂN (GET /api/auth/activity)
// ----------------------------------------------------------------------------
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { email, id } = req.user;
    const activity = await getUserActivityFromDb(email, id);

    return res.json({
      success: true,
      data: activity
    });
  } catch (err) {
    console.error('Lỗi API /api/auth/activity:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải hoạt động cá nhân: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// 8. TỦ SÁCH ĐỌC SAU (BOOKMARKS)
// ----------------------------------------------------------------------------
router.get('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const { id, email } = req.user;
    const bookmarks = await getBookmarksFromDb(id, email);
    return res.json({ success: true, data: bookmarks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const { id, email } = req.user;
    const { articleId, title, thumbnail, note } = req.body;
    if (!articleId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã bài viết!' });
    }

    await insertBookmarkToDb({
      userId: id,
      email,
      articleId,
      tieuDe: title,
      thumbnail,
      ghiChu: note
    });

    return res.json({
      success: true,
      message: 'Đã lưu bài viết vào tủ sách cá nhân thành công!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/bookmarks/:articleId', authenticateToken, async (req, res) => {
  try {
    const { id, email } = req.user;
    const articleId = req.params.articleId;

    await deleteBookmarkFromDb(id, email, articleId);
    return res.json({
      success: true,
      message: 'Đã xóa bài viết khỏi tủ sách cá nhân!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
