import React, { useState } from 'react';

export default function HopThoaiDangNhap({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUnit, setRegUnit] = useState('Tổ Công Đoàn Cơ Sở');
  const [regRole, setRegRole] = useState('editor');
  const [regPassword, setRegPassword] = useState('123456');
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState('');
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  // 1-Click Fast Login for Demo
  const handleFastLogin = async (email, password = '123') => {
    setLoginEmail(email);
    setLoginPassword(password);
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(r => r.json());

      if (res.success && res.user) {
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      } else {
        setLoginError(res.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      setLoginError('Lỗi kết nối máy chủ xác thực: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCustomLogin = async (e) => {
    e?.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError('Vui lòng nhập email cán bộ!');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      }).then(r => r.json());

      if (res.success && res.user) {
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      } else {
        setLoginError(res.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      setLoginError('Lỗi kết nối: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Vui lòng điền họ tên và email cán bộ!');
      return;
    }

    setRegLoading(true);
    setRegError('');
    setRegMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ho_ten: regName.trim(),
          email: regEmail.trim(),
          unit: regUnit.trim(),
          role: regRole,
          password: regPassword
        })
      }).then(r => r.json());

      if (res.success && res.user) {
        setRegMsg('Đăng ký tài khoản thành công! Tự động đăng nhập...');
        setTimeout(() => {
          localStorage.setItem('tdmu_user', JSON.stringify(res.user));
          if (onLoginSuccess) onLoginSuccess(res.user);
          onClose();
        }, 800);
      } else {
        setRegError(res.message || 'Đăng ký không thành công');
      }
    } catch (err) {
      setRegError('Lỗi: ' + err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 60px -15px rgba(0, 40, 85, 0.4)',
        border: '1px solid #CBD5E1',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #002855 0%, #0284C7 100%)',
          padding: '18px 24px',
          color: '#FFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/images/logo_cong_doan.png"
              alt="Logo"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '0.2px' }}>
                XÁC THỰC CÁN BỘ & PHÂN QUYỀN
              </h3>
              <div style={{ fontSize: '11px', color: '#BFDBFE', marginTop: '2px' }}>
                Công đoàn Trường Đại học Thủ Dầu Một
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#FFF',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'login' ? '#FFF' : 'transparent',
              borderBottom: activeTab === 'login' ? '3px solid #0284C7' : '3px solid transparent',
              color: activeTab === 'login' ? '#002855' : '#64748B',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-right-to-bracket" /> Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'register' ? '#FFF' : 'transparent',
              borderBottom: activeTab === 'register' ? '3px solid #0284C7' : '3px solid transparent',
              color: activeTab === 'register' ? '#002855' : '#64748B',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-user-plus" /> Đăng Ký Cán Bộ
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '22px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {activeTab === 'login' ? (
            <div>
              {/* Fast 1-Click Profile Switching for Demo */}
              <div style={{ marginBottom: '18px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369A1', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-bolt" /> Chọn nhanh tài khoản mẫu (Demo nghiệm thu):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleFastLogin('admin@tdmu.edu.vn', '123')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #93C5FD',
                      background: '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#002855' }}>Quản Trị Viên Hệ Thống</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>admin@tdmu.edu.vn</div>
                    </div>
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800' }}>
                      Admin (Toàn Quyền)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFastLogin('editor@tdmu.edu.vn', '123')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #93C5FD',
                      background: '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#002855' }}>Biên Tập Viên Tin Bài</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>editor@tdmu.edu.vn</div>
                    </div>
                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800' }}>
                      Editor (Biên Tập Viên)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFastLogin('contributor@tdmu.edu.vn', '123')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #93C5FD',
                      background: '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#002855' }}>Cộng Tác Viên Truyền Thông</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>contributor@tdmu.edu.vn</div>
                    </div>
                    <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800' }}>
                      Contributor (Cộng Tác)
                    </span>
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '9px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                  {loginError}
                </div>
              )}

              {/* Custom Login Form */}
              <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Email Cán Bộ TDMU:
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="ví dụ: utltk@tdmu.edu.vn"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Mật Khẩu:
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (mặc định: 123)"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  style={{
                    marginTop: '8px',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #002855, #0284C7)',
                    color: '#FFF',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: loginLoading ? 'wait' : 'pointer'
                  }}
                >
                  {loginLoading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              {regError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '9px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                  {regError}
                </div>
              )}
              {regMsg && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '9px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                  {regMsg}
                </div>
              )}

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Họ và Tên Cán Bộ: *
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="VD: TS. Nguyễn Văn A"
                    required
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Email Công Vụ (@tdmu.edu.vn): *
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="VD: nguyenva@tdmu.edu.vn"
                    required
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Đơn Vị / Khoa / Viện:
                  </label>
                  <input
                    type="text"
                    value={regUnit}
                    onChange={e => setRegUnit(e.target.value)}
                    placeholder="VD: Khoa Công Nghệ Thông Tin"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Cấp Quyền / Vai Trò:
                  </label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#FFF' }}
                  >
                    <option value="admin">Quản Trị Viên (Admin) - Toàn quyền phê duyệt & xuất bản</option>
                    <option value="editor">Biên Tập Viên (Editor) - Tạo và biên tập tin bài đa kênh</option>
                    <option value="contributor">Cộng Tác Viên (Contributor) - Gửi tư liệu & bản thảo</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Mật Khẩu Khởi Tạo:
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  style={{
                    marginTop: '8px',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#FFF',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: regLoading ? 'wait' : 'pointer'
                  }}
                >
                  {regLoading ? 'ĐANG TẠO TÀI KHOẢN...' : 'HOÀN TẤT ĐĂNG KÝ CÁN BỘ'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#F1F5F9',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: '#64748B'
        }}>
          <div>Hiện tại: <strong style={{ color: '#002855' }}>{currentUser?.ho_ten || 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một'}</strong> ({currentUser?.roleName || 'Admin'})</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFF',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
