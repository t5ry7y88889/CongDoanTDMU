import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBookmarks } from '../App';

const BaiViet = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const articleId = searchParams.get('id') || '1';

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ author_name: 'TS. Lê Thị Kim Út', content: '' });
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [likes, setLikes] = useState(128);
  const [isLiked, setIsLiked] = useState(false);
  const [claps, setClaps] = useState(64);
  const [isClapped, setIsClapped] = useState(false);

  const { toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    fetchArticleDetails();
    fetchComments();
    fetchRelatedArticles();
    window.scrollTo(0, 0);
  }, [articleId]);

  const fetchArticleDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/articles/${articleId}`).then(r => r.json());
      if (res.success && res.data) {
        setArticle(res.data);
      } else {
        const fallbackRes = await fetch('/api/articles?status=published').then(r => r.json());
        if (fallbackRes.success && Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          const found = fallbackRes.data.find(a => String(a.id) === String(articleId)) || fallbackRes.data[0];
          setArticle(found);
        }
      }
    } catch (err) {
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?article_id=${articleId}`).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setComments(res.data.filter(c => String(c.article_id) === String(articleId)));
      }
    } catch (err) {
      console.warn('Comments fetch error:', err);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      const res = await fetch('/api/articles?status=published').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort((a, b) => ((b.viewsCount || b.views || 0) - (a.viewsCount || a.views || 0)));
        setRelatedArticles(sorted.filter(a => String(a.id) !== String(articleId)).slice(0, 5));
      }
    } catch (err) {
      console.warn('Related fetch error:', err);
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát thanh giọng nói tự động.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = `${article?.title || ''}. ${article?.summary || ''}. ${article?.content_web?.replace(/<[^>]*>?/gm, '') || ''}`;
      const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 1500));
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.content.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: parseInt(articleId),
          author_name: newComment.author_name,
          content: newComment.content
        })
      }).then(r => r.json());

      if (res.success && res.data) {
        setComments(prev => [res.data, ...prev]);
        setNewComment(prev => ({ ...prev, content: '' }));
      }
    } catch (err) {
      alert('Lỗi gửi bình luận!');
    } finally {
      setSubmittingComment(false);
    }
  };

  const copyArticleLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
    }
  };

  if (loading) {
    return (
      <div className="container my-5 text-center py-5">
        <i className="fa-solid fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>
        <div className="text-muted">Đang tải toàn văn bài viết từ hệ thống...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container my-5 text-center py-5">
        <h4 className="text-danger">Không tìm thấy bài viết!</h4>
        <Link to="/tin-tuc" className="btn btn-primary mt-3">Quay lại trang tin tức</Link>
      </div>
    );
  }

  return (
    <div className="container my-4">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <Link to="/tin-tuc">Tin tức &amp; Sự kiện</Link> / <span className="text-muted">{article.categoryName || article.category || 'Hoạt động công đoàn'}</span>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN (9 PHẦN): TOÀN VĂN BÀI BÁO */}
        <div className="col-lg-9">
          <article className="article-main-container">
            {/* Category Badge */}
            <div className="mb-2">
              <span className="badge" style={{ background: '#002855', color: '#FEF08A', fontWeight: 700, fontSize: '11.5px', padding: '6px 12px' }}>
                {article.categoryName || article.category || 'HOẠT ĐỘNG CÔNG ĐOÀN'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="article-headline">
              {article.title}
            </h1>

            {/* Meta Bar */}
            <div className="article-meta-bar">
              <div className="d-flex align-items-center gap-3">
                <span><i className="fa-solid fa-user-pen text-primary me-1"></i> <strong>{article.author || article.TacGia || 'Ban Thường Vụ'}</strong></span>
                <span><i className="fa-regular fa-calendar text-primary me-1"></i> {article.publishedAt ? String(article.publishedAt).slice(0, 10) : '26/06/2026'}</span>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span><i className="fa-regular fa-clock me-1 text-warning"></i> 3 phút đọc</span>
                <span><i className="fa-regular fa-eye me-1 text-success"></i> <strong>{article.viewsCount || article.views || 162}</strong> lượt xem</span>
                <span><i className="fa-regular fa-comment-dots me-1 text-primary"></i> <strong>{comments.length}</strong> bình luận</span>
              </div>
            </div>

            {/* AUDIO VOICE NARRATION PLAYER */}
            <div className="audio-narration-card">
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  className="btn btn-primary rounded-circle"
                  onClick={handleToggleSpeech}
                  style={{ width: '44px', height: '44px', background: isSpeaking ? '#DC2626' : '#002855', borderColor: 'transparent' }}
                  title={isSpeaking ? 'Dừng phát thanh' : 'Nghe phát thanh bản tin'}
                >
                  <i className={`fa-solid ${isSpeaking ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <div>
                  <div className="fw-bold text-dark">Phát Thanh Bản Tin Trực Tuyến</div>
                  <div className="text-muted small">
                    {isSpeaking ? 'Đang phát thanh tiếng Việt chuẩn phát thanh viên...' : 'Phát thanh tự động tiếng Việt chuẩn phát thanh viên'}
                  </div>
                </div>
              </div>
              <span className="badge bg-white text-primary border p-2">
                <i className="fa-solid fa-volume-high me-1"></i> Trực tuyến
              </span>
            </div>

            {/* AI 30s KEY TAKEAWAYS */}
            <div className="ai-takeaways-card">
              <h6><i className="fa-solid fa-wand-magic-sparkles me-2 text-success"></i> Điểm Nhấn Bản Tin (Tóm tắt cốt lõi)</h6>
              {article.ai_takeaways && Array.isArray(article.ai_takeaways) && article.ai_takeaways.length > 0 ? (
                <ul className="mb-0 ps-3 text-secondary small" style={{ lineHeight: '1.6' }}>
                  {article.ai_takeaways.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              ) : (
                <ul className="mb-0 ps-3 text-secondary small" style={{ lineHeight: '1.6' }}>
                  <li>{article.summary || 'Thông tin chỉ đạo, hoạt động phong trào và chính sách mới nhất.'}</li>
                  <li>Phát huy tinh thần đổi mới, sáng tạo và bảo vệ quyền lợi đoàn viên Công đoàn TDMU.</li>
                </ul>
              )}
            </div>

            {/* Sapo / Lead Paragraph */}
            {article.summary && (
              <div className="article-lead">
                {article.summary}
              </div>
            )}

            {/* Image */}
            {article.image && (
              <div className="mb-4 text-center">
                <img
                  src={article.image}
                  alt={article.title}
                  className="img-fluid rounded shadow-sm w-100"
                  style={{ maxHeight: '480px', objectFit: 'cover' }}
                />
                <small className="text-muted d-block mt-2 font-monospace">Hình ảnh: Cổng thông tin Công đoàn Trường Đại học Thủ Dầu Một</small>
              </div>
            )}

            {/* Article Content */}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{
                __html: article.content_web || article.noi_dung_web || article.content || `<p>${article.summary || 'Nội dung đang được cập nhật...'}</p>`
              }}
            />

            {/* Engagement & Reaction Bar */}
            <div className="border-top border-bottom py-3 my-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex gap-2">
                <button
                  className={`reaction-pill ${isLiked ? 'liked' : ''}`}
                  onClick={() => {
                    setLikes(prev => isLiked ? prev - 1 : prev + 1);
                    setIsLiked(!isLiked);
                  }}
                >
                  <i className="fa-solid fa-heart text-danger"></i> <span>{likes}</span> Thích
                </button>
                <button
                  className="reaction-pill"
                  onClick={() => {
                    setClaps(prev => isClapped ? prev - 1 : prev + 1);
                    setIsClapped(!isClapped);
                  }}
                >
                  <i className="fa-solid fa-hands-clapping text-warning"></i> <span>{claps}</span> Vỗ tay
                </button>
                <button
                  className="reaction-pill"
                  onClick={() => toggleBookmark(article)}
                >
                  <i className={`fa-${isBookmarked && isBookmarked(article.id) ? 'solid text-danger' : 'regular text-primary'} fa-bookmark`}></i> Lưu đọc sau
                </button>
              </div>
              <div>
                <button className="btn btn-sm btn-outline-primary fw-bold" onClick={copyArticleLink}>
                  <i className="fa-solid fa-share-nodes me-1"></i> Chia sẻ bài viết
                </button>
              </div>
            </div>

            {/* PHÂN HỆ BÌNH LUẬN & Ý KIẾN ĐOÀN VIÊN */}
            <section className="mt-4 pt-3" id="commentsSection">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0" style={{ color: '#002855', fontSize: '18px' }}>
                  <i className="fa-solid fa-comments text-primary me-2"></i> Ý Kiến &amp; Bình Luận Đoàn Viên (<span id="totalCommentsHeader">{comments.length}</span>)
                </h4>
                <span className="text-muted small">Quy chế trao đổi văn minh &amp; xây dựng</span>
              </div>

              <form onSubmit={handleSubmitComment} className="p-3 bg-light rounded border mb-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }} id="userCommentAvatar">
                      U
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      Đang bình luận với tư cách: <strong className="text-primary" id="userCommentName">{newComment.author_name}</strong>
                      <span className="badge bg-white text-secondary border ms-1" id="userCommentUnit">Tổ CĐ Viện Công nghệ số</span>
                    </div>
                  </div>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    <i className="fa-solid fa-shield-halved text-success me-1"></i> Xác thực tài khoản TDMU
                  </span>
                </div>
                <div className="mb-2">
                  <textarea
                    id="inputCommentText"
                    className="form-control"
                    rows="3"
                    placeholder="Nhập ý kiến thảo luận hoặc cảm nhận của bạn về bài viết này..."
                    style={{ fontSize: '13.5px' }}
                    value={newComment.content}
                    onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                    required
                  ></textarea>
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary fw-bold px-4 py-2"
                    disabled={submittingComment}
                    style={{ background: '#002855', borderColor: '#002855', borderRadius: '6px' }}
                  >
                    {submittingComment ? <i className="fa-solid fa-spinner fa-spin me-1"></i> : <i className="fa-solid fa-paper-plane me-1 text-warning"></i>} Gửi Bình Luận
                  </button>
                </div>
              </form>

              {/* List of Comments */}
              <div id="commentsListContainer">
                {comments.length === 0 ? (
                  <div className="text-muted small fst-italic text-center py-3">
                    Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!
                  </div>
                ) : (
                  comments.map((c, i) => {
                    const name = c.author_name || c.author || 'Đoàn viên';
                    const initials = name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join('') || 'DV';
                    return (
                      <div key={c.id || i} className="d-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '42px', height: '42px', flexShrink: 0 }}>
                          {initials.slice(0, 2)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div>
                              <strong className="text-dark">{name}</strong>
                              {c.unit && <span className="badge bg-light text-primary border ms-2 small">{c.unit}</span>}
                            </div>
                            <small className="text-muted">
                              <i className="fa-regular fa-clock me-1"></i> {c.createdAt ? String(c.createdAt).slice(0, 16) : 'Vừa xong'}
                            </small>
                          </div>
                          <p className="mb-0 text-secondary" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>{c.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Related Next Article */}
            {(() => {
              const next = relatedArticles.find((r) => String(r.id) !== String(articleId));
              if (!next) return null;
              return (
                <div className="p-3 bg-light rounded border mt-4">
                  <div className="text-muted small fw-bold text-uppercase mb-2">
                    <i className="fa-solid fa-arrow-right text-primary me-1"></i> Bài viết tiếp theo cùng chuyên mục:
                  </div>
                  <h5 className="fw-bold mb-1" id="nextArtTitle">
                    <Link to={`/bai-viet?id=${next.id}`} className="text-decoration-none text-primary">{next.title}</Link>
                  </h5>
                  <div className="text-muted small">{next.categoryName || next.category || 'Hoạt động công đoàn'} | 3 phút đọc</div>
                </div>
              );
            })()}
          </article>
        </div>

        {/* RIGHT COLUMN (3 PHẦN): SIDEBAR BÀI ĐỌC NHIỀU NHẤT */}
        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-fire me-2 text-danger"></i>Đọc nhiều nhất
            </div>
            <div className="list-group-tdmu" id="popular_articles_sidebar">
              {relatedArticles.map((r) => (
                <Link
                  key={r.id}
                  to={`/bai-viet?id=${r.id}`}
                  className={`list-group-item ${String(r.id) === String(articleId) ? 'fw-bold text-primary bg-light' : ''}`}
                >
                  <i className="fa-solid fa-angle-right me-1 text-muted small"></i> {r.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaiViet;
