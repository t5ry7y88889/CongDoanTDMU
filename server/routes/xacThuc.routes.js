/**
 * ============================================================================
 * ĐỒ ÁN CHUYÊN NGÀNH: HỆ THỐNG TRUYỀN THÔNG CÔNG ĐOÀN ĐH THỦ DẦU MỘT
 * ============================================================================
 * File: server/routes/xacThuc.routes.js
 * Chức năng: Quản lý Xác thực Cán bộ (Đăng ký, Đăng nhập, Phiên làm việc)
 *            và Phân quyền vai trò (Admin, Editor, Contributor).
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../db');
const { getUsersFromDb } = require('../mssql_db');

// 1. ĐĂNG NHẬP CÁN BỘ (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email cán bộ!' });
    }

    const db = loadDB();
    const users = db.users || [];
    const normalizedEmail = email.trim().toLowerCase();

    // Tìm cán bộ theo email
    let user = users.find(u => (u.email || '').toLowerCase() === normalizedEmail);

    // Nếu chưa có nhưng là email @tdmu.edu.vn demo, tự động nhận diện tài khoản vai trò công vụ
    if (!user && (normalizedEmail.includes('admin') || normalizedEmail === 'admin@tdmu.edu.vn')) {
      user = {
        id: 1,
        ho_ten: 'Quản Trị Viên Hệ Thống',
        email: 'admin@tdmu.edu.vn',
        role: 'admin',
        unit: 'Ban Quản Trị Công Đoàn TDMU'
      };
    } else if (!user && (normalizedEmail.includes('editor') || normalizedEmail === 'editor@tdmu.edu.vn')) {
      user = {
        id: 2,
        ho_ten: 'Biên Tập Viên Tin Bài',
        email: 'editor@tdmu.edu.vn',
        role: 'editor',
        unit: 'Ban Biên Tập & Truyền Thông'
      };
    } else if (!user && (normalizedEmail.includes('contributor') || normalizedEmail === 'contributor@tdmu.edu.vn')) {
      user = {
        id: 3,
        ho_ten: 'Cộng Tác Viên Truyền Thông',
        email: 'contributor@tdmu.edu.vn',
        role: 'contributor',
        unit: 'Tổ Công Đoàn Cơ Sở'
      };
    } else if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản cán bộ không tồn tại! Vui lòng chuyển sang tab Đăng ký.'
      });
    }

    // Kiểm tra mật khẩu (hỗ trợ mật khẩu mặc định 123, 123456 cho môi trường nghiệm thu đồ án)
    if (user.password && password && user.password !== password && password !== '123' && password !== '123456') {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    const roleName = user.role === 'admin' ? 'Quản Trị Viên (Admin)' : (user.role === 'editor' ? 'Biên Tập Viên (Editor)' : 'Cộng Tác Viên (Contributor)');

    return res.json({
      success: true,
      message: `Đăng nhập thành công! Xin chào ${user.ho_ten} (${roleName})`,
      token: 'tdmu_auth_token_' + Date.now(),
      user: {
        id: user.id,
        ho_ten: user.ho_ten || user.name,
        email: user.email,
        role: user.role || 'editor',
        roleName,
        unit: user.unit || user.department || 'ĐH Thủ Dầu Một'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ xác thực: ' + err.message });
  }
});

// 2. ĐĂNG KÝ TÀI KHOẢN CÁN BỘ MỚI (POST /api/auth/register)
router.post('/register', (req, res) => {
  try {
    const { ho_ten, email, unit, role, password } = req.body;

    if (!ho_ten || !email) {
      return res.status(400).json({ success: false, message: 'Họ tên và email là thông tin bắt buộc!' });
    }

    const db = loadDB();
    db.users = db.users || [];
    const normalizedEmail = email.trim().toLowerCase();

    if (db.users.some(u => (u.email || '').toLowerCase() === normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Email cán bộ này đã tồn tại trên hệ thống!' });
    }

    const assignedRole = role || 'editor';
    const newUser = {
      id: Date.now(),
      ho_ten: ho_ten.trim(),
      email: normalizedEmail,
      unit: unit ? unit.trim() : 'Đại học Thủ Dầu Một',
      role: assignedRole,
      password: password || '123456',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDB(db);

    const roleName = assignedRole === 'admin' ? 'Quản Trị Viên (Admin)' : (assignedRole === 'editor' ? 'Biên Tập Viên (Editor)' : 'Cộng Tác Viên (Contributor)');

    return res.json({
      success: true,
      message: 'Đăng ký tài khoản cán bộ thành công!',
      user: {
        id: newUser.id,
        ho_ten: newUser.ho_ten,
        email: newUser.email,
        role: newUser.role,
        roleName,
        unit: newUser.unit
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi đăng ký tài khoản: ' + err.message });
  }
});

// 3. LẤY THÔNG TIN PHIÊN CÁN BỘ HIỆN TẠI (GET /api/auth/me)
router.get('/me', async (req, res) => {
  try {
    const db = loadDB();
    const defaultUser = (db.users && db.users.length > 0) ? db.users[0] : {
      id: 1,
      ho_ten: 'Quản Trị Viên Hệ Thống',
      email: 'admin@tdmu.edu.vn',
      role: 'admin',
      unit: 'Ban Quản Trị Công Đoàn TDMU'
    };

    const roleName = defaultUser.role === 'admin' ? 'Quản Trị Viên (Admin)' : (defaultUser.role === 'editor' ? 'Biên Tập Viên (Editor)' : 'Cộng Tác Viên (Contributor)');

    return res.json({
      success: true,
      user: {
        ...defaultUser,
        roleName
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi tải phiên làm việc: ' + err.message });
  }
});

module.exports = router;
