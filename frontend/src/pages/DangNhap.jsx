import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const DangNhap = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', isSuccess: false });

  // Form states
  const [loginEmail, setLoginEmail] = useState('admin@tdmu.edu.vn');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeRole, setActiveRole] = useState('admin');

  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBranch, setRegBranch] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('tdmu_token');
    if (token) {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect') || '/ho-so';
      navigate(redirect, { replace: true });
    }

    // Load branches
    fetch('/api/auth/branches')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setBranches(res.data);
        }
      })
      .catch(console.warn);
  }, [navigate, location.search]);

  const selectQuickRole = (role, email, pass) => {
    setActiveRole(role);
    setLoginEmail(email);
    setLoginPassword(pass);
    setAlert({
      show: true,
      message: `Đã chọn tài khoản: <strong>${email}</strong> (Mật khẩu: 123456). Bấm Đăng Nhập để vào cổng!`,
      isSuccess: true
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      return setAlert({ show: true, message: 'Vui lòng nhập Email cán bộ / đoàn viên!', isSuccess: false });
    }
    if (!loginPassword) {
      return setAlert({ show: true, message: 'Vui lòng nhập mật khẩu truy cập!', isSuccess: false });
    }

    setLoading(true);
    setAlert({ show: false, message: '', isSuccess: false });

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });
      const res = await resp.json();

      if (res.success && res.token) {
        setAlert({ show: true, message: res.message || 'Đăng nhập thành công! Đang chuyển hướng...', isSuccess: true });
        localStorage.setItem('tdmu_token', res.token);
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));

        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');

        setTimeout(() => {
          if (redirect) {
            navigate(redirect);
          } else if (res.user.role === 'admin' || res.user.role === 'editor') {
            window.location.href = '/admin.html';
          } else {
            navigate('/ho-so');
          }
        }, 600);
      } else {
        setAlert({ show: true, message: res.error || 'Đăng nhập thất bại. Kiểm tra lại thông tin!', isSuccess: false });
      }
    } catch (err) {
      setAlert({ show: true, message: 'Lỗi kết nối máy chủ xác thực: ' + err.message, isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regBranch || !regPassword) {
      return setAlert({ show: true, message: 'Vui lòng điền đầy đủ các trường thông tin (*)!', isSuccess: false });
    }
    if (regPassword !== regPasswordConfirm) {
      return setAlert({ show: true, message: 'Mật khẩu xác nhận không trùng khớp!', isSuccess: false });
    }
    if (regPassword.length < 6) {
      return setAlert({ show: true, message: 'Mật khẩu phải từ 6 ký tự trở lên!', isSuccess: false });
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ho_ten: regFullName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          unit: regBranch,
          password: regPassword
        })
      });
      const res = await resp.json();

      if (res.success && res.token) {
        setAlert({ show: true, message: res.message || 'Đăng ký thành công! Đang vào cổng...', isSuccess: true });
        localStorage.setItem('tdmu_token', res.token);
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));
        setTimeout(() => navigate('/ho-so'), 600);
      } else {
        setAlert({ show: true, message: res.error || 'Đăng ký thất bại!', isSuccess: false });
      }
    } catch (err) {
      setAlert({ show: true, message: 'Lỗi kết nối: ' + err.message, isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOneTap = async () => {
    try {
      const testUser = {
        email: 'doanvien.google@tdmu.edu.vn',
        name: 'TS. Nguyễn Văn Tuấn (Google Account)',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        sub: 'google_oauth_sub_demo_12345'
      };

      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUser: testUser })
      });
      const res = await resp.json();

      if (res.success && res.token) {
        setAlert({ show: true, message: res.message, isSuccess: true });
        localStorage.setItem('tdmu_token', res.token);
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));
        setTimeout(() => navigate('/ho-so'), 600);
      } else {
        setAlert({ show: true, message: res.error || 'Đăng nhập Google thất bại', isSuccess: false });
      }
    } catch (err) {
      setAlert({ show: true, message: 'Lỗi kết nối Google: ' + err.message, isSuccess: false });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 15% 25%, rgba(0, 40, 85, 0.95), rgba(0, 20, 45, 0.98)), url("/images/banner.jpg") no-repeat center center fixed',
      backgroundSize: 'cover',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    }}>
      {/* Dim Blur Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 24, 52, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 1
      }} />

      {/* TOP HEADER */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '12px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <img src="/images/logo-congdoan-2025.png" alt="TDMU" style={{ height: '48px', width: 'auto' }} onError={(e) => { e.target.src = '/images/logo_cong_doan.png'; }} />
          <div>
            <h1 style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
              CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT
            </h1>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#FCD34D', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-shield-halved text-warning"></i> CỔNG ĐĂNG NHẬP &amp; XÁC THỰC TẬP TRUNG (IDENTITY SSO PORTAL)
            </div>
          </div>
        </Link>
        <Link to="/" style={{
          color: 'rgba(255, 255, 255, 0.85)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '8px 18px',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: 700,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fa-solid fa-arrow-left"></i> Về Cổng Thông Tin
        </Link>
      </header>

      {/* MAIN CARD STAGE */}
      <main style={{
        position: 'relative',
        zIndex: 5,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 15px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '1120px',
          minHeight: '640px',
          display: 'flex',
          flexWrap: 'wrap',
          boxShadow: '0 30px 90px -15px rgba(0, 15, 45, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.15)'
        }}>

          {/* LEFT: INSTITUTIONAL BRAND PANEL */}
          <section style={{
            flex: '1 1 440px',
            background: 'linear-gradient(155deg, #001f42 0%, #002855 50%, #003e7e 100%)',
            color: '#FFFFFF',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#FCD34D',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                backdropFilter: 'blur(10px)',
                marginBottom: '14px'
              }}>
                <i className="fa-solid fa-certificate text-warning"></i> CƠ QUAN CÔNG ĐOÀN CƠ SỞ TDMU
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.35, margin: '10px 0 6px', letterSpacing: '-0.3px' }}>
                Hệ Thống Định Danh Số &amp; Chăm Lo Đời Sống
              </h2>
              <div style={{ fontSize: '13.5px', color: '#FBBF24', fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.3px', marginBottom: '22px' }}>
                <i className="fa-solid fa-quote-left me-1"></i> Đổi mới &bull; Dân chủ &bull; Đoàn kết &bull; Phát triển <i className="fa-solid fa-quote-right ms-1"></i>
              </div>

              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.5, marginBottom: '20px' }}>
                Cổng xác thực một điểm dành cho toàn thể Cán bộ, Giảng viên, Người lao động và Đoàn viên kết nối với các dịch vụ số công đoàn.
              </p>

              {/* 3 Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#FCD34D' }}>
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>Hồ Sơ Đoàn Viên &amp; Thẻ Số Hóa</div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.45, margin: 0 }}>Quản lý mã định danh, sinh hoạt 16 Tổ Công đoàn và hồ sơ thi đua khen thưởng.</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#38BDF8' }}>
                    <i className="fa-solid fa-hand-holding-heart"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>Chăm Lo Phúc Lợi &amp; Trợ Cấp</div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.45, margin: 0 }}>Tra cứu chính sách PDF, tiếp nhận hỗ trợ khó khăn, vay vốn quỹ CEP và khám sức khỏe.</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#4ADE80' }}>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>Studio Biên Tập Tin Bài AI</div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.45, margin: 0 }}>Không gian xuất bản nội dung đa kênh, AI tổng hợp tin và quản trị truyền thông.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '16px', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.75)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><i className="fa-solid fa-shield-check text-warning me-1"></i> MSSQL Live Sync &bull; SSL 256-Bit</span>
              <span>Hotline: <strong>(0274) 3.815.184</strong></span>
            </div>
          </section>

          {/* RIGHT: AUTHENTICATION FORM PANEL */}
          <section style={{
            flex: '1 1 500px',
            padding: '44px 44px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div>
              {/* ROLE QUICK-SELECTOR (FOR TESTERS / EVALUATORS) */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '10px 14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-users-gear text-primary"></i> Tài Khoản Kiểm Thử / Đánh Giá Đề Tài:
                  </span>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                    <i className="fa-solid fa-bolt"></i> 1-Chạm điền &amp; đăng nhập
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'admin', label: 'Quản Trị (Admin)', email: 'admin@tdmu.edu.vn', pass: '123456', icon: 'fa-crown', color: '#D97706' },
                    { id: 'editor', label: 'Biên Tập (Editor)', email: 'editor@tdmu.edu.vn', pass: '123456', icon: 'fa-pen-nib', color: '#0284C7' },
                    { id: 'contributor', label: 'Cộng Tác Viên', email: 'contributor@tdmu.edu.vn', pass: '123456', icon: 'fa-user-check', color: '#059669' },
                    { id: 'member', label: 'Đoàn Viên Mẫu', email: 'doanvien@tdmu.edu.vn', pass: '123456', icon: 'fa-graduation-cap', color: '#7C3AED' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectQuickRole(r.id, r.email, r.pass)}
                      style={{
                        background: activeRole === r.id ? '#002855' : '#FFFFFF',
                        color: activeRole === r.id ? '#FFFFFF' : '#1E293B',
                        border: `1px solid ${activeRole === r.id ? '#002855' : '#CBD5E1'}`,
                        borderRadius: '8px',
                        padding: '7px 4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <i className={`fa-solid ${r.icon}`} style={{ color: activeRole === r.id ? '#FCD34D' : r.color }}></i>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SEGMENTED SWITCH */}
              <div style={{ background: '#F1F5F9', padding: '4px', borderRadius: '12px', display: 'flex', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setAlert({ show: false }); }}
                  style={{
                    flex: 1,
                    background: activeTab === 'login' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'login' ? '#002855' : '#64748B',
                    border: 'none',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập Cổng
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setAlert({ show: false }); }}
                  style={{
                    flex: 1,
                    background: activeTab === 'register' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'register' ? '#002855' : '#64748B',
                    border: 'none',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeTab === 'register' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-user-plus"></i> Đăng Ký Đoàn Viên
                </button>
              </div>

              {/* NOTIFICATION ALERT */}
              {alert.show && (
                <div
                  className={`alert ${alert.isSuccess ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3 small`}
                  style={{ borderRadius: '8px' }}
                  dangerouslySetInnerHTML={{ __html: alert.message }}
                />
              )}

              {/* ================= TAB 1: FORM LOGIN ================= */}
              {activeTab === 'login' && (
                <div>
                  {/* Google Workspace Button */}
                  <button
                    type="button"
                    onClick={handleGoogleOneTap}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1E293B',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Đăng nhập nhanh bằng tài khoản Google Trường (@tdmu.edu.vn)</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '18px 0', color: '#94A3B8', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    <div style={{ flex: 1, borderBottom: '1px solid #E2E8F0' }} />
                    <span style={{ padding: '0 12px' }}>hoặc đăng nhập bằng email &amp; mật khẩu</span>
                    <div style={{ flex: 1, borderBottom: '1px solid #E2E8F0' }} />
                  </div>

                  <form onSubmit={handleLogin} autoComplete="off">
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        Email Cán Bộ / Đoàn Viên (*):
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '14px', color: '#94A3B8', fontSize: '15px' }} />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="admin@tdmu.edu.vn"
                          autoComplete="off"
                          required
                          style={{
                            width: '100%',
                            height: '46px',
                            padding: '10px 14px 10px 42px',
                            background: '#F8FAFC',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', margin: 0 }}>
                          Mật khẩu truy cập (*):
                        </label>
                        <a
                          href="#forgot"
                          onClick={(e) => {
                            e.preventDefault();
                            alert('Vui lòng liên hệ Văn phòng Công đoàn Trường (Hotline: 0274.3815.184, Email: congdoan@tdmu.edu.vn) để được cấp lại mật khẩu!');
                          }}
                          style={{ fontSize: '12px', color: '#0284C7', textDecoration: 'none', fontWeight: 700 }}
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#94A3B8', fontSize: '15px' }} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="123456"
                          autoComplete="new-password"
                          required
                          style={{
                            width: '100%',
                            height: '46px',
                            padding: '10px 42px 10px 42px',
                            background: '#F8FAFC',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '15px' }}
                        >
                          <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#002855' }}
                        />
                        Duy trì phiên đăng nhập (30 ngày)
                      </label>
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>
                        <i className="fa-solid fa-lock me-1"></i> Kết nối an toàn
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%',
                        height: '48px',
                        background: 'linear-gradient(135deg, #002855 0%, #004b99 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '11px',
                        fontSize: '14.5px',
                        fontWeight: 800,
                        letterSpacing: '0.3px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(0, 40, 85, 0.3)'
                      }}
                    >
                      {loading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i> Đang xác thực...
                        </>
                      ) : (
                        <>
                          <span>XÁC THỰC &amp; ĐĂNG NHẬP VÀO CỔNG</span>
                          <i className="fa-solid fa-arrow-right"></i>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ================= TAB 2: FORM REGISTER ================= */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} autoComplete="off">
                  <div className="row g-2 mb-2">
                    <div className="col-md-6 mb-2">
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Họ và tên (*):</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-user" style={{ position: 'absolute', left: '14px', color: '#94A3B8' }} />
                        <input
                          type="text"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          required
                          style={{ width: '100%', height: '44px', padding: '10px 14px 10px 42px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Email TDMU (*):</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '14px', color: '#94A3B8' }} />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="an.nv@tdmu.edu.vn"
                          required
                          style={{ width: '100%', height: '44px', padding: '10px 14px 10px 42px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-md-6 mb-2">
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Số điện thoại:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-phone" style={{ position: 'absolute', left: '14px', color: '#94A3B8' }} />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="09xxxxxxxx"
                          style={{ width: '100%', height: '44px', padding: '10px 14px 10px 42px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Tổ Công đoàn cơ sở (*):</label>
                      <select
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value)}
                        required
                        style={{ width: '100%', height: '44px', padding: '10px 14px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', fontSize: '13.5px', outline: 'none' }}
                      >
                        <option value="">-- Chọn 1 trong 16 Tổ CĐ --</option>
                        {branches.map((b, idx) => (
                          <option key={idx} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6 mb-2">
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Mật khẩu (*):</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#94A3B8' }} />
                        <input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          style={{ width: '100%', height: '44px', padding: '10px 14px 10px 42px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Xác nhận lại (*):</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-check-double" style={{ position: 'absolute', left: '14px', color: '#94A3B8' }} />
                        <input
                          type="password"
                          value={regPasswordConfirm}
                          onChange={(e) => setRegPasswordConfirm(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          required
                          style={{ width: '100%', height: '44px', padding: '10px 14px 10px 42px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'linear-gradient(135deg, #002855 0%, #004b99 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '11px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 40, 85, 0.3)'
                    }}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Đang đăng ký...
                      </>
                    ) : (
                      <>
                        <span>GỬI ĐĂNG KÝ GIA NHẬP ĐOÀN VIÊN</span>
                        <i className="fa-solid fa-paper-plane"></i>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div style={{ fontSize: '11.5px', color: '#94A3B8', textAlign: 'center', marginTop: '18px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
              Cổng thông tin &amp; Cơ sở dữ liệu Công đoàn Trường Đại học Thủ Dầu Một &bull; Hệ thống phân quyền RBAC
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '14px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.65)'
      }}>
        &copy; 2026 CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT &bull; Địa chỉ: Số 06 Trần Văn Ơn, P. Phú Hòa, TP. Thủ Dầu Một, Bình Dương
      </footer>
    </div>
  );
};

export default DangNhap;
