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
        setRelatedArticles(res.data.filter(a => String(a.id) !== String(articleId)).slice(0, 4));
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
              <ul className="mb-0 ps-3 text-secondary small" style={{ lineHeight: '1.6' }}>
                <li>{article.summary || 'Thông tin chỉ đạo, hoạt động phong trào và chính sách mới nhất.'}</li>
                <li>Phát huy tinh thần đổi mới, sáng tạo và bảo vệ quyền lợi đoàn viên Công đoàn TDMU.</li>
              </ul>
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

            {/* Comments Section */}
            <div className="pt-2">
              <h5 className="fw-bold mb-3" style={{ color: '#002855' }}>
                <i className="fa-solid fa-comments text-primary me-2"></i>
                Ý Kiến &amp; Thảo Luận ({comments.length})
              </h5>

              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="row g-2">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Họ và tên..."
                      value={newComment.author_name}
                      onChange={(e) => setNewComment({ ...newComment, author_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Viết ý kiến thảo luận về bài viết..."
                        value={newComment.content}
                        onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingComment}
                        style={{ background: '#002855' }}
                      >
                        {submittingComment ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {comments.length === 0 ? (
                <div className="text-muted small fst-italic">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {comments.map((c, i) => (
                    <div key={c.id || i} className="p-3 bg-light rounded border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-primary" style={{ fontSize: '13.5px' }}>
                          <i className="fa-solid fa-circle-user me-1"></i>
                          {c.author_name || c.author || 'Đoàn viên'}
                        </strong>
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          {c.createdAt ? String(c.createdAt).slice(0, 10) : 'Vừa xong'}
                        </small>
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155' }}>{c.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN (3 PHẦN): WIDGET LIÊN QUAN */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-newspaper me-2 text-primary"></i>Tin tức cùng chuyên mục
            </div>
            <div className="list-group list-group-flush">
              {relatedArticles.map(r => (
                <Link
                  key={r.id}
                  to={`/bai-viet?id=${r.id}`}
                  className="list-group-item list-group-item-action py-3"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="fw-bold small text-dark mb-1" style={{ lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.title}
                  </div>
                  <small className="text-muted">
                    <i className="fa-regular fa-clock me-1"></i> {r.createdAt ? String(r.createdAt).slice(0, 10) : '26/06/2026'}
                  </small>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-warning"></i>Đường dẫn nhanh
            </div>
            <div className="list-group-tdmu">
              <Link to="/van-ban" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Kho văn bản chỉ đạo
              </Link>
              <Link to="/bieu-mau" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Kho biểu mẫu Word
              </Link>
              <Link to="/phuc-loi-doan-vien" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Chính sách &amp; Trợ cấp
              </Link>
              <Link to="/lien-he" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Hòm thư góp ý
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaiViet;
