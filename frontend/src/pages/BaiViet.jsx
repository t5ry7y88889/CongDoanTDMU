import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isSaved, toggleBookmark } from '../lib/bookmarks';

const currentUser = {
  name: 'TS. Lê Thị Kim Út',
  unit: 'Tổ CĐ Viện Công nghệ số',
  initials: 'KU',
  email: 'lethikimut@tdmu.edu.vn'
};

const formatTime = (s) => {
  if (!s) return new Date().toLocaleString('vi-VN');
  const [datePart, timePart] = String(s).replace('T', ' ').split(' ');
  const d = datePart ? datePart.split('-') : [];
  const t = timePart ? timePart.slice(0, 5) : '';
  if (d.length === 3) return `${d[2]}/${d[1]}/${d[0]} ${t}`;
  return s;
};

const BaiViet = () => {
  const [params] = useSearchParams();
  const articleId = parseInt(params.get('id') || '1', 10);

  const [article, setArticle] = useState(null);
  const [allArticles, setAllArticles] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [claps, setClaps] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [savedVersion, setSavedVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [single, list] = await Promise.all([
        fetch(`/api/articles/${articleId}`).then((r) => r.json()).catch(() => null),
        fetch('/api/articles?status=all').then((r) => r.json()).catch(() => null)
      ]);
      if (cancelled) return;
      const data = single && single.success && single.data ? single.data : null;
      const listData = list && list.success && Array.isArray(list.data) ? list.data : [];
      let found = data;
      if (!found) found = listData.find((a) => parseInt(a.id, 10) === articleId) || listData[0] || null;
      setArticle(found);
      setAllArticles(listData);
      if (found && found.title) document.title = `${found.title} - Công Đoàn TDMU`;
    })();
    return () => { cancelled = true; };
  }, [articleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/articles/${articleId}/comments`).then((r) => r.json()).catch(() => null);
      if (cancelled) return;
      setComments(res && res.success && Array.isArray(res.data) ? res.data : []);
    })();
    return () => { cancelled = true; };
  }, [articleId]);

  useEffect(() => {
    const refresh = () => setSavedVersion((v) => v + 1);
    window.addEventListener('bookmarks:changed', refresh);
    return () => window.removeEventListener('bookmarks:changed', refresh);
  }, []);

  const saved = useMemo(() => (article ? isSaved(article.id) : false), [article, savedVersion]);

  const nextArticle = useMemo(
    () => (allArticles.length ? allArticles.find((a) => parseInt(a.id, 10) !== articleId) || null : null),
    [allArticles, articleId]
  );

  const takeawayList = (article && article.ai_takeaways && article.ai_takeaways.length
    ? article.ai_takeaways
    : (article && article.summary ? [article.summary] : []));

  const bodyHtml = useMemo(() => {
    if (!article) return '';
    let html = article.content || `<p>${article.summary || ''}</p>`;
    if (article.image && !html.includes(article.image)) {
      html = `<div class="text-center mb-4"><img src="${article.image}" class="img-fluid rounded shadow-sm" style="max-height:480px;width:100%;object-fit:cover;" alt="${article.title || ''}"><p class="text-muted small mt-2 fst-italic">${article.title || ''}</p></div>` + html;
    }
    return html;
  }, [article]);

  const toggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt chưa hỗ trợ Web Speech API.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      const text = `${article.title}. ${article.summary || ''}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  const onBookmark = async (e) => {
    e.preventDefault();
    if (!article) return;
    const msg = await toggleBookmark(article);
    alert(`✅ ${msg}`);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) {
      alert('Vui lòng nhập nội dung bình luận!');
      return;
    }
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.name,
          email: currentUser.email,
          position: currentUser.unit,
          content: text
        })
      });
      const json = await res.json();
      if (json && json.success && json.data) {
        const c = json.data;
        setComments((prev) => [{
          name: c.name || currentUser.name,
          unit: c.position || currentUser.unit,
          initials: currentUser.initials,
          text: c.content,
          bg: 'bg-primary',
          time: formatTime(c.createdAt)
        }, ...prev]);
        setCommentText('');
        alert('Đã gửi ý kiến bình luận của bạn thành công!');
      } else {
        alert((json && json.error) || 'Không gửi được bình luận, vui lòng thử lại!');
      }
    } catch (err) {
      alert('Không gửi được bình luận, vui lòng thử lại!');
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
  };

  const toggleLike = () => setLiked((v) => !v);

  const totalComments = comments.length;

  return (
    <div className="container my-4">
      <div className="breadcrumb-box">
        <a href="/">Trang chủ</a> / <a href="/tin-tuc">Tin tức &amp; Sự kiện</a> /{' '}
        <span className="text-muted">{article ? article.categoryName || 'Tin tức' : 'Hoạt động công đoàn'}</span>
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          <article className="article-main-container">
            <div className="mb-2">
              <span className="badge" style={{ background: '#002855', color: '#FEF08A', fontWeight: 700, fontSize: '11.5px', padding: '6px 12px' }}>
                {(article ? article.categoryName || 'TIN TỨC' : 'TIN TỨC').toUpperCase()}
              </span>
            </div>
            <h1 className="article-headline">{article ? article.title : 'Đang tải bài viết...'}</h1>

            {article && (
              <>
                <div className="article-meta-bar">
                  <div className="d-flex align-items-center gap-3">
                    <span><i className="fa-solid fa-user-pen text-primary me-1"></i> <strong>{article.author || 'Ban Biên Tập'}</strong></span>
                    <span><i className="fa-regular fa-calendar text-primary me-1"></i> {(article.createdAt || '').split(' ')[0] || '2026-06-26'}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span><i className="fa-regular fa-clock me-1 text-warning"></i> {(article.readingTime || '3 phút')} đọc</span>
                    <span><i className="fa-regular fa-eye me-1 text-success"></i> {article.viewsCount || 162} lượt xem</span>
                    <span><i className="fa-regular fa-comment-dots me-1 text-primary"></i> {totalComments} bình luận</span>
                  </div>
                </div>

                <div className="audio-narration-card">
                  <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-primary rounded-circle" onClick={toggleAudio} style={{ width: '44px', height: '44px', background: '#002855', borderColor: '#002855' }}>
                      <i className={`fa-solid ${speaking ? 'fa-pause text-warning' : 'fa-play'}`}></i>
                    </button>
                    <div>
                      <div className="fw-bold text-dark">{speaking ? 'Đang phát thanh bản tin...' : 'Phát Thanh Bản Tin Trực Tuyến'}</div>
                      <div className="text-muted small">Phát thanh tự động tiếng Việt chuẩn phát thanh viên</div>
                    </div>
                  </div>
                  <span className="badge bg-white text-primary border p-2"><i className="fa-solid fa-volume-high me-1"></i> Trực tuyến</span>
                </div>

                {takeawayList.length > 0 && (
                  <div className="ai-takeaways-card">
                    <h6><i className="fa-solid fa-wand-magic-sparkles me-2 text-success"></i> Điểm Nhấn Bản Tin (Tóm tắt cốt lõi)</h6>
                    <ul className="mb-0 ps-3 text-secondary small" style={{ lineHeight: 1.6 }}>
                      {takeawayList.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}

                <div className="article-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

                <div className="border-top border-bottom py-3 my-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2">
                    <button className={`reaction-pill${liked ? ' liked' : ''}`} onClick={toggleLike}>
                      <i className="fa-solid fa-heart text-danger"></i> <span>{(article.viewsCount ? Math.max(0, article.viewsCount - 400) : 128) + (liked ? 1 : 0)}</span> Thích
                    </button>
                    <button className="reaction-pill" onClick={() => setClaps((c) => c + 1)}>
                      <i className="fa-solid fa-hands-clapping text-warning"></i> <span>{64 + claps}</span> Vỗ tay
                    </button>
                    <button className="reaction-pill" onClick={onBookmark}>
                      <i className={`fa-${saved ? 'solid' : 'regular'} fa-bookmark text-primary`}></i> {saved ? 'Đã lưu' : 'Lưu đọc sau'}
                    </button>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-primary fw-bold" onClick={copyLink}>
                      <i className="fa-solid fa-share-nodes me-1"></i> Chia sẻ bài viết
                    </button>
                  </div>
                </div>
              </>
            )}

            <section className="mt-4 pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0" style={{ color: '#002855', fontSize: '18px' }}>
                  <i className="fa-solid fa-comments text-primary me-2"></i> Ý Kiến &amp; Bình Luận Đoàn Viên ({totalComments})
                </h4>
                <span className="text-muted small">Quy chế trao đổi văn minh &amp; xây dựng</span>
              </div>

              <form className="p-3 bg-light rounded border mb-4 shadow-sm" onSubmit={submitComment}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{currentUser.initials[0]}</div>
                    <div style={{ fontSize: '13px' }}>
                      Đang bình luận với tư cách: <strong className="text-primary">{currentUser.name}</strong>
                      <span className="badge bg-white text-secondary border ms-1">{currentUser.unit}</span>
                    </div>
                  </div>
                  <span className="text-muted" style={{ fontSize: '11px' }}><i className="fa-solid fa-shield-halved text-success me-1"></i> Xác thực tài khoản TDMU</span>
                </div>
                <div className="mb-2">
                  <textarea className="form-control" rows="3" placeholder="Nhập ý kiến thảo luận hoặc cảm nhận của bạn về bài viết này..." style={{ fontSize: '13.5px' }} value={commentText} onChange={(e) => setCommentText(e.target.value)}></textarea>
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-sm btn-primary fw-bold px-4 py-2" style={{ background: '#002855', borderColor: '#002855', borderRadius: '6px' }}>
                    <i className="fa-solid fa-paper-plane me-1 text-warning"></i> Gửi Bình Luận
                  </button>
                </div>
              </form>

              <div>
                {comments.map((c, i) => (
                  <CommentRow key={i} c={c} />
                ))}
                <div className="d-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '42px', height: '42px', flexShrink: 0 }}>VL</div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong className="text-dark">ThS. Võ Quốc Lương</strong>
                        <span className="badge bg-light text-primary border ms-2 small">Tổ CĐ Viện Công nghệ số</span>
                      </div>
                      <small className="text-muted"><i className="fa-regular fa-clock me-1"></i> 26/06/2026 14:20</small>
                    </div>
                    <p className="mb-0 text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>Chương trình tọa đàm rất bổ ích và thiết thực cho cán bộ giảng viên trong trường. Cảm ơn Ban Nữ công đã tổ chức chu đáo!</p>
                  </div>
                </div>
                <div className="d-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm">
                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '42px', height: '42px', flexShrink: 0 }}>LK</div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong className="text-dark">Đ/c Huỳnh Thị Lệ Kha</strong>
                        <span className="badge bg-light text-primary border ms-2 small">Tổ CĐ Trường Luật &amp; Quản lý</span>
                      </div>
                      <small className="text-muted"><i className="fa-regular fa-clock me-1"></i> 26/06/2026 15:05</small>
                    </div>
                    <p className="mb-0 text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>Nhiều kiến thức dinh dưỡng khoa học rất hữu ích để áp dụng vào bữa cơm gia đình hàng ngày. Mong Công đoàn tiếp tục duy trì các chuyên đề như thế này!</p>
                  </div>
                </div>
              </div>
            </section>

            {nextArticle && (
              <div className="p-3 bg-light rounded border mt-4">
                <div className="text-muted small fw-bold text-uppercase mb-2"><i className="fa-solid fa-arrow-right text-primary me-1"></i> Bài viết tiếp theo cùng chuyên mục:</div>
                <h5 className="fw-bold mb-1"><Link to={`/bai-viet?id=${nextArticle.id}`} className="text-decoration-none text-primary">{nextArticle.title}</Link></h5>
                <div className="text-muted small">{nextArticle.categoryName || 'Phong trào thi đua'} | {(nextArticle.readingTime || '4 phút')} đọc</div>
              </div>
            )}
          </article>
        </div>

        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-fire me-2 text-danger"></i>Đọc nhiều nhất</div>
            <div className="list-group-tdmu">
              {allArticles.slice(0, 5).map((a) => (
                <Link to={`/bai-viet?id=${a.id}`} key={a.id} className={`list-group-item${parseInt(a.id, 10) === articleId ? ' fw-bold text-primary bg-light' : ''}`}>
                  <i className="fa-solid fa-angle-right me-1 text-muted small"></i> {a.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div className="list-group-tdmu">
              <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU</a>
              <a href="https://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
              <a href="https://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
              <a href="https://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentRow = ({ c }) => {
  const name = c.name || 'Đoàn viên TDMU';
  const initials = c.initials || name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="d-flex gap-3 mb-3 p-3 bg-white border rounded shadow-sm">
      <div className={`rounded-circle ${c.bg || 'bg-primary'} text-white d-flex align-items-center justify-content-center fw-bold`} style={{ width: '42px', height: '42px', flexShrink: 0 }}>{initials}</div>
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <div>
            <strong className="text-dark">{name}</strong>
            <span className="badge bg-light text-primary border ms-2 small">{c.unit || c.position || ''}</span>
          </div>
          <small className="text-muted"><i className="fa-regular fa-clock me-1"></i> {c.time || formatTime(c.createdAt)}</small>
        </div>
        <p className="mb-0 text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{c.text ?? c.content}</p>
      </div>
    </div>
  );
};

export default BaiViet;