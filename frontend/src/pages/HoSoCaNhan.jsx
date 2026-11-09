import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const HoSoCaNhan = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security' | 'bookmarks' | 'feedback' | 'aid'
  const [branches, setBranches] = useState([]);

  // Form states
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editBio, setEditBio] = useState('');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Activity stats & lists
  const [activity, setActivity] = useState({
    bookmarks: [],
    feedback: [],
    aidRequests: [],
    articles: []
  });

  // Avatar modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const avatarPresets = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'
  ];

  const showNotification = (message, isSuccess = true) => {
    setToast({ show: true, message, isSuccess });
    setTimeout(() => {
      setToast({ show: false, message: '', isSuccess: true });
    }, 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem('tdmu_token');
    if (!token) {
      navigate('/dang-nhap?redirect=/ho-so', { replace: true });
      return;
    }

    // Load branches
    fetch('/api/auth/branches')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setBranches(res.data);
      })
      .catch(() => {});

    // Load current profile
    fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.user) {
          setUser(res.user);
          setEditFullName(res.user.ho_ten || '');
          setEditPhone(res.user.phone || '');
          setEditPosition(res.user.position || '');
          setEditBranch(res.user.unit || '');
          setEditBio(res.user.bio || '');
          setLoading(false);
        } else {
          localStorage.removeItem('tdmu_token');
          navigate('/dang-nhap');
        }
      })
      .catch(() => {
        setLoading(false);
      });

    // Load activity
    fetch('/api/auth/activity', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setActivity(res.data);
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('tdmu_token');
    setSaving(true);

    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          ho_ten: editFullName.trim(),
          phone: editPhone.trim(),
          position: editPosition.trim(),
          unit: editBranch,
          bio: editBio.trim()
        })
      });
      const res = await resp.json();

      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));
        localStorage.setItem('tdmu_user_name', res.user.ho_ten);
        window.dispatchEvent(new Event('tdmu_auth_change'));
        showNotification(res.message || 'Cập nhật thông tin thành công!');
      } else {
        showNotification(res.message || 'Lỗi cập nhật hồ sơ!', false);
      }
    } catch (err) {
      showNotification('Lỗi kết nối máy chủ: ' + err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return showNotification('Mật khẩu mới và xác nhận mật khẩu không khớp!', false);
    }
    const token = localStorage.getItem('tdmu_token');
    setSaving(true);

    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const res = await resp.json();

      if (res.success) {
        showNotification('Đổi mật khẩu thành công! Vui lòng lưu lại mật khẩu mới.');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        showNotification(res.message || 'Lỗi đổi mật khẩu!', false);
      }
    } catch (err) {
      showNotification('Lỗi kết nối: ' + err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const updateAvatar = async (url) => {
    const token = localStorage.getItem('tdmu_token');
    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ avatar: url })
      });
      const res = await resp.json();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('tdmu_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('tdmu_auth_change'));
        setShowAvatarModal(false);
        showNotification('Đổi ảnh đại diện thành công!');
      }
    } catch (e) {
      showNotification('Lỗi đổi ảnh: ' + e.message, false);
    }
  };

  const removeBookmarkItem = async (articleId) => {
    const token = localStorage.getItem('tdmu_token');
    try {
      const resp = await fetch('/api/auth/bookmarks/' + articleId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const res = await resp.json();
      if (res.success) {
        showNotification('Đã xóa bài viết khỏi tủ sách đọc sau!');
        setActivity(prev => ({
          ...prev,
          bookmarks: prev.bookmarks.filter(b => (b.article_id != articleId && b.id != articleId))
        }));
      }
    } catch (err) {
      showNotification('Lỗi khi xóa bài viết: ' + err.message, false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      localStorage.removeItem('tdmu_token');
      localStorage.removeItem('tdmu_user');
      localStorage.removeItem('tdmu_user_id');
      localStorage.removeItem('tdmu_user_name');
      window.dispatchEvent(new Event('tdmu_auth_change'));
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <i className="fa-solid fa-spinner fa-spin fa-2x text-primary mb-2"></i>
        <p className="text-muted">Đang tải hồ sơ cán bộ & đoàn viên...</p>
      </div>
    );
  }

  if (!user) return null;

  const role = (user.role || 'member').toLowerCase();
  const isCadre = (role === 'admin' || role === 'editor' || role === 'contributor');
  const roleName = user.roleName || (role === 'admin' ? 'Quản Trị Viên (Admin)' : (role === 'editor' ? 'Biên Tập Viên (Editor)' : (role === 'contributor' ? 'Cộng Tác Viên (Contributor)' : 'Đoàn Viên Công Đoàn')));

  let roleBadgeClass = 'badge bg-warning text-dark';
  if (role === 'admin') roleBadgeClass = 'badge bg-danger text-white';
  else if (role === 'editor') roleBadgeClass = 'badge bg-primary text-white';
  else if (role === 'contributor') roleBadgeClass = 'badge bg-success text-white';

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '85vh', padding: '25px 0' }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb" style={{ fontSize: '13.5px' }}>
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted"><i className="fa-solid fa-house me-1"></i> Trang chủ</Link></li>
            <li className="breadcrumb-item"><span className="text-muted">Cổng đoàn viên</span></li>
            <li className="breadcrumb-item active text-primary fw-bold" aria-current="page">Hồ sơ cá nhân & Quản lý tài khoản</li>
          </ol>
        </nav>

        {/* Toast Alert */}
        {toast.show && (
          <div className={`alert ${toast.isSuccess ? 'alert-success' : 'alert-danger'} mb-3 py-2 px-3 small shadow-sm`} role="alert">
            {toast.message}
          </div>
        )}

        <div className="row g-4">
          {/* ================= LEFT COLUMN: PROFILE CARD ================= */}
          <div className="col-lg-4">
            <div className="bg-white rounded-4 shadow-sm border p-0 overflow-hidden mb-4 text-center">
              {/* Cover Banner */}
              <div style={{ height: '110px', background: 'linear-gradient(135deg, #002855, #004080)' }}></div>

              {/* Avatar */}
              <div style={{ marginTop: '-55px', position: 'relative', display: 'inline-block' }}>
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                  alt="Avatar"
                  className="rounded-circle border border-4 border-white shadow-sm"
                  style={{ width: '105px', height: '105px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  className="btn btn-warning rounded-circle position-absolute bottom-0 end-0 p-1 border border-2 border-white d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '32px', height: '32px' }}
                  title="Đổi ảnh đại diện"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <i className="fa-solid fa-camera fa-xs text-dark"></i>
                </button>
              </div>

              {/* User Name & Role */}
              <h5 className="fw-bold mt-3 mb-1 text-dark">{user.ho_ten}</h5>
              <div className="mb-2">
                <span className={`${roleBadgeClass} px-3 py-1 rounded-pill fw-semibold`} style={{ fontSize: '11.5px' }}>
                  {roleName}
                </span>
              </div>

              <p className="text-muted small px-3 mb-3">
                <i className="fa-solid fa-sitemap me-1 text-primary"></i> {user.unit || 'Đại học Thủ Dầu Một'}
              </p>

              {/* Info Details List */}
              <div className="px-4 text-start small border-top pt-3 text-muted">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span><i className="fa-solid fa-id-card me-1 text-secondary"></i> Số thẻ đoàn viên:</span>
                  <strong className="text-dark">DV-TDMU-{String(user.id).padStart(3, '0')}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span><i className="fa-solid fa-envelope me-1 text-secondary"></i> Email:</span>
                  <strong className="text-dark">{user.email}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span><i className="fa-solid fa-phone me-1 text-secondary"></i> Điện thoại:</span>
                  <strong className="text-dark">{user.phone || 'Chưa cập nhật'}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span><i className="fa-solid fa-calendar-check me-1 text-secondary"></i> Ngày tham gia:</span>
                  <strong className="text-dark">{user.created_at ? user.created_at.substring(0, 10) : '01/09/2026'}</strong>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 mt-3 pb-4 d-grid gap-2">
                {isCadre && (
                  <a href="/admin.html" className="btn btn-outline-primary btn-sm rounded-pill fw-semibold">
                    <i className="fa-solid fa-wand-magic-sparkles me-1"></i> Mở Studio Biên Tập AI
                  </a>
                )}
                <button type="button" className="btn btn-outline-danger btn-sm rounded-pill fw-semibold" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket me-1"></i> Đăng Xuất Tài Khoản
                </button>
              </div>
            </div>

            {/* Overview Quick Stats */}
            <div className="bg-white rounded-4 shadow-sm border p-3">
              <h6 className="fw-bold text-dark mb-3">
                <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Tổng quan hoạt động
              </h6>
              <div className="row g-2">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-4 fw-bold text-primary">{activity.bookmarks.length}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Bài viết đã lưu</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-4 fw-bold text-success">{activity.feedback.length}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Ý kiến phản ánh</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-4 fw-bold text-warning">{activity.aidRequests.length}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Đơn trợ cấp</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-4 fw-bold text-info">{activity.articles.length}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Bài viết đóng góp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE TABS ================= */}
          <div className="col-lg-8">
            <div className="bg-white rounded-4 shadow-sm border p-4">
              {/* Tab Navigation */}
              <ul className="nav nav-pills border-bottom pb-3 mb-4 flex-wrap gap-2" role="tablist">
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-pill fw-semibold px-3 py-2 ${activeTab === 'info' ? 'active' : 'text-dark bg-light'}`}
                    onClick={() => setActiveTab('info')}
                  >
                    <i className="fa-solid fa-user-pen me-1"></i> Thông Tin Cá Nhân
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-pill fw-semibold px-3 py-2 ${activeTab === 'security' ? 'active' : 'text-dark bg-light'}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <i className="fa-solid fa-key me-1"></i> Đổi Mật Khẩu
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-pill fw-semibold px-3 py-2 ${activeTab === 'bookmarks' ? 'active' : 'text-dark bg-light'}`}
                    onClick={() => setActiveTab('bookmarks')}
                  >
                    <i className="fa-solid fa-bookmark me-1 text-warning"></i> Tủ Sách Đọc Sau ({activity.bookmarks.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-pill fw-semibold px-3 py-2 ${activeTab === 'feedback' ? 'active' : 'text-dark bg-light'}`}
                    onClick={() => setActiveTab('feedback')}
                  >
                    <i className="fa-solid fa-envelope-open-text me-1 text-success"></i> Ý Kiến Phản Ánh ({activity.feedback.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-pill fw-semibold px-3 py-2 ${activeTab === 'aid' ? 'active' : 'text-dark bg-light'}`}
                    onClick={() => setActiveTab('aid')}
                  >
                    <i className="fa-solid fa-hand-holding-heart me-1 text-danger"></i> Đơn Xin Trợ Cấp ({activity.aidRequests.length})
                  </button>
                </li>
              </ul>

              {/* Tab 1: Profile Edit */}
              {activeTab === 'info' && (
                <div>
                  <h5 className="fw-bold text-dark mb-3">Chỉnh Sửa Hồ Sơ Đoàn Viên & Cán Bộ</h5>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-muted">Họ và tên</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-muted">Địa chỉ Email</label>
                        <input
                          type="email"
                          className="form-control bg-light"
                          value={user.email}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-muted">Số điện thoại liên hệ</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="0901234567"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-muted">Chức vụ công đoàn / chuyên môn</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          placeholder="Đoàn viên công đoàn"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold small text-muted">Tổ Công Đoàn trực thuộc (16 Tổ TDMU)</label>
                        <select
                          className="form-select"
                          value={editBranch}
                          onChange={(e) => setEditBranch(e.target.value)}
                          required
                        >
                          <option value="">-- Chọn Tổ Công Đoàn --</option>
                          {branches.map((b, i) => (
                            <option key={i} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold small text-muted">Giới thiệu bản thân / Ghi chú</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Giới thiệu đôi nét về bản thân hoặc nguyện vọng công tác công đoàn..."
                        ></textarea>
                      </div>
                    </div>

                    <div className="mt-4 text-end">
                      <button type="submit" className="btn btn-primary px-4 fw-bold rounded-pill" disabled={saving}>
                        {saving ? (
                          <span><i className="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...</span>
                        ) : (
                          <span><i className="fa-solid fa-floppy-disk me-1"></i> Lưu Cập Nhật Hồ Sơ</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Change Password */}
              {activeTab === 'security' && (
                <div>
                  <h5 className="fw-bold text-dark mb-3">Thiết Lập Bảo Mật & Đổi Mật Khẩu</h5>
                  <form onSubmit={handleChangePassword} style={{ maxWidth: '500px' }}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        className="form-control"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Mật khẩu mới</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <div className="form-text" style={{ fontSize: '11.5px' }}>Mật khẩu tối thiểu 6 ký tự.</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Nhập lại mật khẩu mới</label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <button type="submit" className="btn btn-warning px-4 fw-bold rounded-pill text-dark" disabled={saving}>
                      {saving ? (
                        <span><i className="fa-solid fa-spinner fa-spin me-1"></i> Đang xử lý...</span>
                      ) : (
                        <span><i className="fa-solid fa-shield-halved me-1"></i> Cập Nhật Mật Khẩu</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 3: Bookmarks */}
              {activeTab === 'bookmarks' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Tủ Sách Đọc Sau Của Bạn</h5>
                    <span className="badge bg-secondary rounded-pill">{activity.bookmarks.length} bài</span>
                  </div>

                  {activity.bookmarks.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="fa-solid fa-bookmark fa-2x mb-2 text-secondary opacity-50"></i>
                      <p className="mb-0">Bạn chưa lưu bài viết nào vào tủ sách đọc sau.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {activity.bookmarks.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white">
                          <div className="d-flex align-items-center gap-3">
                            <img src={item.thumbnail} alt="Thumbnail" className="rounded" style={{ width: '70px', height: '50px', objectFit: 'cover' }} />
                            <div>
                              <Link to={`/bai-viet?id=${item.article_id || item.id}`} className="text-decoration-none text-dark fw-bold" style={{ fontSize: '14.5px' }}>
                                {item.title}
                              </Link>
                              <div className="text-muted small mt-1">
                                <i className="fa-solid fa-clock me-1"></i> Đã lưu: {item.saved_at || 'Gần đây'}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <Link to={`/bai-viet?id=${item.article_id || item.id}`} className="btn btn-sm btn-outline-primary rounded-pill px-3">
                              <i className="fa-solid fa-book-open me-1"></i> Đọc
                            </Link>
                            <button type="button" className="btn btn-sm btn-outline-danger rounded-pill px-2" onClick={() => removeBookmarkItem(item.article_id || item.id)}>
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Feedback */}
              {activeTab === 'feedback' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Ý Kiến, Đề Xuất & Phản Ánh Đã Gửi</h5>
                    <Link to="/lien-he#hop-thu-gop-y" className="btn btn-sm btn-outline-success rounded-pill fw-semibold">
                      <i className="fa-solid fa-plus me-1"></i> Gửi Ý Kiến Mới
                    </Link>
                  </div>

                  {activity.feedback.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="fa-solid fa-comments fa-2x mb-2 text-secondary opacity-50"></i>
                      <p className="mb-0">Bạn chưa gửi ý kiến hay phản ánh nào lên Công đoàn TDMU.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {activity.feedback.map((item, idx) => {
                        const replyContent = item.reply || item.response || item.TraLoi;
                        const isResolved = Boolean(replyContent) || item.status === 'Đã phản hồi' || item.status === 'Đã xử lý' || item.status === 'resolved';
                        let badgeClass = isResolved ? 'bg-success text-white' : 'bg-warning text-dark';
                        let statusText = isResolved ? 'Đã phản hồi' : (item.status || 'Chờ tiếp nhận');

                        return (
                          <div key={idx} className="p-3 border rounded-3 bg-white shadow-sm">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <span className="badge bg-light text-primary border me-1">{item.topic || item.category || 'Góp ý chung'}</span>
                                <span className={`badge ${badgeClass}`}>{statusText}</span>
                              </div>
                              <small className="text-muted"><i className="fa-solid fa-clock me-1"></i> {item.created_at || item.submitted_at || ''}</small>
                            </div>
                            <h6 className="fw-bold text-dark mb-1">{item.title}</h6>
                            <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-line' }}>{item.content}</p>

                            {replyContent ? (
                              <div className="p-3 rounded-3 bg-light border-start border-4 border-success mt-2">
                                <div className="fw-bold text-success small mb-1">
                                  <i className="fa-solid fa-reply-all me-1"></i> Phản hồi chính thức từ Ban Thường Vụ Công Đoàn TDMU:
                                </div>
                                <div className="small text-dark" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{replyContent}</div>
                              </div>
                            ) : (
                              <div className="small text-muted fst-italic">
                                <i className="fa-solid fa-hourglass-half me-1"></i> Ban Thường Vụ đang thụ lý và sẽ có phản hồi sớm nhất.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Aid Requests */}
              {activeTab === 'aid' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Hồ Sơ Đề Nghị Chăm Lo & Trợ Cấp</h5>
                    <Link to="/phuc-loi-doan-vien" className="btn btn-sm btn-outline-danger rounded-pill fw-semibold">
                      <i className="fa-solid fa-plus me-1"></i> Nộp Hồ Sơ Mới
                    </Link>
                  </div>

                  {activity.aidRequests.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="fa-solid fa-hand-holding-heart fa-2x mb-2 text-secondary opacity-50"></i>
                      <p className="mb-0">Bạn chưa có đơn đề nghị chăm lo hay trợ cấp nào.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {activity.aidRequests.map((item, idx) => {
                        let badgeClass = 'bg-warning text-dark';
                        if (item.status === 'Đã chi trả' || item.status === 'Đã duyệt') badgeClass = 'bg-success text-white';
                        else if (item.status === 'Từ chối') badgeClass = 'bg-danger text-white';

                        const amountReq = item.amount_requested ? new Intl.NumberFormat('vi-VN').format(item.amount_requested) + ' đ' : 'Chưa xác định';
                        const amountApp = item.amount_approved ? new Intl.NumberFormat('vi-VN').format(item.amount_approved) + ' đ' : '-';

                        return (
                          <div key={idx} className="p-3 border rounded-3 bg-white">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <span className="badge bg-light text-danger border me-1">{item.aid_type}</span>
                                <span className={`badge ${badgeClass}`}>{item.status || 'Đang thẩm định'}</span>
                              </div>
                              <small className="text-muted"><i className="fa-solid fa-calendar me-1"></i> Nộp ngày: {item.submitted_at || ''}</small>
                            </div>
                            <div className="row g-2 my-2 text-dark small">
                              <div className="col-md-6">
                                <span className="text-muted">Mức đề xuất:</span> <strong className="text-primary">{amountReq}</strong>
                              </div>
                              <div className="col-md-6">
                                <span className="text-muted">Mức duyệt chi:</span> <strong className="text-success">{amountApp}</strong>
                              </div>
                            </div>
                            <div className="small text-muted mb-2"><strong>Lý do:</strong> {item.reason || ''}</div>
                            {item.note && (
                              <div className="small bg-light p-2 rounded text-secondary border">
                                <strong>Ghi chú BCH:</strong> {item.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom">
                <h6 className="modal-title fw-bold"><i className="fa-solid fa-image text-primary me-2"></i>Chọn Ảnh Đại Diện Đoàn Viên</h6>
                <button type="button" className="btn-close" onClick={() => setShowAvatarModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">Chọn ảnh mẫu đại diện hoặc dán liên kết URL hình ảnh:</p>
                <div className="d-flex flex-wrap gap-3 justify-content-center mb-4">
                  {avatarPresets.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="rounded-circle border"
                      style={{ width: '60px', height: '60px', cursor: 'pointer', objectFit: 'cover' }}
                      alt="Preset"
                      onClick={() => updateAvatar(url)}
                    />
                  ))}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Hoặc URL ảnh tùy chọn:</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  />
                </div>
                <div className="text-end">
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-4"
                    onClick={() => {
                      if (!customAvatarUrl.trim()) return alert('Vui lòng nhập đường dẫn hình ảnh hợp lệ!');
                      updateAvatar(customAvatarUrl.trim());
                    }}
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoSoCaNhan;
