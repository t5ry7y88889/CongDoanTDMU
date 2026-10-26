import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as Diff from 'diff';
import CKArticleEditor from '../components/editor/CKArticleEditor';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function isMachineGeneratedCaption(cap) {
  if (!cap) return true;
  const s = String(cap).trim().replace(/\.[a-zA-Z0-9]{2,5}$/, '');
  if (s.length < 4) return true;
  if (/^[0-9_a-fA-F\-]{8,}$/.test(s)) return true;
  if (/^\d{8,}/.test(s)) return true;
  if (/^(img|dsc|photo|image|pic|screenshot|zalo|fb|facebook|capture|media|file|unnamed)[\d_\-]/i.test(s)) return true;
  if (/^\d+_[a-zA-Z0-9_]+$/.test(s)) return true;
  if (s.includes('1789')) return true;
  if (!/[a-zA-Z\u00C0-\u1EF9]/.test(s)) return true;
  return false;
}

function resolveJournalisticPhotoCaption(photo, index = 0, eventTitle = '', genre = '') {
  let cap = (typeof photo === 'string' ? photo : (photo?.caption || photo?.title || photo?.name || photo?.fileName || '')).trim();
  cap = cap.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();

  // If already a valid, human or AI-generated caption with meaningful Vietnamese words
  if (!isMachineGeneratedCaption(cap) && cap.length >= 6) {
    return cap;
  }

  // Dynamic contextual fallback based on event title (ABSOLUTELY NO HARDCODED TEMPLATES)
  const cleanContext = (eventTitle || genre || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (cleanContext) {
    return `Hình ảnh hoạt động ghi nhận tại ${cleanContext.slice(0, 80)}`;
  }
  return 'Hình ảnh hoạt động Công đoàn Trường Đại học Thủ Dầu Một';
}

async function getFilesFromDataTransferItems(items) {
  const fileList = [];
  const queue = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) queue.push(entry);
    } else if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) fileList.push(f);
    }
  }
  async function traverse(entry) {
    if (!entry) return;
    if (entry.isFile) {
      try {
        const file = await new Promise((res, rej) => entry.file(res, rej));
        if (!file.name.startsWith('.') && !file.name.startsWith('~$') && file.name !== 'Thumbs.db') fileList.push(file);
      } catch {}
    } else if (entry.isDirectory) {
      const dr = entry.createReader();
      const readE = () => new Promise((res, rej) => dr.readEntries(res, rej));
      try {
        let es = await readE();
        while (es && es.length > 0) {
          for (const ch of es) await traverse(ch);
          es = await readE();
        }
      } catch {}
    }
  }
  for (const e of queue) await traverse(e);
  return fileList;
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const navSections = [
  { label: 'TỔNG QUAN', items: [
    { id: 'dashboard', label: 'Bảng Điều Hành', icon: 'fa-solid fa-gauge-high', color: '#38BDF8' }
  ]},
  { label: 'TRUYỀN THÔNG ĐA KÊNH', items: [
    { id: 'articles', label: 'Quản Lý Tin Tức', icon: 'fa-solid fa-newspaper', color: '#60A5FA' },
    { id: 'ai-creator', label: 'Soạn Thảo & Biên Tập', icon: 'fa-solid fa-wand-magic-sparkles', color: '#F59E0B', badge: 'CMS' },
    { id: 'schedule', label: 'Lịch Xuất Bản', icon: 'fa-solid fa-calendar-check', color: '#C084FC' },
    { id: 'documents', label: 'Kho Văn Bản', icon: 'fa-solid fa-folder-open', color: '#34D399' },
    { id: 'templates', label: 'Kho Biểu Mẫu', icon: 'fa-solid fa-file-word', color: '#0284C7', count: '5' }
  ]},
  { label: 'NGHIỆP VỤ CÔNG ĐOÀN', items: [
    { id: 'feedback', label: 'Hòm Thư Góp Ý', icon: 'fa-solid fa-envelope-open-text', color: '#EC4899' },
    { id: 'welfare', label: 'Quỹ Chăm Lo & Trợ Cấp', icon: 'fa-solid fa-hand-holding-heart', color: '#F59E0B' },
    { id: 'users', label: 'Cán Bộ & Phân Quyền', icon: 'fa-solid fa-users-gear', color: '#F87171' },
    { id: 'audits', label: 'Nhật Ký Tác Nghiệp', icon: 'fa-solid fa-clock-rotate-left', color: '#A78BFA' }
  ]}
];

const navTitles = {
  'dashboard': 'Bảng Điều Hành & Thống Kê',
  'articles': 'Quản Lý Tin Tức & Bài Viết',
  'ai-creator': 'Soạn Thảo & Biên Tập',
  'schedule': 'Lịch Xuất Bản Đa Kênh',
  'documents': 'Kho Văn Bản Chỉ Đạo & Điều Hành',
  'templates': 'Kho Biểu Mẫu Nghiệp Vụ Công Đoàn',
  'feedback': 'Hòm Thư Góp Ý & Nguyện Vọng',
  'welfare': 'Quản Lý Quỹ Chăm Lo & Trợ Cấp Đoàn Viên',
  'users': 'Cán Bộ & Phân Quyền',
  'audits': 'Nhật Ký Tác Nghiệp Hệ Thống'
};

const FB_EMOJIS = ['📢','🎓','✨','🏆','🔥','❤️','📌','🤝','⚽','🎉','👏','💪','🌟','📸','🎯'];
const FB_HASHTAGS = ['#CongDoanTDMU','#HoatDongDoanVien','#TDMU2026','#GiaoVienTDMU','#DoanVienCongDoan','#TruongThuDauMot'];
const ZALO_TEMPLATES = [
  { label: 'Thông báo hoạt động', text: '*THÔNG BÁO CÔNG ĐOÀN TDMU*\n\nKính gửi Quý Thầy/Cô Đoàn viên,\n\n[Nội dung thông báo]\n\nTrân trọng kính thông báo!\n— Ban Thường Vụ Công Đoàn Trường' },
  { label: 'Mời tham dự sự kiện', text: '*THƯ MỜI THAM DỰ*\n\nBan Chấp Hành Công Đoàn trân trọng kính mời Quý Thầy/Cô tham dự:\n\n🗓 Thời gian: [Ngày giờ]\n📍 Địa điểm: [Địa điểm]\n📌 Nội dung: [Nội dung]\n\nKính mong Quý Thầy/Cô thu xếp tham dự đầy đủ!' },
  { label: 'Chúc mừng / Khen thưởng', text: '*CHÚC MỪNG & KHEN THƯỞNG*\n\nBan Chấp Hành Công Đoàn Trường ĐHTDM trân trọng chúc mừng:\n\n🏆 [Tên tập thể/cá nhân] đã đạt thành tích xuất sắc trong [lĩnh vực].\n\nĐây là nguồn cảm hứng cho toàn thể Đoàn viên trong năm học mới! 💪' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminStudio() {

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeNav, setActiveNav] = useState('ai-creator');

  // ── Content ──────────────────────────────────────────────────────────────────
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [title, setTitle] = useState('');
  const [sapo, setSapo] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [activeChannel, setActiveChannel] = useState('web');

  // ── Facebook Studio ───────────────────────────────────────────────────────────
  const [fbCaption, setFbCaption] = useState('');
  const [fbSelectedPhotos, setFbSelectedPhotos] = useState([]);
  const [fbRatio, setFbRatio] = useState('1:1');

  // ── Zalo Studio ───────────────────────────────────────────────────────────────
  const [zaloText, setZaloText] = useState('');
  const [zaloPhoto, setZaloPhoto] = useState(null);
  const [senderPhoneInput, setSenderPhoneInput] = useState('0912345678');
  const [recipientPhoneInput, setRecipientPhoneInput] = useState('0386543483');
  const [zaloTargetMode, setZaloTargetMode] = useState('group'); // 'group' | 'personal'
  const [zaloGroupLink, setZaloGroupLink] = useState('https://zalo.me/g/wdhpzaoap7wkxb074exv');
  const [zaloGroupName, setZaloGroupName] = useState('Nhóm Công Đoàn TDMU');
  const [zaloBotStatus, setZaloBotStatus] = useState({ isConnected: false, botInfo: null });
  const [zaloQrModalOpen, setZaloQrModalOpen] = useState(false);
  const [zaloQrImage, setZaloQrImage] = useState('');
  const [zaloQrMessage, setZaloQrMessage] = useState('');
  const [zaloQrStatus, setZaloQrStatus] = useState('');

  // ── Schedule ──────────────────────────────────────────────────────────────────
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleChannels, setScheduleChannels] = useState({ web: true, fb: true, zalo: false });
  const [schedulesList, setSchedulesList] = useState([]);

  // ── Omnichannel Multi-channel Publishing ──────────────────────────────────────
  const [omnichannelModalOpen, setOmnichannelModalOpen] = useState(false);
  const [isPublishingNow, setIsPublishingNow] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [omniChannels, setOmniChannels] = useState({ web: true, fb: true, zalo: true });

  // ── Multi-Account Selection State (Zalo & Facebook) ─────────────────────────
  const [channelAccounts, setChannelAccounts] = useState({ zalo: [], facebook: [] });
  const [selectedZaloAccId, setSelectedZaloAccId] = useState('zalo-default');
  const [selectedFbAccId, setSelectedFbAccId] = useState('fb-default');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState('zalo');
  const [editingAccountData, setEditingAccountData] = useState({
    id: '',
    name: '',
    type: 'personal',
    oaId: '',
    accessToken: '',
    pageId: '',
    pageName: '',
    oaName: '',
    senderPhone: '0912345678',
    recipientPhone: '0386543483',
    recipientUserId: '',
    isDefault: false
  });

  // ── Drafts drawer ─────────────────────────────────────────────────────────────
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [draftsList, setDraftsList] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);

  // ── Right AI panel ────────────────────────────────────────────────────────────
  const [rightWidth, setRightWidth] = useState(360);
  const [rightPinned, setRightPinned] = useState(true);
  const [rightHovered, setRightHovered] = useState(false);
  const isDragging = useRef(false);

  // ── Autosave ──────────────────────────────────────────────────────────────────
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Selection + AI ────────────────────────────────────────────────────────────
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInlineLoading, setAiInlineLoading] = useState(false); // Bubble Menu loading state

  // ── Unified Snapshot Stack (Rollback duy nhất cho cả Groq + Gemini + User) ──
  const [snapshotStack, setSnapshotStack] = useState([]); // [{id, ts, label, by, title, sapo, bodyHtml}]
  const pushSnapshot = useCallback((label = 'Thay đổi', by = 'user') => {
    const snap = {
      id: Date.now(),
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label,
      by,
      title: titleRef.current?.value ?? title,
      sapo: sapoRef.current?.value ?? sapo,
      bodyHtml: editorRef.current?.getHTML?.() ?? editorRef.current?.getData?.() ?? editorRef.current?.innerHTML ?? bodyHtml,
    };
    setSnapshotStack(prev => [...prev.slice(-19), snap]); // Giữ tối đa 20 snapshots
    return snap;
  }, [title, sapo, bodyHtml]);

  // ── Rollback & Branching Tree State ──────────────────────────────────────────
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editPromptText, setEditPromptText] = useState('');
  const [rollbackNotification, setRollbackNotification] = useState('');
  const [activeDiff, setActiveDiff] = useState(null);
  const [chatMessages, setChatMessages] = useState([{
    id: 1, sender: 'ai',
    text: 'Trợ lý Biên tập Công đoàn TDMU đã sẵn sàng. Bôi đen đoạn văn để yêu cầu hiệu đính, hoặc gửi yêu cầu tổng hợp bài viết.',
    ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);

  // ── Files & Photos ────────────────────────────────────────────────────────────
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]); // [{url, caption, isFeatured}]
  const featuredPhoto = eventPhotos.find(p => p.isFeatured) || eventPhotos[0];
  const [activeDossier, setActiveDossier] = useState(null);

  // ── Autopilot ─────────────────────────────────────────────────────────────────
  const [autopilotPrompt, setAutopilotPrompt] = useState('');
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  // ── Inspector modal ───────────────────────────────────────────────────────────
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('text');

  // ── AI Settings Modal ─────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('groq_api_key') || '');

  const saveAiSettings = (gKey, qKey) => {
    localStorage.setItem('gemini_api_key', (gKey || '').trim());
    localStorage.setItem('groq_api_key', (qKey || '').trim());
    setGeminiKey((gKey || '').trim());
    setGroqKey((qKey || '').trim());
    setSettingsOpen(false);
    alert('✅ Đã cập nhật cấu hình API Key cho AI Vision & Biên tập tin bài thành công!');
  };

  // ── Drop zone ─────────────────────────────────────────────────────────────────
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const sapoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const portalIframeRef = useRef(null);
  const fbFileInputRef = useRef(null);
  const zaloFileInputRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVITY LOG
  // ═══════════════════════════════════════════════════════════════════════════
  const log = useCallback((text, status = 'done') => {
    setActivityLog(prev => [...prev.slice(-29), { text, status, id: Date.now() }]);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAFTS
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchDrafts = useCallback(async () => {
    try {
      setDraftsLoading(true);
      const res = await fetch('/api/articles/drafts');
      const data = await res.json();
      if (data.success) setDraftsList(data.data || []);
    } catch {}
    finally { setDraftsLoading(false); }
  }, []);

  useEffect(() => {
    fetchDrafts();
    try {
      const saved = JSON.parse(localStorage.getItem('tdmu_react_studio_draft') || '{}');
      if (saved.title || saved.bodyHtml) {
        setTitle(saved.title || ''); setSapo(saved.sapo || ''); setBodyHtml(saved.bodyHtml || '');
        if (saved.activeArticleId) setActiveArticleId(saved.activeArticleId);
        if (editorRef.current && saved.bodyHtml) editorRef.current.innerHTML = saved.bodyHtml;
      }
    } catch {}
  }, []);

  // Auto-expand Headline & Sapo textareas according to text content
  useEffect(() => {
    if (titleRef.current && activeNav === 'ai-creator') {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${Math.max(54, titleRef.current.scrollHeight)}px`;
    }
  }, [title, activeChannel, activeNav]);

  useEffect(() => {
    if (sapoRef.current && activeNav === 'ai-creator') {
      sapoRef.current.style.height = 'auto';
      sapoRef.current.style.height = `${Math.max(80, sapoRef.current.scrollHeight)}px`;
    }
  }, [sapo, activeChannel, activeNav]);

  // Switch tab in embedded portal instantly with zero reload
  const syncPortalTab = useCallback((tabId) => {
    if (tabId === 'ai-creator' || !portalIframeRef.current?.contentWindow) return;
    try {
      if (typeof portalIframeRef.current.contentWindow.showAdminTab === 'function') {
        portalIframeRef.current.contentWindow.showAdminTab(tabId);
      } else {
        portalIframeRef.current.contentWindow.location.hash = tabId;
      }
    } catch {}
  }, []);

  // Sync activeNav with URL hash (#dashboard, #articles, #schedule, etc.)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['dashboard', 'articles', 'ai-creator', 'schedule', 'documents', 'templates', 'feedback', 'users', 'audits'];
      if (hash && validTabs.includes(hash)) {
        setActiveNav(hash);
        syncPortalTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [syncPortalTab]);

  // Listen for navigation messages from embedded admin portal
  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data && e.data.type === 'NAVIGATE_TAB') {
        const tab = e.data.tab || 'ai-creator';
        setActiveNav(tab);
        window.location.hash = tab;
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const handleNavClick = (id) => {
    setActiveNav(id);
    window.location.hash = id;
    syncPortalTab(id);
  };

  const handlePortalIframeLoad = () => {
    if (activeNav !== 'ai-creator') {
      syncPortalTab(activeNav);
    }
  };

  const newArticle = async () => {
    // Giống ChatGPT: lưu bản hiện tại vào DB trước khi tạo mới
    if (title.trim() || bodyHtml.trim()) {
      setIsSaving(true);
      try {
        const payload = {
          title: title.trim() || 'Bản Thảo Chưa Đặt Tên',
          summary: sapo, content: editorRef.current?.innerHTML || bodyHtml,
          status: 'draft', author: 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một', image: featuredPhoto?.url || ''
        };
        if (activeArticleId) {
          await fetch(`/api/articles/${activeArticleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
          const res = await fetch('/api/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
          if (res.success && res.data?.id) {
            // Ghi nhớ ID vào localStorage để tránh tạo trùng
            localStorage.setItem('tdmu_react_studio_draft', JSON.stringify({ title: payload.title, sapo, bodyHtml: payload.content, activeArticleId: res.data.id, timestamp: new Date().toISOString() }));
          }
        }
      } catch {}
      setIsSaving(false);
      fetchDrafts();
    }
    // Clear canvas — bắt đầu bài mới
    setTitle(''); setSapo(''); setBodyHtml(''); setActiveArticleId(null);
    setSelectedText(''); setActiveDiff(null); setAttachedFiles([]); setEventPhotos([]);
    setFbCaption(''); setZaloText(''); setActivityLog([]);
    if (editorRef.current) {
      if (editorRef.current.setData) editorRef.current.setData('');
      else editorRef.current.innerHTML = '';
    }
    localStorage.removeItem('tdmu_react_studio_draft');
  };

  const resetArticle = () => {
    if (!window.confirm('Bạn có chắc muốn xóa trắng toàn bộ bài viết để làm lại từ đầu không? Mọi nội dung chưa lưu sẽ bị xóa.')) return;
    setTitle('');
    setSapo('');
    setBodyHtml('');
    setActiveArticleId(null);
    setSelectedText('');
    setActiveDiff(null);
    setAttachedFiles([]);
    setEventPhotos([]);
    setFbCaption('');
    setZaloText('');
    setActivityLog([]);
    if (editorRef.current) {
      if (editorRef.current.setData) editorRef.current.setData('');
      else editorRef.current.innerHTML = '';
    }
    localStorage.removeItem('tdmu_react_studio_draft');
    setChatMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: 'Trợ lý Biên tập sẵn sàng hỗ trợ. Quý Thầy/Cô có thể nạp hồ sơ tư liệu hoặc nhập yêu cầu biên tập tin bài!',
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const formatDateTime = (val) => {
    if (!val) return 'Chưa ghi nhận';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return 'Bản nháp';
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${time} ${date}`;
    } catch {
      return 'Bản nháp';
    }
  };

  const switchDraft = (d) => {
    setTitle(d.title || ''); setSapo(d.summary || ''); setBodyHtml(d.content || '');
    setActiveArticleId(d.id); setSelectedText(''); setActiveDiff(null);
    if (d.packageData?.facebook?.caption) {
      setFbCaption(d.packageData.facebook.caption);
    } else if (d.title) {
      setFbCaption(`${d.title}\n\n${d.summary || ''}\n\n#CongDoanTDMU #TDMU`);
    }
    if (d.packageData?.zalo?.message) {
      setZaloText(d.packageData.zalo.message);
    }
    if (editorRef.current) {
      if (editorRef.current.setData) editorRef.current.setData(d.content || '');
      else editorRef.current.innerHTML = d.content || '';
    }
  };

  const deleteDraft = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Xóa bản thảo này?')) return;
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (activeArticleId === id) newArticle();
      fetchDrafts();
    } catch (err) { alert('Lỗi xóa: ' + err.message); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOSAVE — chỉ lưu localStorage, KHÔNG tạo bản thảo DB mới
  // Logic giống ChatGPT: 1 khung làm bài = 1 draft, tự lưu vào chính nó
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const t = setTimeout(() => {
      if (!title && !bodyHtml && !sapo) return;
      // Chỉ lưu localStorage — không gọi API DB
      localStorage.setItem('tdmu_react_studio_draft', JSON.stringify({
        title, sapo, bodyHtml, activeArticleId, timestamp: new Date().toISOString()
      }));
      setLastSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 2000);
    return () => clearTimeout(t);
  }, [title, sapo, bodyHtml, activeArticleId]);

  // title auto-resize (dãn theo chữ)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${Math.max(50, titleRef.current.scrollHeight)}px`;
    }
  }, [title]);

  // sapo auto-resize
  useEffect(() => {
    if (sapoRef.current) {
      sapoRef.current.style.height = 'auto';
      sapoRef.current.style.height = `${Math.max(68, sapoRef.current.scrollHeight)}px`;
    }
  }, [sapo]);

  // Auto-scroll chat to bottom on new messages or progress updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL DRAG/DROP TRAP
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const stop = e => e.preventDefault();
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => { window.removeEventListener('dragover', stop); window.removeEventListener('drop', stop); };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SPLIT-PANE RESIZER
  // ═══════════════════════════════════════════════════════════════════════════
  const startResize = (e) => {
    e.preventDefault(); isDragging.current = true;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    const onMove = ev => { if (!isDragging.current) return; const w = window.innerWidth - ev.clientX; if (w >= 260 && w <= 700) setRightWidth(w); };
    const onUp = () => { isDragging.current = false; document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION
  // ═══════════════════════════════════════════════════════════════════════════
  const handleEditorSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (text.length > 2 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      setSelectedText(text);
      try { setSelectionRange(sel.getRangeAt(0).cloneRange()); } catch {}
    }
  };
  const clearSelection = () => {
    setSelectedText('');
    setSelectionRange(null);
    if (editorRef.current?.clearSelection) {
      try { editorRef.current.clearSelection(); } catch {}
    }
    window.getSelection()?.removeAllRanges();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AI COPILOT
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // AI COPILOT ENGINE - SERVER-SIDE AUTONOMOUS AGENT
  // ═══════════════════════════════════════════════════════════════════════════
  const handleExportWord = async () => {
    try {
      const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
      const res = await fetch('/api/articles/export/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sapo, bodyHtml: currentHtml, author: 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một' })
      });
      if (!res.ok) throw new Error('Không thể xuất tệp Word');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(title || 'BaiBao_TDMU').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi xuất Word: ' + err.message);
    }
  };

  const handleExportPdf = async () => {
    try {
      const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
      const res = await fetch('/api/articles/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sapo, bodyHtml: currentHtml, author: 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một' })
      });
      if (!res.ok) throw new Error('Không thể xuất tệp PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(title || 'BaiBao_TDMU').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi xuất PDF: ' + err.message);
    }
  };

  const showRollbackToast = (text) => {
    setRollbackNotification(text);
    setTimeout(() => setRollbackNotification(''), 3000);
  };

  const streamAgentResponse = async ({ prompt, assistantMsgId, historyMessages = [], baseContextHtml, overrideSelectedText }) => {
    try {
      const currentHtml = baseContextHtml !== undefined ? baseContextHtml : (editorRef.current?.getData ? editorRef.current.getData() : bodyHtml);
      const activeSelectedText = overrideSelectedText !== undefined 
        ? overrideSelectedText 
        : (selectedText || editorRef.current?.getSelectedText?.() || '');

      const res = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...historyMessages.filter(m => (m.sender === 'user' || m.sender === 'ai') && m.text).map(m => ({ sender: m.sender, text: m.text })),
            { sender: 'user', text: prompt }
          ],
          context: {
            platform: activeChannel,
            article: { 
              id: activeArticleId, 
              title, 
              sapo, 
              bodyHtml: currentHtml 
            },
            attachedFiles,
            eventPhotos,
            selectedText: activeSelectedText,
            channelContent: {
              fbCaption,
              zaloText
            }
          },
          apiKey: localStorage.getItem('gemini_api_key') || '',
          groqApiKey: localStorage.getItem('groq_api_key') || ''
        })
      });

      if (!res.body) throw new Error('Không nhận được stream từ Agent Server');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'text-delta') {
              setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? {
                ...m,
                text: (m.text || '') + (ev.delta || '')
              } : m));
            } else if (ev.type === 'tool-status' || ev.type === 'tool-call') {
              setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? {
                ...m,
                toolCalls: [
                  ...(m.toolCalls || []).filter(tc => tc.toolName !== ev.toolName),
                  { toolName: ev.toolName, statusText: ev.statusText || `Đang gọi ${ev.toolName}...`, status: 'running' }
                ]
              } : m));
            } else if (ev.type === 'tool-result') {
              setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? {
                ...m,
                toolCalls: (m.toolCalls || []).map(tc => tc.toolName === ev.toolName ? {
                  ...tc,
                  status: 'done',
                  result: ev.result
                } : tc)
              } : m));

              // Tác động trực tiếp vào Canvas hoặc giao diện dựa trên kết quả Tool
              if (ev.result && ev.result.action) {
                pushSnapshot(`AI Copilot: ${ev.result.action}`, 'gemini');
                if (ev.result.action === 'replace_selection' && ev.result.revisedText) {
                  let applied = false;
                  let cleanText = (ev.result.revisedText || '').trim();

                  // Vệ sinh & phòng thủ: Nếu phản hồi dính tiền tố xin lỗi hoặc prompt markers
                  if (/^(tôi xin lỗi|xin lỗi|dưới đây là|kết quả:)/i.test(cleanText) || cleanText.includes('YÊU CẦU CHỈNH SỬA') || cleanText.includes('ĐOẠN VĂN MỚI ĐÃ SỬA')) {
                    const quotedMatch = cleanText.match(/["'“]([^"'“”]{2,})["'”]$/);
                    if (quotedMatch && quotedMatch[1]) {
                      cleanText = quotedMatch[1].trim();
                    } else {
                      console.warn('[AdminStudio] Bỏ qua kết quả AI lỗi hoặc dính lời xin lỗi:', cleanText);
                      cleanText = '';
                    }
                  }

                  if (!cleanText) return;

                  // 1. Thử thay thế trực tiếp qua CKEditor model selection/range
                  if (editorRef.current?.replaceSelection) {
                    try {
                      editorRef.current.replaceSelection(cleanText);
                      const checkData = editorRef.current.getData?.() || '';
                      if (checkData.includes(cleanText)) applied = true;
                    } catch {}
                  }

                  // 2. Thử thay thế chuỗi trên HTML nội dung
                  const curData = editorRef.current?.getData ? editorRef.current.getData() : bodyHtml;
                  const targetStr = (ev.result.targetText || selectedText || '').trim();
                  if (!applied && targetStr && curData) {
                    if (curData.includes(targetStr)) {
                      const nextHtml = curData.replace(targetStr, cleanText);
                      if (editorRef.current?.setData) editorRef.current.setData(nextHtml);
                      setBodyHtml(nextHtml);
                      applied = true;
                    } else {
                      // Tìm đoạn paragraph tương đồng nhất trong HTML và thay thế
                      const targetSnippet = targetStr.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      const pReg = new RegExp(`<p\\b[^>]*>[^<]*${targetSnippet}[^<]*<\\/p>`, 'i');
                      if (pReg.test(curData)) {
                        const nextHtml = curData.replace(pReg, `<p>${cleanText}</p>`);
                        if (editorRef.current?.setData) editorRef.current.setData(nextHtml);
                        setBodyHtml(nextHtml);
                        applied = true;
                      }
                    }
                  }

                  if (applied) {
                    const updated = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || '');
                    setBodyHtml(updated);
                    showRollbackToast('✨ Đã sửa đoạn văn bản trực tiếp trên Canvas!');
                  } else {
                    console.warn('[AdminStudio] Không tìm thấy vị trí targetText để tự thay thế, không tự ý chèn xuống cuối bài.');
                  }

                  clearSelection();
                } else if (ev.result.action === 'replace_block' && ev.result.newBlockHtml) {
                  const curData = editorRef.current?.getData ? editorRef.current.getData() : bodyHtml;
                  let nextHtml = curData;
                  if (ev.result.isFullReplace) {
                    nextHtml = ev.result.newBlockHtml;
                  } else if (ev.result.headingTarget && curData.includes(ev.result.headingTarget)) {
                    nextHtml = curData.replace(ev.result.headingTarget, ev.result.newBlockHtml);
                  } else {
                    nextHtml = curData ? `${curData}\n${ev.result.newBlockHtml}` : ev.result.newBlockHtml;
                  }
                  if (editorRef.current?.setData) editorRef.current.setData(nextHtml);
                  setBodyHtml(nextHtml);
                  showRollbackToast(ev.result.isFullReplace ? '📰 Đã cập nhật toàn bộ nội dung bài viết!' : '📝 Đã thay thế phân đoạn trên Canvas!');
                } else if (ev.result.action === 'insert_block' && ev.result.contentHtml) {
                  const curData = editorRef.current?.getData ? editorRef.current.getData() : bodyHtml;
                  const nextHtml = ev.result.position === 'top' ? (ev.result.contentHtml + '\n' + curData) : (curData + '\n' + ev.result.contentHtml);
                  if (editorRef.current?.setData) editorRef.current.setData(nextHtml);
                  setBodyHtml(nextHtml);
                } else if (ev.result.action === 'update_headline' && ev.result.headline) {
                  setTitle(ev.result.headline);
                  if (titleRef.current) {
                    titleRef.current.value = ev.result.headline;
                    titleRef.current.style.height = 'auto';
                    titleRef.current.style.height = `${Math.max(54, titleRef.current.scrollHeight)}px`;
                  }
                  showRollbackToast(`📰 Đã cập nhật tiêu đề mới: "${ev.result.headline.slice(0, 35)}..."`);
                } else if (ev.result.action === 'update_sapo' && ev.result.sapo) {
                  setSapo(ev.result.sapo);
                  if (sapoRef.current) {
                    sapoRef.current.value = ev.result.sapo;
                    sapoRef.current.style.height = 'auto';
                    sapoRef.current.style.height = `${Math.max(68, sapoRef.current.scrollHeight)}px`;
                  }
                  showRollbackToast(`📝 Đã cập nhật đoạn mở đầu Sapo 5W1H!`);
                } else if (ev.result.action === 'update_facebook' && ev.result.content) {
                  setFbCaption(ev.result.content);
                } else if (ev.result.action === 'update_zalo' && ev.result.content) {
                  setZaloText(ev.result.content);
                } else if (ev.result.action === 'insert_channel_links') {
                  if (activeChannel === 'fb' && ev.result.facebookSnippet) {
                    setFbCaption(prev => prev ? prev.trim() + '\n\n' + ev.result.facebookSnippet : ev.result.facebookSnippet);
                    showRollbackToast('Đã chèn liên kết vào Facebook!');
                  } else if (activeChannel === 'zalo' && ev.result.zaloSnippet) {
                    setZaloText(prev => prev ? prev.trim() + '\n\n' + ev.result.zaloSnippet : ev.result.zaloSnippet);
                    showRollbackToast('Đã chèn liên kết vào Zalo OA!');
                  }
                } else if (ev.result.action === 'insert_photo') {
                  insertPhoto(ev.result.imageUrl, ev.result.caption);
                } else if (ev.result.action === 'draft_saved') {
                  fetchDrafts();
                  setLastSaveTime('Đã lưu ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                }
              }
            } else if (ev.type === 'finish') {
              // Lưu snapshot phiên bản câu trả lời của AI bao gồm đầy đủ Tiêu đề, Sapo, Canvas và Đa kênh
              setChatMessages(prev => prev.map(m => {
                if (m.id === assistantMsgId) {
                  const finalHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
                  const finalSnap = {
                    title: titleRef.current?.value !== undefined ? titleRef.current.value : (title || ''),
                    sapo: sapoRef.current?.value !== undefined ? sapoRef.current.value : (sapo || ''),
                    bodyHtml: finalHtml,
                    fbCaption: fbCaption || '',
                    zaloText: zaloText || ''
                  };
                  const newVer = {
                    text: m.text,
                    toolCalls: m.toolCalls || [],
                    ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    canvasSnapshot: finalHtml,
                    articleSnapshot: finalSnap
                  };
                  const currentVers = m.versions || [];
                  const updatedVers = [...currentVers, newVer];
                  return {
                    ...m,
                    canvasSnapshot: finalHtml,
                    articleSnapshot: finalSnap,
                    versions: updatedVers,
                    versionIndex: updatedVers.length - 1
                  };
                }
                return m;
              }));
            }
          } catch {}
        }
      }
    } catch (err) {
      setChatMessages(p => p.map(m => m.id === assistantMsgId ? {
        ...m,
        text: (m.text ? m.text + '\n\n' : '') + '⚠️ Lỗi Agent: ' + err.message
      } : m));
    } finally {
      setAiLoading(false);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ── Article Snapshot Helpers (Title, Sapo, Canvas, Facebook, Zalo) ───────────
  const captureArticleSnapshot = () => ({
    title: titleRef.current?.value !== undefined ? titleRef.current.value : (title || ''),
    sapo: sapoRef.current?.value !== undefined ? sapoRef.current.value : (sapo || ''),
    bodyHtml: editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml || ''),
    fbCaption: fbCaption || '',
    zaloText: zaloText || ''
  });

  const restoreArticleSnapshot = (snap) => {
    if (!snap) return;
    if (typeof snap === 'string') {
      setBodyHtml(snap);
      if (editorRef.current?.setData) editorRef.current.setData(snap);
      return;
    }
    if (snap.title !== undefined) {
      setTitle(snap.title);
      if (titleRef.current) {
        titleRef.current.value = snap.title;
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = `${Math.max(54, titleRef.current.scrollHeight)}px`;
      }
    }
    if (snap.sapo !== undefined) {
      setSapo(snap.sapo);
      if (sapoRef.current) {
        sapoRef.current.value = snap.sapo;
        sapoRef.current.style.height = 'auto';
        sapoRef.current.style.height = `${Math.max(68, sapoRef.current.scrollHeight)}px`;
      }
    }
    const body = snap.bodyHtml !== undefined ? snap.bodyHtml : null;
    if (body !== null && body !== undefined) {
      setBodyHtml(body);
      if (editorRef.current?.setData) editorRef.current.setData(body);
    }
    if (snap.fbCaption !== undefined) setFbCaption(snap.fbCaption);
    if (snap.zaloText !== undefined) setZaloText(snap.zaloText);
  };

  // Cập nhật restoreArticleSnapshot để tương thích TiptapEditor (getHTML/setHTML)
  const restoreEditorHTML = (html) => {
    if (!html) return;
    setBodyHtml(html);
    if (editorRef.current) {
      // Tiptap: dùng setHTML
      if (typeof editorRef.current.setHTML === 'function') editorRef.current.setHTML(html);
      // CKEditor fallback: dùng setData
      else if (typeof editorRef.current.setData === 'function') editorRef.current.setData(html);
      // Plain fallback
      else editorRef.current.innerHTML = html;
    }
  };

  // ── Rollback từ Snapshot Stack (nút Hoàn tác toàn cầu) ──────────────────────
  const rollbackFromStack = useCallback(() => {
    if (snapshotStack.length === 0) return;
    const prev = snapshotStack[snapshotStack.length - 1];
    setSnapshotStack(s => s.slice(0, -1));
    // Restore
    if (prev.title !== undefined) {
      setTitle(prev.title);
      if (titleRef.current) { titleRef.current.value = prev.title; titleRef.current.style.height = 'auto'; titleRef.current.style.height = `${Math.max(54, titleRef.current.scrollHeight)}px`; }
    }
    if (prev.sapo !== undefined) {
      setSapo(prev.sapo);
      if (sapoRef.current) { sapoRef.current.value = prev.sapo; sapoRef.current.style.height = 'auto'; sapoRef.current.style.height = `${Math.max(68, sapoRef.current.scrollHeight)}px`; }
    }
    if (prev.bodyHtml !== undefined) restoreEditorHTML(prev.bodyHtml);
    const byLabel = { groq: '⚡ Groq', gemini: '🧠 Gemini', user: '✏️ Bạn', autopilot: '🤖 Autopilot' }[prev.by] || prev.by;
    setRollbackNotification(`↩️ Đã hoàn tác về "${prev.label}" (${byLabel} · ${prev.ts})`);
    setTimeout(() => setRollbackNotification(''), 4000);
    log(`↩️ Hoàn tác về: ${prev.label}`, 'done');
  }, [snapshotStack, log]);

  // ── AI Inline Edit (Bubble Menu → Groq qwen3.8-27b) ─────────────────────────
  const handleAiInlineEdit = useCallback(async (selectedText, instruction) => {
    if (!selectedText?.trim() || !instruction?.trim()) return;
    setAiInlineLoading(true);

    // Capture snapshot TRƯỚC khi sửa
    pushSnapshot(`Sửa tại chỗ: "${selectedText.slice(0, 30)}..."`, 'groq');

    try {
      const res = await fetch('/api/ai/inline-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          instruction,
          action: 'rewrite',
          fullContext: editorRef.current?.getHTML?.() ?? editorRef.current?.getData?.() ?? bodyHtml,
          apiKey: groqKey || undefined,
          preferGroq: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');

      const rewritten = (data.rewrittenText || data.result || '').trim();
      if (!rewritten) throw new Error('AI không trả về kết quả');

      // Apply vào đúng chỗ selection của CKEditor
      let applied = false;
      if (editorRef.current?.replaceSelection) {
        applied = editorRef.current.replaceSelection(rewritten);
      }
      if (!applied) {
        // Fallback: thay thế chuỗi trên HTML
        const currentHtml = editorRef.current?.getHTML?.() ?? editorRef.current?.getData?.() ?? bodyHtml;
        if (currentHtml.includes(selectedText)) {
          const newHtml = currentHtml.replace(selectedText, rewritten);
          restoreEditorHTML(newHtml);
        }
      }
      setTimeout(() => {
        const newHtml = editorRef.current?.getHTML?.() ?? editorRef.current?.getData?.() ?? '';
        if (newHtml) setBodyHtml(newHtml);
      }, 50);
      clearSelection();
      log(`✨ Groq Qwen sửa tại chỗ: "${selectedText.slice(0, 30)}..."`, 'done');
      showRollbackToast('✨ Đã sửa đoạn văn bản thành công!');
    } catch (err) {
      // Rollback nếu lỗi
      setSnapshotStack(s => s.slice(0, -1));
      setRollbackNotification(`❌ Lỗi inline edit: ${err.message}`);
      setTimeout(() => setRollbackNotification(''), 3000);
      log(`❌ Inline edit thất bại: ${err.message}`, 'error');
    } finally {
      setAiInlineLoading(false);
    }
  }, [bodyHtml, groqKey, pushSnapshot, log, clearSelection]);

  const runAi = async (overridePrompt = null) => {
    const prompt = (overridePrompt || aiPrompt).trim();
    if (!prompt) return;
    setAiPrompt('');

    // Nhận diện intent: Nếu là lệnh viết toàn bài tự động -> chuyển sang runAutopilot
    const isWritingCommand = /^(viết\s*(đi|bài|báo|tin)?|lập\s*(bài|báo)?|tạo\s*bài|bắt\s*đầu\s*viết|chấp\s*bút|generate|write)/i.test(prompt);
    if (isWritingCommand && !selectedText && activeChannel === 'web') {
      runAutopilot(prompt);
      return;
    }

    setAiLoading(true);
    const capturedSelected = selectedText || editorRef.current?.getSelectedText?.() || '';
    const isSelection = Boolean(capturedSelected);
    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;
    const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
    const currentSnap = captureArticleSnapshot();

    const newUserMsg = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      scope: isSelection ? `Đoạn (${capturedSelected.length} ký tự)` : 'Toàn bài',
      selectedText: capturedSelected,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      canvasSnapshot: currentHtml,
      articleSnapshot: currentSnap,
      versions: [
        {
          text: prompt,
          selectedText: capturedSelected,
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          canvasSnapshot: currentHtml,
          articleSnapshot: currentSnap,
          subsequentMessages: []
        }
      ],
      versionIndex: 0
    };

    const newAssistantMsg = {
      id: assistantMsgId,
      sender: 'ai',
      text: '',
      toolCalls: [],
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      promptUserMsgId: userMsgId,
      initialCanvasSnapshot: currentHtml,
      initialArticleSnapshot: currentSnap,
      selectedText: capturedSelected,
      versions: [],
      versionIndex: 0
    };

    const historyMessages = [...chatMessages];
    setChatMessages(p => [...p, newUserMsg, newAssistantMsg]);

    await streamAgentResponse({
      prompt,
      assistantMsgId,
      historyMessages,
      baseContextHtml: currentHtml,
      overrideSelectedText: capturedSelected
    });
  };

  // 1. Chỉnh sửa lệnh của User (Edit Prompt)
  const startEditUserPrompt = (msg) => {
    setEditingMsgId(msg.id);
    setEditPromptText(msg.text || '');
  };

  const cancelEditUserPrompt = () => {
    setEditingMsgId(null);
    setEditPromptText('');
  };

  const submitEditUserPrompt = async (msgId) => {
    const newPrompt = editPromptText.trim();
    if (!newPrompt) return;

    const msgIdx = chatMessages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    const userMsg = chatMessages[msgIdx];
    const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
    const currentSnap = captureArticleSnapshot();

    // Snapshot nhánh hiện tại vào phiên bản hiện tại trước khi rẽ nhánh mới
    const currentVerIdx = userMsg.versionIndex || 0;
    const existingVersions = userMsg.versions && userMsg.versions.length > 0 
      ? [...userMsg.versions]
      : [{ text: userMsg.text, ts: userMsg.ts, canvasSnapshot: userMsg.canvasSnapshot || currentHtml, articleSnapshot: userMsg.articleSnapshot || currentSnap, subsequentMessages: chatMessages.slice(msgIdx + 1) }];

    existingVersions[currentVerIdx] = {
      ...existingVersions[currentVerIdx],
      subsequentMessages: chatMessages.slice(msgIdx + 1),
      canvasSnapshot: currentHtml,
      articleSnapshot: currentSnap
    };

    const activeSelectedText = userMsg.selectedText || selectedText || editorRef.current?.getSelectedText?.() || '';
    const restoreSnap = userMsg.articleSnapshot || userMsg.canvasSnapshot || currentSnap;
    const restoreCanvas = restoreSnap?.bodyHtml || (typeof restoreSnap === 'string' ? restoreSnap : currentHtml);

    const newVersion = {
      text: newPrompt,
      selectedText: activeSelectedText,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      canvasSnapshot: restoreCanvas,
      articleSnapshot: restoreSnap,
      subsequentMessages: []
    };
    const updatedVersions = [...existingVersions, newVersion];
    const newVerIdx = updatedVersions.length - 1;

    // Khôi phục canvas & toàn bộ bài viết về trạng thái trước khi chạy các lệnh sau
    restoreArticleSnapshot(restoreSnap);

    const assistantMsgId = Date.now() + 1;
    const newAssistantMsg = {
      id: assistantMsgId,
      sender: 'ai',
      text: '',
      toolCalls: [],
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      promptUserMsgId: userMsg.id,
      initialCanvasSnapshot: restoreCanvas,
      initialArticleSnapshot: restoreSnap,
      selectedText: activeSelectedText,
      versions: [],
      versionIndex: 0
    };

    const updatedUserMsg = {
      ...userMsg,
      text: newPrompt,
      selectedText: activeSelectedText,
      articleSnapshot: restoreSnap,
      canvasSnapshot: restoreCanvas,
      versions: updatedVersions,
      versionIndex: newVerIdx
    };

    const historyMessages = chatMessages.slice(0, msgIdx);
    setChatMessages([...historyMessages, updatedUserMsg, newAssistantMsg]);
    setEditingMsgId(null);
    setEditPromptText('');
    setAiLoading(true);

    showRollbackToast(`Đã tạo nhánh phiên bản lệnh mới (${newVerIdx + 1}/${updatedVersions.length})`);
    await streamAgentResponse({
      prompt: newPrompt,
      assistantMsgId,
      historyMessages,
      baseContextHtml: restoreCanvas,
      overrideSelectedText: activeSelectedText
    });
  };

  // 2. Chuyển đổi giữa các phiên bản lệnh của User (< 1 / 3 >)
  const navigateUserPromptVersion = (msgId, direction) => {
    const msgIdx = chatMessages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    const userMsg = chatMessages[msgIdx];
    if (!userMsg.versions || userMsg.versions.length <= 1) return;

    const curIdx = userMsg.versionIndex || 0;
    const targetIdx = curIdx + direction;
    if (targetIdx < 0 || targetIdx >= userMsg.versions.length) return;

    const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
    const currentSnap = captureArticleSnapshot();

    // Lưu snapshot nhánh hiện tại
    const updatedVersions = [...userMsg.versions];
    updatedVersions[curIdx] = {
      ...updatedVersions[curIdx],
      subsequentMessages: chatMessages.slice(msgIdx + 1),
      canvasSnapshot: currentHtml,
      articleSnapshot: currentSnap
    };

    const targetVer = updatedVersions[targetIdx];
    const restoredUserMsg = {
      ...userMsg,
      text: targetVer.text,
      versionIndex: targetIdx,
      versions: updatedVersions
    };

    // Khôi phục toàn bộ bài viết (Title, Sapo, Canvas, FB, Zalo)
    restoreArticleSnapshot(targetVer.articleSnapshot || targetVer.canvasSnapshot);

    // Khôi phục chat branch
    setChatMessages([
      ...chatMessages.slice(0, msgIdx),
      restoredUserMsg,
      ...(targetVer.subsequentMessages || [])
    ]);

    showRollbackToast(`Đã chuyển sang phiên bản lệnh ${targetIdx + 1}/${updatedVersions.length}`);
  };

  // 3. Tạo lại câu trả lời AI (Regenerate Response)
  const regenerateAiResponse = async (aiMsgId) => {
    const aiIdx = chatMessages.findIndex(m => m.id === aiMsgId);
    if (aiIdx === -1) return;

    const aiMsg = chatMessages[aiIdx];
    const prevUserMsg = chatMessages.slice(0, aiIdx).reverse().find(m => m.sender === 'user');
    if (!prevUserMsg) return;

    const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
    const currentSnap = captureArticleSnapshot();

    // Khôi phục canvas & bài viết về trước khi AI này can thiệp
    const baseSnap = aiMsg.initialArticleSnapshot || prevUserMsg.articleSnapshot || aiMsg.initialCanvasSnapshot || prevUserMsg.canvasSnapshot || currentSnap;
    restoreArticleSnapshot(baseSnap);

    const baseCanvas = baseSnap?.bodyHtml || (typeof baseSnap === 'string' ? baseSnap : currentHtml);
    const activeSelectedText = aiMsg.selectedText || prevUserMsg.selectedText || selectedText || editorRef.current?.getSelectedText?.() || '';

    // Lưu câu trả lời hiện tại vào versions nếu chưa có
    const curVer = {
      text: aiMsg.text,
      toolCalls: aiMsg.toolCalls || [],
      ts: aiMsg.ts,
      canvasSnapshot: currentHtml,
      articleSnapshot: currentSnap
    };
    const existingVersions = aiMsg.versions && aiMsg.versions.length > 0
      ? [...aiMsg.versions]
      : [curVer];

    // Reset nội dung đang hiển thị để chuẩn bị stream lượt mới
    setChatMessages(prev => prev.map(m => m.id === aiMsgId ? {
      ...m,
      text: '',
      toolCalls: [],
      selectedText: activeSelectedText,
      versions: existingVersions,
      versionIndex: existingVersions.length
    } : m));

    setAiLoading(true);
    showRollbackToast('Đang tạo lại phương án trả lời mới...');

    const historyMessages = chatMessages.slice(0, aiIdx - 1);
    await streamAgentResponse({
      prompt: prevUserMsg.text,
      assistantMsgId: aiMsgId,
      historyMessages,
      baseContextHtml: baseCanvas,
      overrideSelectedText: activeSelectedText
    });
  };

  // 4. Chuyển đổi giữa các câu trả lời của AI (< 1 / 2 >)
  const navigateAiResponseVersion = (aiMsgId, direction) => {
    const aiMsg = chatMessages.find(m => m.id === aiMsgId);
    if (!aiMsg || !aiMsg.versions || aiMsg.versions.length <= 1) return;

    const curIdx = aiMsg.versionIndex || 0;
    const targetIdx = curIdx + direction;
    if (targetIdx < 0 || targetIdx >= aiMsg.versions.length) return;

    const targetVer = aiMsg.versions[targetIdx];
    setChatMessages(prev => prev.map(m => m.id === aiMsgId ? {
      ...m,
      text: targetVer.text,
      toolCalls: targetVer.toolCalls || [],
      versionIndex: targetIdx
    } : m));

    restoreArticleSnapshot(targetVer.articleSnapshot || targetVer.canvasSnapshot);

    showRollbackToast(`Đã chuyển sang câu trả lời ${targetIdx + 1}/${aiMsg.versions.length}`);
  };

  // 5. Rollback nhiều lượt quay lại thời điểm này
  const rollbackToTurn = (msgId) => {
    const msgIdx = chatMessages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    const msg = chatMessages[msgIdx];
    // NẾU là tin nhắn AI: Người dùng bấm rollback để HOÀN TÁC thay đổi của AI này,
    // nên cần khôi phục trạng thái TRƯỚC KHI AI CHẠY (initialArticleSnapshot) và xóa bỏ lượt trả lời này!
    // NẾU là tin nhắn User: Khôi phục trạng thái trước khi gửi lệnh này (articleSnapshot)
    const isAi = msg.sender === 'ai';
    const snap = isAi
      ? (msg.initialArticleSnapshot || msg.initialCanvasSnapshot || msg.articleSnapshot)
      : (msg.articleSnapshot || msg.canvasSnapshot || msg.initialArticleSnapshot);

    if (snap) {
      restoreArticleSnapshot(snap);
    }

    if (isAi) {
      // Cắt bỏ lượt trả lời của AI này và tất cả tin nhắn sau nó
      setChatMessages(chatMessages.slice(0, msgIdx));
      showRollbackToast('↩️ Đã hoàn tác toàn bộ thay đổi của AI và đưa bài viết về trạng thái trước đó!');
    } else {
      // Cắt bỏ lượt lệnh này và các câu trả lời sau nó, đưa text lệnh vào ô nhập để người dùng gõ lại
      setChatMessages(chatMessages.slice(0, msgIdx));
      setAiPrompt(msg.text || '');
      showRollbackToast('↩️ Đã rollback bài viết về trước lượt lệnh này!');
    }
  };

  const acceptDiff = (targetDiff = null) => {
    const diff = targetDiff || activeDiff;
    if (!diff) return;
    if (diff.isSelection) {
      if (editorRef.current?.replaceSelection) {
        editorRef.current.replaceSelection(diff.rewritten);
      }
      clearSelection();
      const updated = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || '');
      setBodyHtml(updated);
    } else {
      if (editorRef.current?.setData) {
        const clean = diff.rewritten.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
        editorRef.current.setData(clean);
        setBodyHtml(clean);
      }
    }
    // Cập nhật trạng thái tại chỗ trong thẻ Diff, ngăn spam nút bấm và spam tin nhắn lặp lại
    setChatMessages(prev => prev.map(m => (m.id === diff.id) ? { ...m, isAccepted: true } : m));
    setActiveDiff(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE HANDLING & DOSSIER CARDS
  // ═══════════════════════════════════════════════════════════════════════════
  const processFiles = useCallback(async (files, append = false) => {
    const validFiles = Array.from(files).filter(f => !f.name.startsWith('~$') && !f.name.startsWith('.') && f.name !== 'Thumbs.db');
    if (!validFiles.length) return;

    const newFileObjs = []; const newPhotos = [];
    for (const f of validFiles) {
      if (f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)) {
        const url = await readAsDataURL(f);
        newFileObjs.push({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB', type: 'image', dataUrl: url });
        newPhotos.push({
          url,
          caption: '👁️ AI Vision đang xem ảnh...',
          isFeatured: false,
          fileName: f.name,
          isAnalyzingVision: true
        });
      } else {
        let extractedText = f.extractedText || '';
        if (!extractedText) {
          try {
            const b64 = await readAsDataURL(f);
            const pRes = await fetch('/api/documents/parse-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileBase64: b64, fileName: f.name })
            }).then(r => r.json());
            if (pRes.success && pRes.text) {
              extractedText = pRes.text;
            }
          } catch (pErr) {
            console.warn('[Parse document error for ' + f.name + ']:', pErr);
          }
        }
        newFileObjs.push({
          name: f.name,
          size: (f.size / 1024).toFixed(1) + ' KB',
          type: f.type || 'document',
          text: extractedText
        });
      }
    }
    setAttachedFiles(prev => {
      const base = append ? prev : [];
      // CHỐNG TRÙNG LẶP FILE: Lọc theo tên file (case-insensitive)
      const existingNames = new Set(base.map(f => f.name.toLowerCase()));
      const filteredNew = newFileObjs.filter(f => !existingNames.has(f.name.toLowerCase()));
      return [...base, ...filteredNew];
    });
    setEventPhotos(prev => {
      const base = append ? prev : [];
      // CHỐNG TRÙNG LẶP ẢNH: Lọc theo URL dữ liệu ảnh
      const existingUrls = new Set(base.map(p => p.url));
      const filteredNew = newPhotos.filter(p => !existingUrls.has(p.url));
      const combined = [...base, ...filteredNew];
      if (combined.length > 0 && !combined.some(p => p.isFeatured)) combined[0].isFeatured = true;
      return combined;
    });

    // Tự động phân tích ảnh đa phương thức (Multimodal AI Vision) trong nền
    newPhotos.forEach(async (photo) => {
      try {
        const res = await fetch('/api/ai/vision-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: photo.url,
            fileName: photo.fileName,
            context: title || 'Công đoàn Trường Đại học Thủ Dầu Một',
            apiKey: localStorage.getItem('gemini_api_key') || '',
            groqApiKey: localStorage.getItem('groq_api_key') || ''
          })
        });
        const data = await res.json();
        if (data.success && data.caption) {
          setEventPhotos(prev => prev.map(p => (p.url === photo.url ? { ...p, caption: data.caption, isAnalyzingVision: false } : p)));
        } else {
          setEventPhotos(prev => prev.map(p => (p.url === photo.url ? { ...p, caption: resolveJournalisticPhotoCaption({ caption: photo.fileName }, 0, title), isAnalyzingVision: false } : p)));
        }
      } catch (err) {
        console.warn('[Vision Caption Frontend Error]:', err);
        setEventPhotos(prev => prev.map(p => (p.url === photo.url ? { ...p, caption: resolveJournalisticPhotoCaption({ caption: photo.fileName }, 0, title), isAnalyzingVision: false } : p)));
      }
    });

    // CHỐNG CHỒNG THẺ HỒ SƠ: Xóa thẻ dossier cũ, chỉ giữ 1 thẻ duy nhất
    setChatMessages(p => {
      const withoutOld = p.filter(m => m.type !== 'dossier');
      return [
        ...withoutOld,
        {
          id: Date.now(),
          sender: 'ai',
          type: 'dossier',
          fileCount: validFiles.length,
          photoCount: newPhotos.length,
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    });
  }, [title]);

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
    if (e.dataTransfer?.items) {
      const files = await getFilesFromDataTransferItems(e.dataTransfer.items);
      if (files.length > 0) { await processFiles(files, true); return; }
    }
    if (e.dataTransfer?.files) await processFiles(e.dataTransfer.files, true);
  };

  const insertPhoto = (url, caption = '') => {
    if (!editorRef.current) return;
    if (editorRef.current.insertPhoto) {
      editorRef.current.insertPhoto(url, caption);
    } else {
      const html = `<figure class="image"><img src="${url}" alt="${escHtml(caption)}" /><figcaption>${escHtml(caption || 'Hình ảnh sự kiện tại Trường Đại học Thủ Dầu Một')}</figcaption></figure><p></p>`;
      document.execCommand('insertHTML', false, html);
    }
    const updated = editorRef.current.getData ? editorRef.current.getData() : (editorRef.current.innerHTML || '');
    setBodyHtml(updated);
  };

  const setFeaturedPhoto = (idx) => {
    setEventPhotos(prev => prev.map((p, i) => ({ ...p, isFeatured: i === idx })));
  };

  const removePhoto = (idx) => {
    setEventPhotos(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some(p => p.isFeatured)) next[0].isFeatured = true;
      return next;
    });
  };

  const updatePhotoCaption = (idx, newCap) => {
    setEventPhotos(prev => prev.map((p, i) => i === idx ? { ...p, caption: newCap } : p));
  };

  const triggerAiVision = async (idx) => {
    const photo = eventPhotos[idx];
    if (!photo) return;
    setEventPhotos(prev => prev.map((p, i) => i === idx ? { ...p, isAnalyzingVision: true } : p));
    try {
      const res = await fetch('/api/ai/vision-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo.url,
          fileName: photo.fileName,
          context: title || aiPrompt || 'Công đoàn Trường Đại học Thủ Dầu Một',
          apiKey: localStorage.getItem('gemini_api_key') || '',
          groqApiKey: localStorage.getItem('groq_api_key') || ''
        })
      });
      const data = await res.json();
      if (data.success && data.caption) {
        setEventPhotos(prev => prev.map((p, i) => i === idx ? { ...p, caption: data.caption, isAnalyzingVision: false } : p));
      } else {
        setEventPhotos(prev => prev.map((p, i) => i === idx ? { ...p, isAnalyzingVision: false } : p));
      }
    } catch (e) {
      setEventPhotos(prev => prev.map((p, i) => i === idx ? { ...p, isAnalyzingVision: false } : p));
    }
  };

  const removeAttachedFile = (fileName) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const clearAllAttachments = () => {
    if (!window.confirm('Bạn có chắc muốn xóa sạch toàn bộ hồ sơ tư liệu và ảnh đã nạp?')) return;
    setAttachedFiles([]);
    setEventPhotos([]);
    setChatMessages(prev => prev.filter(m => m.type !== 'dossier'));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOPILOT GENERATE (SSE STREAM IN CHAT PROGRESS)
  // ═══════════════════════════════════════════════════════════════════════════
  const runAutopilot = async (customPrompt = null) => {
    const promptToUse = customPrompt || autopilotPrompt || aiPrompt;
    if (!promptToUse && !attachedFiles.length) {
      alert('Vui lòng nạp hồ sơ tư liệu hoặc nhập yêu cầu chỉ đạo trong ô chat!');
      return;
    }
    pushSnapshot(`Trước khi chạy Autopilot: "${(promptToUse || 'Chấp bút').slice(0, 30)}..."`, 'autopilot');
    setAutopilotLoading(true);
    setAiPrompt('');

    const progressMsgId = Date.now();
    setChatMessages(p => [
      ...p,
      {
        id: progressMsgId,
        sender: 'ai',
        type: 'progress',
        title: '⚡ Trợ lý AI: Đang soạn thảo bài viết tự động',
        steps: [
          { id: 'read', text: 'Đang đọc hiểu & bóc tách toàn bộ tư liệu nguồn...', status: 'running' }
        ],
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      const payload = {
        sourceText: '',
        userPrompt: promptToUse || 'Lập bài báo website truyền thông Công Đoàn TDMU hoàn chỉnh, trang trọng từ hồ sơ tư liệu.',
        filesInfo: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type, text: f.text || '' })),
        photos: eventPhotos,
        apiKey: localStorage.getItem('gemini_api_key') || '',
        groqApiKey: localStorage.getItem('groq_api_key') || ''
      };
      const response = await fetch('/api/ai/autopilot-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.body) throw new Error('Không nhận được stream từ server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let webHtml = '';
      let fbCap = '';
      let zaloMsg = '';

      setChatMessages(p => p.map(m => m.id === progressMsgId ? {
        ...m,
        steps: [
          { id: 'read', text: 'Đã phân tích hồ sơ tư liệu nguồn', status: 'done' },
          { id: 'stream', text: 'Đang chấp bút Master Article & stream lên Canvas...', status: 'running' }
        ]
      } : m));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.step === 'web_chunk') {
              webHtml += evt.chunk || '';
              
              // Trích xuất Title và Sapo theo thời gian thực để cập nhật các ô thông tin phía trên
              const tMatch = webHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
              if (tMatch) {
                const extTitle = tMatch[1].replace(/<[^>]*>/g, '').trim();
                if (extTitle) setTitle(extTitle);
              }
              const sMatch = webHtml.match(/<p class="sapo"[^>]*>([\s\S]*?)<\/p>/i);
              if (sMatch) {
                const extSapo = sMatch[1].replace(/<[^>]*>/g, '').trim();
                if (extSapo) setSapo(extSapo);
              }

              // Cập nhật state bài viết đồng bộ liên tục
              setBodyHtml(webHtml);
              if (editorRef.current) {
                if (editorRef.current.setData) editorRef.current.setData(webHtml);
                else editorRef.current.innerHTML = webHtml;
              }
            } else if (evt.step === 'social_done') {
              fbCap = evt.facebook?.caption || '';
              zaloMsg = evt.zalo?.message || '';
              setFbCaption(fbCap);
              setZaloText(zaloMsg);
              setChatMessages(p => p.map(m => m.id === progressMsgId ? {
                ...m,
                steps: [
                  ...m.steps.map(s => s.id === 'stream' ? { ...s, status: 'done' } : s),
                  { id: 'social', text: 'Chuyển thể thành công FB Fanpage & Zalo OA', status: 'done' },
                  { id: 'finalize', text: 'Đang hoàn tất và lưu trữ bản thảo...', status: 'running' }
                ]
              } : m));
            } else if (evt.step === 'all_done') {
              if (evt.title) setTitle(evt.title);
              if (evt.summary) setSapo(evt.summary);
              const finalHtml = evt.webContent || webHtml;
              setBodyHtml(finalHtml);
              if (editorRef.current?.setData) editorRef.current.setData(finalHtml);
              setActiveArticleId(evt.articleId || null);
              fetchDrafts();
              setChatMessages(p => p.map(m => m.id === progressMsgId ? {
                ...m,
                steps: [
                  ...m.steps.map(s => ({ ...s, status: 'done' })),
                  { id: 'done', text: '✅ Hoàn tất bài báo! Đã lưu CSDL & Tủ Bản Thảo.', status: 'done' }
                ]
              } : m));
            }
          } catch {}
        }
      }
      if (!webHtml.trim()) throw new Error('AI không trả về nội dung');
    } catch (err) {
      setChatMessages(p => p.map(m => m.id === progressMsgId ? {
        ...m,
        steps: [
          ...m.steps,
          { id: 'err', text: 'Lỗi: ' + err.message, status: 'error' }
        ]
      } : m));
    } finally {
      setAutopilotLoading(false);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FB HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  const insertFbEmoji = (emoji) => {
    setFbCaption(prev => prev + emoji);
  };
  const insertFbHashtag = (tag) => {
    setFbCaption(prev => prev.includes(tag) ? prev : prev.trim() + '\n\n' + tag);
  };
  // Helper sinh URL bài viết công khai
  const getPublicArticleUrl = () => {
    const origin = window.location.origin;
    return activeArticleId ? `${origin}/bai-viet.html?id=${activeArticleId}` : `${origin}/bai-viet.html`;
  };

  // Helper chèn link bài báo 1-click
  const insertArticleLinkToChannel = (target) => {
    const url = getPublicArticleUrl();
    const snippet = target === 'fb' 
      ? `\n\n👉 Đọc toàn văn bài viết tại: ${url}` 
      : `\n\n🔗 *Đọc toàn văn bài viết tại:*\n${url}`;
    
    if (target === 'fb') {
      setFbCaption(prev => prev ? prev.trim() + snippet : snippet.trim());
      showRollbackToast('Đã chèn link bài báo vào Facebook!');
    } else {
      setZaloText(prev => prev ? prev.trim() + snippet : snippet.trim());
      showRollbackToast('Đã chèn link bài báo vào Zalo OA!');
    }
  };

  // Helper chèn link tài liệu 1-click
  const insertDocLinksToChannel = (target) => {
    const docs = (attachedFiles || []).filter(f => f.type !== 'image');
    if (docs.length === 0) {
      alert('Chưa có tệp tài liệu nào trong hồ sơ! Hãy nạp tệp Word, Excel hoặc PDF trước.');
      return;
    }
    const origin = window.location.origin;
    const links = docs.map(f => {
      const fileUrl = f.url || `/api/documents/download/${f.id || encodeURIComponent(f.name)}`;
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
      return `• ${f.name}: ${fullUrl}`;
    }).join('\n');

    const snippet = target === 'fb'
      ? `\n\n📥 TÀI LIỆU / VĂN BẢN ĐÍNH KÈM:\n${links}`
      : `\n\n📥 *TÀI LIỆU HƯỚNG DẪN / BIỂU MẪU ĐÍNH KÈM:*\n${links}`;

    if (target === 'fb') {
      setFbCaption(prev => prev ? prev.trim() + snippet : snippet.trim());
      showRollbackToast(`Đã chèn link ${docs.length} tài liệu vào Facebook!`);
    } else {
      setZaloText(prev => prev ? prev.trim() + snippet : snippet.trim());
      showRollbackToast(`Đã chèn link ${docs.length} tài liệu vào Zalo OA!`);
    }
  };

  // Helper chèn link ảnh sự kiện
  const insertPhotoLinksToChannel = () => {
    if (!eventPhotos || eventPhotos.length === 0) {
      alert('Chưa có ảnh sự kiện nào trong hồ sơ!');
      return;
    }
    const origin = window.location.origin;
    const links = eventPhotos.slice(0, 5).map((p, i) => {
      const fullUrl = p.url.startsWith('http') ? p.url : `${origin}${p.url.startsWith('/') ? '' : '/'}${p.url}`;
      return `📸 Ảnh ${i + 1}${p.caption ? ` (${p.caption})` : ''}: ${fullUrl}`;
    }).join('\n');

    const snippet = `\n\n🖼️ ALBUM HÌNH ẢNH SỰ KIỆN:\n${links}`;
    setFbCaption(prev => prev ? prev.trim() + snippet : snippet.trim());
    showRollbackToast(`Đã chèn link ${Math.min(eventPhotos.length, 5)} ảnh vào Facebook!`);
  };

  // Đồng bộ nhanh từ bài Web (Deterministic instant sync với link bài và tài liệu)
  const syncFbFromWeb = () => {
    if (!title && !sapo && !bodyHtml) { alert('Chưa có nội dung bài viết trên Canvas để đồng bộ!'); return; }
    const cleanTitle = (title || 'Bản Tin Hoạt Động Công Đoàn TDMU').toUpperCase();
    let summary = sapo ? sapo.trim() : '';
    if (!summary && bodyHtml) {
      summary = bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
    }
    const articleUrl = getPublicArticleUrl();
    const docFiles = (attachedFiles || []).filter(f => f.type !== 'image');
    let docSection = '';
    if (docFiles.length > 0) {
      const origin = window.location.origin;
      docSection = '\n\n📥 TÀI LIỆU ĐÍNH KÈM:\n' + docFiles.map(f => {
        const fileUrl = f.url || `/api/documents/download/${f.id || encodeURIComponent(f.name)}`;
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        return `• ${f.name}: ${fullUrl}`;
      }).join('\n');
    }
    let photoNotice = eventPhotos.length > 0 ? `\n\n📸 (Xem trọn bộ album ${Math.min(eventPhotos.length, 4)} ảnh hoạt động bên dưới 👇)` : '';

    setFbCaption(`📢 [TIN HOẠT ĐỘNG CÔNG ĐOÀN TDMU]\n\n🔥 ${cleanTitle}\n\n✨ ${summary}\n\n👉 Kính mời quý Thầy/Cô và Đoàn viên xem toàn văn tại:\n${articleUrl}${docSection}${photoNotice}\n\n#CongDoanTDMU #TDMU2026 #HoatDongDoanVien #ChamLoDoanVien`);
    showRollbackToast('Đã đồng bộ nội dung bài báo lên Facebook!');
  };

  const syncZaloFromWeb = () => {
    if (!title && !sapo && !bodyHtml) { alert('Chưa có nội dung bài viết trên Canvas để đồng bộ!'); return; }
    const cleanTitle = title || 'Thông Báo Hoạt Động Công Đoàn';
    let summary = sapo ? sapo.trim() : '';
    if (!summary && bodyHtml) {
      summary = bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    }
    const articleUrl = getPublicArticleUrl();
    const docFiles = (attachedFiles || []).filter(f => f.type !== 'image');
    let docSection = '';
    if (docFiles.length > 0) {
      const origin = window.location.origin;
      docSection = '\n\n📥 *TÀI LIỆU HƯỚNG DẪN / BIỂU MẪU:*\n' + docFiles.map(f => {
        const fileUrl = f.url || `/api/documents/download/${f.id || encodeURIComponent(f.name)}`;
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        return `• ${f.name}: ${fullUrl}`;
      }).join('\n');
    }

    setZaloText(`*THÔNG BÁO TỪ CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT*\n\n📌 Về việc: *${cleanTitle}*\n\n${summary}\n\n🔗 *Đọc toàn văn bài viết tại Cổng thông tin:*\n${articleUrl}${docSection}\n\nTrân trọng kính thông báo!\n— BAN THƯỜNG VỤ CÔNG ĐOÀN TRƯỜNG`);
    showRollbackToast('Đã đồng bộ nội dung bài báo lên Zalo OA!');
  };

  // Đồng bộ bằng AI chuyên biệt (AI-powered Smart Sync)
  const generateFbWithAi = () => {
    setActiveChannel('fb');
    runAi('Soạn thảo nội dung bài đăng Facebook hấp dẫn, chuẩn viral từ bài báo mới nhất, tự động trích xuất link bài báo và toàn bộ tài liệu đính kèm.');
  };

  const generateZaloWithAi = () => {
    setActiveChannel('zalo');
    runAi('Soạn thảo thông báo phát thanh Zalo OA trang trọng, súc tích từ bài báo mới nhất, tóm tắt ý chính và đính kèm đầy đủ link tài liệu cùng link bài báo.');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // METRICS
  const bodyText = (editorRef.current?.innerText || (bodyHtml ? bodyHtml.replace(/<[^>]*>/g, ' ') : '')).trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const effectiveRightWidth = rightPinned ? rightWidth : (rightHovered ? Math.max(340, rightWidth) : 48);
  // featuredPhoto is computed above at line 250

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLISH
  // ═══════════════════════════════════════════════════════════════════════════
  const saveDraft = async () => {
    if (!title && !bodyHtml) { alert('Vui lòng nhập nội dung!'); return; }
    setIsSaving(true);
    try {
      const payload = { title: title || 'Bản Thảo Chưa Đặt Tên', summary: sapo, content: editorRef.current?.innerHTML || bodyHtml, status: 'draft', author: 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một', image: featuredPhoto?.url || '' };
      let res;
      if (activeArticleId) {
        res = await fetch(`/api/articles/${activeArticleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
      } else {
        res = await fetch('/api/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
        if (res.success && res.data?.id) {
          setActiveArticleId(res.data.id);
          // Cập nhật localStorage với ID mới để autosave sau biết dùng PUT
          localStorage.setItem('tdmu_react_studio_draft', JSON.stringify({ title, sapo, bodyHtml, activeArticleId: res.data.id, timestamp: new Date().toISOString() }));
        }
      }
      if (res.success) {
        fetchDrafts();
        setLastSaveTime('Đã lưu ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else throw new Error(res.error || 'Lỗi lưu');
    } catch (err) { alert('Lỗi: ' + err.message); }
    finally { setIsSaving(false); }
  };

  const fetchSchedulesList = useCallback(async () => {
    try {
      const res = await fetch('/api/publish/schedules').then(r => r.json());
      if (res.success) setSchedulesList(res.data || []);
    } catch {}
  }, []);

  const fetchChannelAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/publish/accounts').then(r => r.json());
      if (res.success && res.data) {
        setChannelAccounts(res.data);
        const defaultZalo = res.data.zalo?.find(a => a.isDefault)?.id || res.data.zalo?.[0]?.id || 'zalo-default';
        const defaultFb = res.data.facebook?.find(a => a.isDefault)?.id || res.data.facebook?.[0]?.id || 'fb-default';
        setSelectedZaloAccId(prev => (res.data.zalo?.some(a => a.id === prev) ? prev : defaultZalo));
        setSelectedFbAccId(prev => (res.data.facebook?.some(a => a.id === prev) ? prev : defaultFb));
        const activeZalo = res.data.zalo?.find(a => a.id === (res.data.zalo?.some(a => a.id === selectedZaloAccId) ? selectedZaloAccId : defaultZalo));
        if (activeZalo?.recipientPhone) {
          setRecipientPhoneInput(activeZalo.recipientPhone);
        }
        if (activeZalo?.senderPhone) {
          setSenderPhoneInput(activeZalo.senderPhone);
        }
      }
    } catch {}
  }, [selectedZaloAccId]);

  const handleSelectZaloAcc = (id) => {
    setSelectedZaloAccId(id);
    const found = channelAccounts.zalo?.find(a => a.id === id);
    if (found?.recipientPhone) {
      setRecipientPhoneInput(found.recipientPhone);
    }
    if (found?.senderPhone) {
      setSenderPhoneInput(found.senderPhone);
    }
  };

  useEffect(() => {
    fetchSchedulesList();
    fetchChannelAccounts();
  }, [fetchSchedulesList, fetchChannelAccounts]);

  const openNewAccountModal = (channel) => {
    setEditingChannel(channel);
    setEditingAccountData({
      id: '',
      name: channel === 'zalo' ? 'Zalo Cá Nhân (Gửi giữa 2 SĐT)' : 'Trang Facebook của tôi',
      type: 'personal',
      oaId: '',
      accessToken: '',
      pageId: '',
      pageName: '',
      oaName: '',
      senderPhone: '0912345678',
      recipientPhone: '0386543483',
      recipientUserId: '',
      isDefault: false
    });
    setAccountModalOpen(true);
  };

  const openEditAccountModal = (channel, accId) => {
    const list = channel === 'facebook' ? channelAccounts.facebook : channelAccounts.zalo;
    const found = list?.find(a => a.id === accId) || list?.[0] || {};
    setEditingChannel(channel);
    setEditingAccountData({
      id: found.id || accId || (channel === 'facebook' ? 'fb-default' : 'zalo-default'),
      name: found.name || (channel === 'zalo' ? 'Zalo Cá Nhân (Gửi giữa 2 SĐT)' : 'Fanpage Công đoàn (Mặc định)'),
      type: found.type || (channel === 'facebook' ? 'page' : 'personal'),
      oaId: found.oaId || '',
      accessToken: found.accessToken || '',
      pageId: found.pageId || (channel === 'facebook' ? '1417956021396650' : ''),
      pageName: found.pageName || (channel === 'facebook' ? 'Công đoàn' : ''),
      oaName: found.oaName || '',
      senderPhone: found.senderPhone || senderPhoneInput || '0912345678',
      recipientPhone: found.recipientPhone || recipientPhoneInput || '0386543483',
      recipientUserId: found.recipientUserId || '',
      isDefault: Boolean(found.isDefault !== undefined ? found.isDefault : true)
    });
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!editingAccountData.name.trim()) {
      alert('Vui lòng nhập tên tài khoản hiển thị!');
      return;
    }
    const cleanAccount = {
      ...editingAccountData,
      name: editingAccountData.name.trim(),
      accessToken: (editingAccountData.accessToken || '').trim(),
      pageId: (editingAccountData.pageId || '').trim(),
      oaId: (editingAccountData.oaId || '').trim(),
      senderPhone: (editingAccountData.senderPhone || '').trim(),
      recipientPhone: (editingAccountData.recipientPhone || '').trim()
    };
    try {
      const res = await fetch('/api/publish/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: editingChannel,
          account: cleanAccount
        })
      }).then(r => r.json());

      if (res.success) {
        showRollbackToast(`✅ ${res.message}`);
        await fetchChannelAccounts();
        setAccountModalOpen(false);
      } else {
        alert('Lỗi lưu tài khoản: ' + res.error);
      }
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleDeleteAccount = async (channel, accId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này khỏi danh sách?')) return;
    try {
      const res = await fetch(`/api/publish/accounts/${channel}/${accId}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        showRollbackToast('Đã xóa tài khoản');
        await fetchChannelAccounts();
        setAccountModalOpen(false);
      }
    } catch (e) {
      alert('Lỗi xóa: ' + e.message);
    }
  };

  const handleQuickSavePhone = async () => {
    const phoneToSave = recipientPhoneInput.trim();
    const sPhone = senderPhoneInput.trim();
    if (!phoneToSave) {
      alert('Vui lòng nhập số điện thoại Zalo của bạn!');
      return;
    }
    const currentAcc = channelAccounts.zalo?.find(a => a.id === selectedZaloAccId) || channelAccounts.zalo?.[0] || {};
    const updated = { 
      ...currentAcc, 
      recipientPhone: phoneToSave,
      senderPhone: sPhone || '0912345678',
      type: 'personal',
      name: `Zalo Cá Nhân (${sPhone || 'Biên tập'})`
    };
    try {
      const res = await fetch('/api/publish/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'zalo', account: updated })
      }).then(r => r.json());
      if (res.success) {
        showRollbackToast(`✅ Đã lưu SĐT gửi (${sPhone}) & SĐT nhận (${phoneToSave})`);
        await fetchChannelAccounts();
      }
    } catch (e) {
      alert('Lỗi lưu số điện thoại: ' + e.message);
    }
  };

  const handleFbPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFbSelectedPhotos(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
    showRollbackToast(`Đã thêm ${files.length} ảnh vào bài Facebook`);
    e.target.value = '';
  };

  const handleZaloPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setZaloPhoto(ev.target.result);
      showRollbackToast('Đã nạp ảnh đính kèm cho tin Zalo');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Logic Điều Khiển Bot Zalo Đẩy Tin Vào Nhóm ──────────────────────────────
  const fetchZaloBotStatus = async () => {
    try {
      const res = await fetch('/api/publish/zalo/bot-status');
      const json = await res.json();
      if (json.success && json.data) {
        setZaloBotStatus(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchZaloBotStatus();
  }, []);

  // Bắt đầu tạo QR quét kết nối Bot Zalo
  const startBotQrLogin = async () => {
    setZaloQrModalOpen(true);
    setZaloQrStatus('generating');
    setZaloQrMessage('Đang khởi tạo mã QR từ máy chủ Zalo...');
    setZaloQrImage('');

    try {
      const res = await fetch('/api/publish/zalo/bot-login-qr', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.status === 'already_connected') {
          showRollbackToast('Bot Zalo đã được kết nối từ trước!');
          setZaloQrModalOpen(false);
          fetchZaloBotStatus();
          return;
        }
        if (json.data.qrImage) {
          setZaloQrImage(json.data.qrImage);
          setZaloQrStatus('waiting');
          setZaloQrMessage('Vui lòng mở Zalo trên điện thoại, quét mã QR và bấm "Xác nhận đăng nhập"');
        }
      }

      // Polling kiểm tra trạng thái mỗi 2 giây
      const pollTimer = setInterval(async () => {
        try {
          const checkRes = await fetch('/api/publish/zalo/bot-status');
          const checkJson = await checkRes.json();
          if (checkJson.success && checkJson.data?.isConnected) {
            clearInterval(pollTimer);
            setZaloBotStatus(checkJson.data);
            setZaloQrStatus('success');
            setZaloQrMessage(`🎉 Kết nối thành công với tài khoản: ${checkJson.data.botInfo?.name || 'Bot Zalo'}!`);
            setTimeout(() => {
              setZaloQrModalOpen(false);
              showRollbackToast(`✅ Đã kết nối Bot: ${checkJson.data.botInfo?.name}`);
            }, 1500);
          } else if (checkJson.data?.qrState?.status === 'scanned') {
            setZaloQrStatus('scanned');
            setZaloQrMessage(`📱 Đã quét bởi [${checkJson.data.qrState.displayName || 'Bạn'}]. Vui lòng bấm Xác nhận trên điện thoại!`);
          } else if (checkJson.data?.qrState?.status === 'expired') {
            setZaloQrStatus('expired');
            setZaloQrMessage('Mã QR đã hết hạn, vui lòng bấm "Tạo lại mã"!');
          } else if (checkJson.data?.qrState?.status === 'declined') {
            setZaloQrStatus('declined');
            setZaloQrMessage('Đăng nhập bị từ chối trên điện thoại.');
          } else if (checkJson.data?.qrState?.status === 'error') {
            setZaloQrStatus('error');
            setZaloQrMessage(checkJson.data.qrState.message || 'Lỗi kết nối Zalo');
          }
        } catch {}
      }, 2000);

      // Tự hủy polling sau 90 giây
      setTimeout(() => clearInterval(pollTimer), 90000);
    } catch (err) {
      setZaloQrStatus('error');
      setZaloQrMessage('Lỗi kết nối tới dịch vụ Bot: ' + err.message);
    }
  };

  const logoutZaloBot = async () => {
    if (!confirm('Bạn có chắc chắn muốn ngắt kết nối Bot Zalo này không?')) return;
    try {
      await fetch('/api/publish/zalo/bot-logout', { method: 'POST' });
      setZaloBotStatus({ isConnected: false, botInfo: null });
      showRollbackToast('Đã ngắt kết nối Bot Zalo');
    } catch {}
  };

  const sendZaloMessage = async () => {
    const fullContent = (zaloText || `[CÔNG ĐOÀN TDMU] ${title || 'Bản tin'}\n\n${sapo || ''}`).trim();
    const linkUrl = getPublicArticleUrl();
    const finalMsg = `${fullContent}\n\n🔗 Xem chi tiết: ${linkUrl}`;

    // NẾU LÀ CHẾ ĐỘ GỬI VÀO NHÓM ZALO
    if (zaloTargetMode === 'group') {
      const targetLink = zaloGroupLink.trim() || 'https://zalo.me/g/wdhpzaoap7wkxb074exv';

      // NẾU BOT ĐÃ KẾT NỐI -> BẮN TIN TỰ ĐỘNG 100% NGẦM
      if (zaloBotStatus.isConnected) {
        setIsPublishingNow(true);
        try {
          const res = await fetch('/api/publish/zalo/send-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupLink: targetLink,
              content: finalMsg,
              imageUrl: zaloPhoto || '',
              articleTitle: title,
              articleId: activeArticleId
            })
          });
          const json = await res.json();
          if (json.success) {
            alert(`🎉 BOT ĐÃ TỰ ĐỘNG ĐẨY TIN VÀO NHÓM ZALO THÀNH CÔNG 100%!\n\n🤖 Tài khoản Bot: "${json.data?.botName || zaloBotStatus.botInfo?.name}"\n👥 Nhóm nhận: ${targetLink}\n⏰ Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`);
            showRollbackToast('🚀 Đã gửi bài viết vào Nhóm Zalo qua Bot tự động!');
            return;
          } else {
            throw new Error(json.error || 'Không thể gửi tin');
          }
        } catch (err) {
          alert(`⚠️ Bot chưa gửi được vào nhóm: ${err.message}\n\nHệ thống sẽ chuyển sang chế độ mở nhóm 1-chạm giúp bạn gửi ngay!`);
        } finally {
          setIsPublishingNow(false);
        }
      }

      // NẾU BOT CHƯA KẾT NỐI HOẶC GỬI DỰ PHÒNG 1-CHẠM:
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(finalMsg); } catch {}
      }
      showRollbackToast(`📋 Đã copy nội dung gửi vào Nhóm Zalo!`);
      window.open(targetLink, '_blank');
      alert(`🎉 ĐÃ CHUẨN BỊ GỬI VÀO NHÓM ZALO!\n\n1. Toàn bộ nội dung bài viết và đường link đã được tự động copy vào bộ nhớ đệm (Clipboard).\n2. Nhóm Zalo đang được mở trên trình duyệt/ứng dụng của bạn.\n\n👉 Bạn chỉ cần nhấn tổ hợp phím "Ctrl + V" (Dán) rồi bấm "Enter" là tin nhắn được gửi ngay vào nhóm!\n\n💡 MẸO: Bạn có thể bấm nút "Quét Mã QR Kết Nối Bot" để từ lần sau Bot tự động gửi ngầm 100% không cần làm thủ công.`);
      return;
    }

    // NẾU LÀ CHẾ ĐỘ CÁ NHÂN P2P
    const sPhone = senderPhoneInput.trim() || '0912345678';
    const rPhone = recipientPhoneInput.trim() || '0386543483';
    const phoneClean = rPhone.replace(/^0/, '84');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(finalMsg); } catch {}
    }
    showRollbackToast(`📋 Đã copy nội dung gửi tới ${rPhone}!`);

    setIsPublishingNow(true);
    try {
      await fetch('/api/publish/zalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalMsg,
          title: title || 'Bản tin Zalo',
          articleId: activeArticleId || 1,
          recipientPhone: rPhone,
          senderPhone: sPhone,
          imageUrl: zaloPhoto || ''
        })
      });
    } catch (e) {
      console.warn('Lỗi ghi nhận publish zalo:', e);
    } finally {
      setIsPublishingNow(false);
    }

    window.open(`https://zalo.me/${phoneClean}`, '_blank');
    alert(`🎉 ĐÃ CHUẨN BỊ GỬI TIN TỪ SĐT [${sPhone}] SANG [${rPhone}]!\n\n1. Toàn bộ nội dung tin nhắn và liên kết bài viết đã được tự động copy vào bộ nhớ đệm (Clipboard).\n2. Cửa sổ chat Zalo với số ${rPhone} đang được mở.\n\n👉 Bạn chỉ cần nhấn tổ hợp phím "Ctrl + V" (Dán) rồi bấm "Enter" là tin nhắn được gửi thật 100%!`);
  };

  const sendZaloP2P = sendZaloMessage;

  const testSendToMyZalo = sendZaloP2P;
  const openDirectZaloShare = sendZaloP2P;

  const publishToFacebookDirect = async () => {
    if (!title.trim() && !fbCaption.trim()) { alert('Vui lòng nhập tiêu đề hoặc caption Facebook!'); return; }
    setIsPublishingNow(true);
    try {
      const currentAcc = channelAccounts.facebook?.find(a => a.id === selectedFbAccId) || {};
      const allPhotos = fbSelectedPhotos.length > 0 
        ? fbSelectedPhotos 
        : (eventPhotos.map(p => p.url).filter(Boolean));

      const res = await fetch('/api/publish/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: fbCaption || `${title}\n\n${sapo}\n\n#CongDoanTDMU #TDMU`,
          imageUrl: allPhotos[0] || '',
          imageUrls: allPhotos,
          articleTitle: title,
          articleId: activeArticleId,
          accountId: selectedFbAccId
        })
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${res.message}\n\nTài khoản: ${res.data?.accountName || currentAcc.name}\nMã bài đăng: ${res.data?.postId || 'Thành công'}\nLink: ${res.data?.permalinkUrl || ''}`);
      } else {
        alert('Lỗi đăng Facebook: ' + (res.error || 'Không xác định'));
      }
    } catch (e) {
      alert('Lỗi kết nối Facebook: ' + e.message);
    } finally {
      setIsPublishingNow(false);
    }
  };

  const publishToZaloDirect = async () => {
    if (!title.trim() && !zaloText.trim()) { alert('Vui lòng nhập nội dung bản tin Zalo OA!'); return; }
    setIsPublishingNow(true);
    try {
      const currentAcc = channelAccounts.zalo?.find(a => a.id === selectedZaloAccId) || {};
      const res = await fetch('/api/publish/zalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: zaloText || `[BẢN TIN CÔNG ĐOÀN TDMU]\n${title}\n\n${sapo}`,
          title: title,
          articleId: activeArticleId,
          imageUrl: zaloPhoto || (eventPhotos[0]?.url) || '',
          accountId: selectedZaloAccId,
          recipientPhone: recipientPhoneInput.trim() || currentAcc.recipientPhone || '',
          recipientUserId: currentAcc.recipientUserId || ''
        })
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 ${res.message}\n\nTài khoản: ${res.data?.accountName || currentAcc.name}\nMã tin nhắn Zalo: ${res.data?.messageId || 'Thành công'}`);
      } else {
        alert('Lỗi gửi Zalo: ' + (res.error || 'Không xác định'));
      }
    } catch (e) {
      alert('Lỗi kết nối Zalo: ' + e.message);
    } finally {
      setIsPublishingNow(false);
    }
  };

  const testChannelConnection = async (ch) => {
    try {
      const accId = ch === 'facebook' ? selectedFbAccId : selectedZaloAccId;
      const res = await fetch('/api/publish/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: ch, accountId: accId })
      }).then(r => r.json());
      alert(res.message || (res.error ? 'Lỗi: ' + res.error : 'Kết nối thành công!'));
      if (res.success) {
        await fetchChannelAccounts();
      }
    } catch (e) {
      alert('Lỗi kiểm tra kết nối: ' + e.message);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!scheduledAt) { alert('Vui lòng chọn thời gian xuất bản!'); return; }
    const chs = Object.entries(scheduleChannels).filter(([, v]) => v).map(([k]) => k === 'fb' ? 'facebook' : k);
    if (!chs.length) { alert('Vui lòng chọn ít nhất một kênh để hẹn lịch!'); return; }

    try {
      let artId = activeArticleId;
      if (!artId) {
        const createRes = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || ('Bản thảo hẹn lịch ' + new Date().toLocaleDateString('vi-VN')),
            summary: sapo,
            content: editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml),
            status: 'draft'
          })
        }).then(r => r.json());
        if (createRes.success && createRes.data?.id) {
          artId = createRes.data.id;
          setActiveArticleId(artId);
        }
      }

      const res = await fetch('/api/publish/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: artId,
          channels: chs,
          scheduledAt,
          title: title || 'Bản tin hẹn lịch',
          facebook: { caption: fbCaption },
          zalo: { content: zaloText }
        })
      }).then(r => r.json());

      if (res.success) {
        alert(`✅ ${res.message}`);
        fetchSchedulesList();
      } else {
        alert('Lỗi hẹn lịch: ' + res.error);
      }
    } catch (e) {
      alert('Lỗi hẹn lịch: ' + e.message);
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn xuất bản này?')) return;
    try {
      const res = await fetch(`/api/publish/schedule/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        alert('✅ Đã hủy lịch hẹn thành công!');
        fetchSchedulesList();
      }
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleOmnichannelPublishNow = async () => {
    const chs = [];
    if (omniChannels.web) chs.push('web');
    if (omniChannels.fb) chs.push('facebook');
    if (omniChannels.zalo) chs.push('zalo');
    if (!chs.length) { alert('Vui lòng chọn ít nhất 1 kênh để xuất bản!'); return; }

    setIsPublishingNow(true);
    setPublishResult(null);

    try {
      const currentHtml = editorRef.current?.getData ? editorRef.current.getData() : (editorRef.current?.innerHTML || bodyHtml);
      let artId = activeArticleId;

      if (!artId) {
        const createRes = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || 'Bản tin Công Đoàn TDMU',
            summary: sapo,
            content: currentHtml,
            status: 'draft',
            author: 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một'
          })
        }).then(r => r.json());
        if (createRes.success && createRes.data?.id) {
          artId = createRes.data.id;
          setActiveArticleId(artId);
        }
      }

      const allFbPhotos = fbSelectedPhotos.length > 0 
        ? fbSelectedPhotos 
        : (eventPhotos.map(p => p.url).filter(Boolean));

      const res = await fetch('/api/publish/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: artId,
          channels: chs,
          web: { title, summary: sapo, content: currentHtml, image: (eventPhotos[0]?.url) || 'images/banner.jpg' },
          facebook: { 
            caption: fbCaption || `${title}\n\n${sapo}\n\n#CongDoanTDMU #TDMU`, 
            imageUrl: allFbPhotos[0] || (eventPhotos[0]?.url) || '',
            imageUrls: allFbPhotos
          },
          zalo: { content: zaloText || `[BẢN TIN CÔNG ĐOÀN TDMU]\n${title}\n\n${sapo}` },
          facebookAccountId: selectedFbAccId,
          zaloAccountId: selectedZaloAccId
        })
      }).then(r => r.json());

      if (res.success) {
        setPublishResult(res.data);
        fetchDrafts();
      } else {
        alert('Lỗi xuất bản: ' + res.error);
      }
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsPublishingNow(false);
    }
  };

  const publishLive = () => {
    if (!title.trim()) { alert('Vui lòng nhập tiêu đề bài viết!'); return; }
    setPublishResult(null);
    setOmnichannelModalOpen(true);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: '#F8FAFC', height: '100vh', display: 'flex', overflow: 'hidden', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        /* VÔ HIỆU HÓA HOÀN TOÀN GẠCH ĐỎ CHÍNH TẢ TRÌNH DUYỆT (SPELLCHECK OFF) */
        textarea, input, [contenteditable], .ck-editor__editable, .ck-editor__editable * {
          spellcheck: false !important;
          -webkit-spellcheck: false !important;
        }
        ::spelling-error {
          display: none !important;
          text-decoration: none !important;
          -webkit-text-decoration: none !important;
        }
        ::grammar-error {
          display: none !important;
          text-decoration: none !important;
          -webkit-text-decoration: none !important;
        }

        .nav-item { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:#CBD5E1;font-size:13px;font-weight:600;transition:all 0.2s;border:1px solid transparent;cursor:pointer;position:relative;white-space:nowrap; }
        .nav-item:hover { background:rgba(255,255,255,0.12)!important;color:#FFF!important;transform:translateX(4px); }
        .nav-item.active { background:rgba(2,132,199,0.25)!important;color:#FFF!important;border-color:rgba(56,189,248,0.5)!important;font-weight:700!important;box-shadow:0 2px 10px rgba(0,40,85,0.25); }
        .nav-item[data-tip]:hover::after { content:attr(data-tip);position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#0F172A;color:#FFF;font-size:11.5px;font-weight:700;padding:6px 12px;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.35);white-space:nowrap;z-index:2500;border:1px solid rgba(255,255,255,0.15);pointer-events:none; }
        .nav-item[data-tip]:hover::before { content:'';position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);border-width:5px 6px 5px 0;border-style:solid;border-color:transparent #0F172A transparent transparent;z-index:2500;pointer-events:none; }
        .photo-card { border-radius:8px;overflow:hidden;border:1.5px solid #E2E8F0;background:white;position:relative;transition:border-color 0.15s; }
        .photo-card:hover { border-color:#CBD5E1; }
        .photo-card.featured { border-color:#2563EB!important; }
        .tab-btn { background:transparent;border:none;border-bottom:2.5px solid transparent;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#64748B;transition:all 0.15s; }
        .tab-btn.active-web { border-bottom-color:#002855;color:#002855;font-weight:800;background:white; }
        .tab-btn.active-fb { border-bottom-color:#1877F2;color:#1877F2;font-weight:800;background:white; }
        .tab-btn.active-zalo { border-bottom-color:#0068FF;color:#0068FF;font-weight:800;background:white; }
        .tab-btn.active-sched { border-bottom-color:#8B5CF6;color:#8B5CF6;font-weight:800;background:white; }
        .fbpill { background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;border-radius:20px;padding:3px 8px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
        .fbpill:hover { background:#DBEAFE; }
        .emoji-btn { background:none;border:1px solid #E2E8F0;border-radius:5px;width:28px;height:28px;cursor:pointer;font-size:14px;transition:transform 0.1s;display:flex;align-items:center;justify-content:center; }
        .emoji-btn:hover { transform:scale(1.2); }
        .action-btn { padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all 0.15s; }
        .dropzone-active { border-color:#2563EB!important;background:#EFF6FF!important; }
        [contenteditable]:empty:before { content:attr(data-placeholder);color:#94A3B8;pointer-events:none; }
        .log-item-running { color:#0369A1; } .log-item-done { color:#16A34A; } .log-item-error { color:#DC2626; }
      `}</style>

      {/* ─── LEFT MASTER ADMIN SIDEBAR ────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        style={{ width: sidebarCollapsed ? (sidebarHovered ? '240px' : '64px') : '240px', background: 'linear-gradient(180deg,#002855 0%,#001A38 100%)', color: '#FFF', transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,40,85,0.15)', zIndex: 100, flexShrink: 0, overflow: 'hidden' }}
      >
        <div style={{ height: '54px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/images/logo_cong_doan.png" alt="Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} onError={e => { e.target.style.display = 'none'; }} />
          {(!sidebarCollapsed || sidebarHovered) && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFF', letterSpacing: '0.3px' }}>CÔNG ĐOÀN TDMU</div>
              <div style={{ fontSize: '9.5px', color: '#93C5FD' }}>HỆ THỐNG TRUYỀN THÔNG</div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navSections.map((sec, si) => (
            <div key={si}>
              {(!sidebarCollapsed || sidebarHovered) && (
                <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '10px 8px 4px 8px' }}>{sec.label}</div>
              )}
              {sec.items.map(item => {
                const collapsed = sidebarCollapsed && !sidebarHovered;
                return (
                  <div key={item.id} onClick={() => handleNavClick(item.id)}
                    className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                    data-tip={collapsed ? item.label : undefined}
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '9px 12px', cursor: 'pointer' }}
                  >
                    <i className={`${item.icon}`} style={{ color: item.color, fontSize: collapsed ? '16px' : '14px', width: collapsed ? '100%' : '18px', textAlign: 'center', flexShrink: 0 }} />
                    {(!sidebarCollapsed || sidebarHovered) && (
                      <>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                        {item.badge && <span style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>{item.badge}</span>}
                        {item.count && <span style={{ background: '#0284C7', color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>{item.count}</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)', fontSize: '10px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {(!sidebarCollapsed || sidebarHovered) && <span>v2.5 Enterprise</span>}
          <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', fontSize: '9px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px' }}>ONLINE</span>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOP HEADER */}
        <header style={{ height: '52px', background: '#FFF', borderBottom: '1px solid #E2E8F0', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#334155', cursor: 'pointer' }} title="Thu gọn / Mở rộng Danh mục">
              <i className="fa-solid fa-bars" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748B' }}>
              <span>Trang Quản Trị</span><span>/</span>
              <strong style={{ color: '#002855' }}>
                {navTitles[activeNav] || 'Soạn Thảo & Biên Tập'}
              </strong>
            </div>
            {activeNav === 'ai-creator' && (
              <button onClick={() => setDraftsOpen(!draftsOpen)} style={{ background: draftsOpen ? '#EFF6FF' : '#F8FAFC', border: '1px solid #CBD5E1', color: draftsOpen ? '#1D4ED8' : '#64748B', borderRadius: '6px', padding: '5px 10px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                <i className="fa-solid fa-box-archive" /> Tủ Bản Thảo ({draftsList.length})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeNav === 'ai-creator' ? (
              <>
                <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isSaving ? '#F59E0B' : '#10B981', display: 'inline-block' }} />
                  <span>{isSaving ? 'Đang lưu...' : (lastSaveTime ? `Lưu tự động: ${lastSaveTime}` : 'Sẵn sàng')}</span>
                </div>
                <button onClick={newArticle} className="action-btn" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }} title="Tạo bài mới (tự động lưu bài hiện tại vào Tủ Bản Thảo)">
                  <i className="fa-solid fa-plus" /> Bài mới
                </button>
                <button id="btn-export-word" onClick={handleExportWord} className="action-btn" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }} title="Tải bài viết về máy dưới dạng Microsoft Word (.docx)">
                  <i className="fa-solid fa-file-word" /> Xuất Word
                </button>
                <button id="btn-export-pdf" onClick={handleExportPdf} className="action-btn" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }} title="Tải bài viết về máy dưới dạng Adobe PDF (.pdf)">
                  <i className="fa-solid fa-file-pdf" /> Xuất PDF
                </button>
                <button onClick={() => setSettingsOpen(true)} className="action-btn" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }} title="Cài đặt API Key cho Gemini Vision và Groq">
                  ⚙️ Cài Đặt AI
                </button>
                <button onClick={saveDraft} className="action-btn" style={{ background: '#FFF', border: '1px solid #CBD5E1', color: '#002855' }}>💾 Lưu Bản Thảo</button>
                <button onClick={publishLive} className="action-btn" style={{ background: 'linear-gradient(135deg,#002855,#2563EB)', color: 'white' }}>🚀 Xuất Bản Live</button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('ai-creator')}
                  className="action-btn"
                  style={{ background: 'linear-gradient(135deg,#002855,#2563EB)', color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Mở Soạn Thảo & Biên Tập Tin Bài AI"
                >
                  <i className="fa-solid fa-wand-magic-sparkles" /> Soạn Thảo Tin Bài AI
                </button>
                <button onClick={() => setSettingsOpen(true)} className="action-btn" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }} title="Cài đặt API Key cho Gemini Vision và Groq">
                  ⚙️ Cài Đặt AI
                </button>
              </>
            )}
            <Link to="/" style={{ color: '#002855', fontSize: '12px', textDecoration: 'none', marginLeft: '2px' }} title="Xem Website"><i className="fa-solid fa-arrow-up-right-from-square" /></Link>
          </div>
        </header>

        {/* 3-PANE STUDIO CANVAS */}
        <div style={{ flex: 1, display: activeNav === 'ai-creator' ? 'flex' : 'none', overflow: 'hidden', position: 'relative' }}>

          {/* PANE 1: DRAFTS DRAWER */}
          {draftsOpen && (
            <aside style={{ width: '240px', background: '#FFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#002855' }}><i className="fa-solid fa-box-archive" style={{ marginRight: '5px' }} />Tủ Bản Thảo</span>
                <button onClick={() => setDraftsOpen(false)} style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '3px 7px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }} title="Thu gọn Tủ Bản Thảo">
                  <i className="fa-solid fa-chevron-left" /> Thu gọn
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {draftsLoading ? (
                  <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Đang tải...</div>
                ) : draftsList.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '30px 8px', lineHeight: '1.5' }}>Chưa có bài nào.<br />Bấm "+ Bài mới" để bắt đầu!</div>
                ) : draftsList.map(d => {
                  const isActive = activeArticleId === d.id;
                  return (
                    <div
                      key={d.id}
                      id={`draft-item-${d.id}`}
                      data-draft-id={d.id}
                      onClick={() => switchDraft(d)}
                      title={`Bản thảo #${d.id} - ${d.title || 'Chưa đặt tên'}\n• Ngày tạo: ${formatDateTime(d.createdAt || d.created_at)}\n• Cập nhật: ${formatDateTime(d.updatedAt || d.updated_at || d.createdAt)}\n• Tác giả: ${d.author || 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một'}\n• Trạng thái: ${d.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}`}
                      style={{
                        padding: '9px 10px',
                        borderRadius: '6px',
                        background: isActive ? '#EFF6FF' : 'transparent',
                        border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '12px', fontWeight: isActive ? '800' : '600', color: isActive ? '#1D4ED8' : '#1E293B', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{d.title || 'Bản thảo chưa đặt tên'}</div>
                        <button onClick={e => deleteDraft(d.id, e)} style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: '11px', padding: '0 2px' }} title="Xóa">✕</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', fontSize: '9.5px', color: '#94A3B8' }}>
                        <span>🕒 {(() => { try { const dt = new Date(d.updatedAt || d.createdAt); return isNaN(dt) ? 'Bản nháp' : dt.toLocaleDateString('vi-VN'); } catch { return 'Bản nháp'; } })()}</span>
                        <span style={{ background: isActive ? '#BFDBFE' : '#E2E8F0', padding: '1px 4px', borderRadius: '3px', color: isActive ? '#1D4ED8' : '#475569', fontWeight: '700' }}>#{d.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* PANE 2: CENTER EDITOR CANVAS */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFF', position: 'relative' }}>

            {/* Channel tabs */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', padding: '0 16px', height: '40px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[
                  { id: 'web', label: '📰 Website (Gốc)', cls: 'active-web' },
                  { id: 'fb', label: '📘 Facebook', cls: 'active-fb' },
                  { id: 'zalo', label: '💬 Zalo', cls: 'active-zalo' },
                  { id: 'schedule', label: '⏰ Hẹn Lịch', cls: 'active-sched' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveChannel(tab.id)} className={`tab-btn ${activeChannel === tab.id ? tab.cls : ''}`}>{tab.label}</button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#64748B' }}>
                <span>{wordCount} từ</span><span>•</span><span>~{readTime} phút đọc</span>
              </div>
            </div>

            {/* ── WEB CANVAS (DISTRACTION-FREE GOOGLE DOCS / NOTION STYLE) ── */}
            {activeChannel === 'web' && (
              <div
                style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', padding: '32px 24px 100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
                onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
              >
                {/* Drop overlay */}
                {isDraggingOver && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(37,99,235,0.15)', border: '3px dashed #2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px 40px', fontSize: '18px', fontWeight: '800', color: '#2563EB', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                      📂 Thả tài liệu hoặc ảnh vào đây để nạp vào Trợ lý Biên tập
                    </div>
                  </div>
                )}

                {/* World-Class Editorial Paper Canvas (Medium / Notion / Newsroom Style) */}
                <div style={{
                  width: '100%',
                  maxWidth: '920px',
                  minHeight: '100%',
                  height: 'fit-content',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 4px 25px -4px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                  border: '1px solid #E2E8F0',
                  padding: '36px 44px 60px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box'
                }}>
                  
                  {/* Seamless Headline (Title) */}
                  <textarea
                    id="article-title"
                    ref={titleRef}
                    value={title}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    onChange={e => setTitle(e.target.value)}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.max(48, e.target.scrollHeight)}px`;
                    }}
                    placeholder="Nhập tiêu đề bài báo..."
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      fontSize: '26px',
                      fontWeight: '800',
                      color: '#002855',
                      border: 'none',
                      borderBottom: '1px solid transparent',
                      outline: 'none',
                      fontFamily: 'inherit',
                      padding: '0 0 10px 0',
                      lineHeight: '1.35',
                      background: 'transparent',
                      boxSizing: 'border-box',
                      resize: 'none',
                      overflowY: 'hidden',
                      transition: 'border-color 0.2s',
                      marginBottom: '14px'
                    }}
                    onFocus={e => { e.target.style.borderBottomColor = '#BFDBFE'; }}
                    onBlur={e => { e.target.style.borderBottomColor = 'transparent'; }}
                  />

                  {/* Seamless Sapo (Lead Deck) */}
                  <div style={{
                    background: '#F8FAFC',
                    borderLeft: '4px solid #2563EB',
                    borderRadius: '0 8px 8px 0',
                    padding: '12px 18px',
                    marginBottom: '20px',
                    transition: 'background 0.2s'
                  }}>
                    <textarea
                      id="article-sapo"
                      ref={sapoRef}
                      value={sapo}
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                      onChange={e => setSapo(e.target.value)}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(64, e.target.scrollHeight)}px`;
                      }}
                      placeholder="Đoạn mở đầu Sapo (Lead 5W1H): Tóm lược thông tin quan trọng nhất của sự kiện: Ai, làm gì, ở đâu, khi nào..."
                      style={{
                        width: '100%',
                        minHeight: '64px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '15px',
                        fontStyle: 'italic',
                        lineHeight: '1.65',
                        color: '#334155',
                        outline: 'none',
                        resize: 'none',
                        overflowY: 'hidden',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        padding: '0'
                      }}
                    />
                  </div>

                  {/* CKEditor 5 Core Canvas */}
                  <div id="article-content" style={{ display: 'flex', flexDirection: 'column' }}>
                    <CKArticleEditor
                      ref={editorRef}
                      value={bodyHtml}
                      onChange={setBodyHtml}
                      onSelectionChange={(text) => setSelectedText(text)}
                      onAiInlineEdit={handleAiInlineEdit}
                      aiLoading={aiInlineLoading}
                      placeholder="Nội dung bài báo viết văn xuôi chính luận, không gạch đầu dòng..."
                    />
                  </div>

                </div>
              </div>
            )}

            {/* ── FACEBOOK CHANNEL ────────────────────────────────────────── */}
            {activeChannel === 'fb' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Account & Sender Header Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', flexShrink: 0 }}>
                      <i className="fa-brands fa-facebook-f" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Tài Khoản Gửi (Fanpage Facebook):
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <select
                          value={selectedFbAccId}
                          onChange={e => setSelectedFbAccId(e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #93C5FD', fontSize: '12px', fontWeight: '700', color: '#0F172A', background: '#FFF', outline: 'none', maxWidth: '240px' }}
                        >
                          {(channelAccounts.facebook || []).map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} {acc.isDefault ? '★ (Mặc định)' : ''} {acc.pageName ? `[${acc.pageName}]` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openEditAccountModal('facebook', selectedFbAccId)}
                          style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #93C5FD', background: '#FFF', color: '#1D4ED8', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Cấu hình Access Token, Page ID của tài khoản này"
                        >
                          ⚙️ Cài đặt Token
                        </button>
                        <button
                          onClick={() => openNewAccountModal('facebook')}
                          style={{ padding: '5px 9px', borderRadius: '6px', border: 'none', background: '#1877F2', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Thêm tài khoản Fanpage Facebook mới"
                        >
                          + Thêm Fanpage
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981' }} /> Meta Graph API Ready
                    </span>
                    <button
                      onClick={() => testChannelConnection('facebook')}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Kiểm tra kết nối tới Meta API với token của tài khoản đang chọn"
                    >
                      <i className="fa-solid fa-circle-check" /> Test Kết Nối
                    </button>
                  </div>
                </div>

                {/* 2. Main 2-Column Split: Left Composer, Right Realistic Feed Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '22px', alignItems: 'start' }}>
                  {/* Left Column: Post Composer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Source Article Live Indicator */}
                    <div style={{ padding: '8px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ background: '#0284C7', color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>BÀI BÁO GỐC</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title || 'Chưa đặt tiêu đề bài báo'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        🔗 {activeArticleId ? `ID: #${activeArticleId}` : 'Bản nháp Canvas'}
                      </span>
                    </div>

                    {/* Sync + AI Tools Action Bar */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={generateFbWithAi} className="action-btn" style={{ background: 'linear-gradient(135deg, #1877F2, #0284C7)', color: 'white', fontWeight: '800', boxShadow: '0 2px 6px rgba(24,119,242,0.25)' }} title="AI tự động phân tích bài báo và viết caption Facebook chuẩn tương tác, tự đính kèm đầy đủ link bài và file">
                        ⚡ AI Tối Ưu Caption
                      </button>
                      <button onClick={syncFbFromWeb} className="action-btn" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: '700' }} title="Đồng bộ tức thì tiêu đề, sapo, link bài và danh sách file vào caption">
                        🔄 Đồng Bộ Nhanh
                      </button>
                      <button onClick={() => insertArticleLinkToChannel('fb')} className="action-btn" style={{ background: '#FFF', color: '#0284C7', border: '1px solid #BAE6FD', fontWeight: '700', fontSize: '11.5px' }} title="Chèn nhanh link công khai của bài báo vào caption">
                        🔗 Chèn Link Bài
                      </button>
                      <button onClick={() => insertDocLinksToChannel('fb')} className="action-btn" style={{ background: '#FFF', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700', fontSize: '11.5px' }} title="Chèn link tải toàn bộ tài liệu đính kèm vào caption">
                        📎 Chèn Link File ({attachedFiles.filter(f => f.type !== 'image').length})
                      </button>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Tỷ lệ:</span>
                        {['1:1 Vuông','4:5 Dọc','16:9 Ngang'].map(r => (
                          <button key={r} onClick={() => setFbRatio(r)} className="fbpill" style={{ background: fbRatio === r ? '#1877F2' : '#EFF6FF', color: fbRatio === r ? 'white' : '#1D4ED8', border: fbRatio === r ? 'none' : '1px solid #BFDBFE', padding: '3px 8px', fontSize: '11px' }}>{r}</button>
                        ))}
                      </div>
                    </div>

                    {/* Realistic Facebook Post Box */}
                    <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Post Creator Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #002855, #1877F2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,40,85,0.2)' }}>
                          CĐ
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Công Đoàn Trường Đại học Thủ Dầu Một
                            <i className="fa-solid fa-circle-check" style={{ color: '#1877F2', fontSize: '13px' }} title="Fanpage đã xác minh" />
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '1px 8px', borderRadius: '12px', fontSize: '11px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>
                            <i className="fa-solid fa-earth-americas" style={{ fontSize: '10px' }} /> Công khai ▾
                          </div>
                        </div>
                      </div>

                      {/* Textarea */}
                      <textarea
                        value={fbCaption}
                        onChange={e => setFbCaption(e.target.value)}
                        placeholder="Bạn đang nghĩ gì? Hãy soạn caption Facebook hấp dẫn chuẩn tương tác mạng xã hội..."
                        rows={9}
                        style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.65', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', background: '#FBFCFE' }}
                      />

                      {/* Tools & Counters */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        {/* Hashtag chips */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Hashtag:</span>
                          {FB_HASHTAGS.map(tag => (
                            <button key={tag} onClick={() => insertFbHashtag(tag)} className="fbpill" style={{ padding: '2px 8px', fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{tag}</button>
                          ))}
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: fbCaption.length > 500 ? '#DC2626' : '#64748B' }}>
                          {fbCaption.length} / 500 ký tự khuyến nghị
                        </div>
                      </div>

                      {/* Emoji Tray */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '6px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginRight: '4px' }}>Emoji:</span>
                        {FB_EMOJIS.map(em => (
                          <button key={em} onClick={() => insertFbEmoji(em)} className="emoji-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '2px 4px', borderRadius: '4px' }}>{em}</button>
                        ))}
                      </div>

                      {/* Photo Upload & Management (Dễ nạp ảnh thực tế) */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-images" style={{ color: '#1877F2' }} />
                            ẢNH ĐÍNH KÈM BÀI ĐĂNG ({fbSelectedPhotos.length} ảnh):
                            {fbSelectedPhotos.length > 1 && (
                              <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800' }}>
                                Đăng Album {fbSelectedPhotos.length} ảnh cùng lúc
                              </span>
                            )}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              ref={fbFileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              style={{ display: 'none' }}
                              onChange={handleFbPhotoUpload}
                            />
                            <button
                              onClick={() => fbFileInputRef.current?.click()}
                              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #1877F2', background: '#EFF6FF', color: '#1877F2', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                              title="Tải thêm ảnh từ máy tính của bạn vào bài đăng Facebook"
                            >
                              <i className="fa-solid fa-cloud-arrow-up" /> + Tải ảnh từ máy tính
                            </button>
                            {eventPhotos.length > 0 && (
                              <button
                                onClick={() => {
                                  const allUrls = eventPhotos.map(p => p.url);
                                  setFbSelectedPhotos(prev => Array.from(new Set([...prev, ...allUrls])));
                                  showRollbackToast(`Đã nạp ${allUrls.length} ảnh từ hồ sơ sự kiện`);
                                }}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BAE6FD', background: '#FFF', color: '#0284C7', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                                title="Nạp toàn bộ ảnh sự kiện đã phân tích trong hồ sơ"
                              >
                                🖼️ Nạp ảnh hồ sơ ({eventPhotos.length})
                              </button>
                            )}
                            {fbSelectedPhotos.length > 0 && (
                              <button
                                onClick={() => setFbSelectedPhotos([])}
                                style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FFF', color: '#DC2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                title="Xóa toàn bộ ảnh đã chọn"
                              >
                                ✕ Xóa hết
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Selected Photos Thumbnails with Delete button */}
                        {fbSelectedPhotos.length === 0 ? (
                          <div
                            onClick={() => fbFileInputRef.current?.click()}
                            style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '12px', cursor: 'pointer', background: '#F8FAFC' }}
                          >
                            <i className="fa-solid fa-image" style={{ fontSize: '24px', color: '#94A3B8', marginBottom: '6px', display: 'block' }} />
                            Chưa có ảnh nào được chọn. Nhấn để <strong>tải ảnh từ máy tính</strong> hoặc kéo thả ảnh vào đây.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                            {fbSelectedPhotos.map((url, idx) => (
                              <div key={idx} style={{ position: 'relative', width: '74px', height: '74px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #1877F2', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.65)', color: 'white', borderRadius: '4px', padding: '0 4px', fontSize: '9px', fontWeight: '800' }}>
                                  #{idx + 1}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFbSelectedPhotos(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '900' }}
                                  title="Gỡ ảnh này khỏi bài đăng"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Publish Action Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button 
                        onClick={publishToFacebookDirect} 
                        disabled={isPublishingNow}
                        className="action-btn" 
                        style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1877F2, #0284C7)', color: 'white', fontSize: '14px', fontWeight: '800', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 3px 10px rgba(24,119,242,0.35)', cursor: isPublishingNow ? 'not-allowed' : 'pointer' }}
                      >
                        <i className="fa-brands fa-facebook" style={{ fontSize: '18px' }} />
                        {isPublishingNow ? 'Đang kết nối Meta API và đăng album ảnh...' : `🚀 ĐĂNG NGAY LÊN FANPAGE FACEBOOK ${fbSelectedPhotos.length > 1 ? `(ALBUM ${fbSelectedPhotos.length} ẢNH)` : (fbSelectedPhotos.length === 1 ? '(1 ẢNH)' : '')}`}
                      </button>
                      <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
                        Bài viết và toàn bộ album {fbSelectedPhotos.length > 0 ? `${fbSelectedPhotos.length} ảnh` : ''} sẽ được xuất bản trực tiếp lên dòng thời gian của Fanpage đã chọn.
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Realistic Facebook Feed Card Preview */}
                  <div style={{ position: 'sticky', top: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-mobile-screen" style={{ color: '#1877F2' }} /> XEM TRƯỚC TRÊN BẢNG TIN FACEBOOK:
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #CBD5E1' }}>
                      {/* Page Header */}
                      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#002855,#1877F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>
                          CĐ
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#050505', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Công Đoàn TDMU
                            <i className="fa-solid fa-circle-check" style={{ color: '#1877F2', fontSize: '12px' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Trang · Vừa xong · <i className="fa-solid fa-earth-asia" style={{ fontSize: '10px' }} />
                          </div>
                        </div>
                        <div style={{ color: '#65676B', fontSize: '16px', fontWeight: '800', cursor: 'pointer', padding: '0 4px' }}>•••</div>
                      </div>

                      {/* Caption with Highlighted Hashtags */}
                      <div style={{ padding: '12px 14px', fontSize: '13.5px', lineHeight: '1.6', color: '#050505', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}>
                        {fbCaption ? (
                          fbCaption.split(/(#[a-zA-Z0-9_À-ỹ]+)/g).map((part, i) =>
                            part.startsWith('#') ? (
                              <span key={i} style={{ color: '#1877F2', fontWeight: '600' }}>{part}</span>
                            ) : (
                              part
                            )
                          )
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                            Nội dung bài đăng sẽ hiển thị trực quan tại đây...
                          </span>
                        )}
                      </div>

                      {/* Authentic Multi-Photo Dynamic Facebook Layout */}
                      {fbSelectedPhotos.length === 1 && (
                        <div style={{ width: '100%', height: '220px', overflow: 'hidden', background: '#000' }}>
                          <img src={fbSelectedPhotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      {fbSelectedPhotos.length === 2 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', height: '180px', background: '#000' }}>
                          {fbSelectedPhotos.slice(0, 2).map((url, i) => (
                            <img key={i} src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ))}
                        </div>
                      )}
                      {fbSelectedPhotos.length === 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2px', height: '200px', background: '#000' }}>
                          <img src={fbSelectedPhotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '2px', height: '100%' }}>
                            <img src={fbSelectedPhotos[1]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                            <img src={fbSelectedPhotos[2]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                          </div>
                        </div>
                      )}
                      {fbSelectedPhotos.length >= 4 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', height: '200px', background: '#000' }}>
                          <img src={fbSelectedPhotos[0]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                          <img src={fbSelectedPhotos[1]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                          <img src={fbSelectedPhotos[2]} alt="" style={{ width: '100%', height: '99px', objectFit: 'cover' }} />
                          <div style={{ position: 'relative', width: '100%', height: '99px' }}>
                            <img src={fbSelectedPhotos[3]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {fbSelectedPhotos.length > 4 && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                                +{fbSelectedPhotos.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Engagement Counters */}
                      <div style={{ padding: '8px 14px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#65676B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '13px' }}>👍❤️</span>
                          <span>{activeDossier?.likesCount || 0}</span>
                        </div>
                        <div>{activeDossier?.commentsCount || 0} bình luận · {activeDossier?.sharesCount || 0} chia sẻ</div>
                      </div>

                      {/* Interactive Action Bar */}
                      <div style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-around', background: '#FFF' }}>
                        {['👍 Thích','💬 Bình luận','↗️ Chia sẻ'].map(a => (
                          <button key={a} style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '13px', color: '#65676B', fontWeight: '700', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s' }}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ZALO P2P CHANNEL (GỬI GIỮA 2 SỐ ĐIỆN THOẠI CÁ NHÂN) ─────── */}
            {activeChannel === 'zalo' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Mode Selector: Group vs Personal P2P */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #BAE6FD', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#002855' }}>CHẾ ĐỘ GỬI ZALO:</span>
                    <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                      <button
                        onClick={() => setZaloTargetMode('group')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: zaloTargetMode === 'group' ? '#0068FF' : 'transparent',
                          color: zaloTargetMode === 'group' ? '#FFFFFF' : '#475569',
                          boxShadow: zaloTargetMode === 'group' ? '0 2px 6px rgba(0,104,255,0.25)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <i className="fa-solid fa-users" /> 👥 NHÓM ZALO CÔNG ĐOÀN (Khuyên dùng)
                      </button>
                      <button
                        onClick={() => setZaloTargetMode('personal')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: zaloTargetMode === 'personal' ? '#059669' : 'transparent',
                          color: zaloTargetMode === 'personal' ? '#FFFFFF' : '#475569',
                          boxShadow: zaloTargetMode === 'personal' ? '0 2px 6px rgba(5,150,105,0.25)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <i className="fa-solid fa-user" /> 👤 CÁ NHÂN P2P (SĐT)
                      </button>
                    </div>
                  </div>

                  {/* Bot Connection Quick Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {zaloBotStatus.isConnected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '5px 12px', borderRadius: '20px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#065F46' }}>
                          Bot Tự Động: <strong>{zaloBotStatus.botInfo?.name || 'Đã kết nối'}</strong>
                        </span>
                        <button
                          onClick={logoutZaloBot}
                          style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          title="Đăng xuất bot"
                        >
                          [Ngắt]
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '700', background: '#FEF3C7', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                          ⚠️ Bot ngầm chưa kích hoạt
                        </span>
                        <button
                          onClick={startBotQrLogin}
                          style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #0068FF, #0284C7)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(0,104,255,0.25)' }}
                          title="Quét mã QR để kích hoạt bot tự động bắn tin vào nhóm"
                        >
                          <i className="fa-solid fa-qrcode" /> 📲 Quét QR Kết Nối Bot
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. Configuration Panel: Group vs Personal */}
                {zaloTargetMode === 'group' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'linear-gradient(135deg, #EFF6FF, #F8FAFC)', borderRadius: '12px', border: '1.5px solid #93C5FD', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0068FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', flexShrink: 0 }}>
                        <i className="fa-solid fa-users-rectangle" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase' }}>
                            LINK NHÓM ZALO TIẾP NHẬN BÀI ĐĂNG:
                          </span>
                          <span style={{ fontSize: '10px', color: '#0068FF', fontWeight: '800' }}>
                            Đích đến: Nhóm Công Đoàn
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <input
                            type="text"
                            value={zaloGroupLink}
                            onChange={e => setZaloGroupLink(e.target.value)}
                            placeholder="Dán link nhóm Zalo (VD: https://zalo.me/g/wdhpzaoap7wkxb074exv)"
                            style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1.5px solid #60A5FA', fontSize: '13px', fontWeight: '700', color: '#002855', outline: 'none' }}
                          />
                          <button
                            onClick={() => {
                              showRollbackToast('💾 Đã lưu link nhóm Zalo đích!');
                            }}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', background: '#0068FF', color: 'white', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            💾 Lưu Link
                          </button>
                          <button
                            onClick={() => window.open(zaloGroupLink, '_blank')}
                            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #BAE6FD', background: '#FFFFFF', color: '#0369A1', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                            title="Mở nhóm trên Zalo"
                          >
                            🌐 Mở Nhóm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'linear-gradient(135deg, #F0FDF4, #F8FAFC)', borderRadius: '12px', border: '1.5px solid #A7F3D0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '14px' }}>
                    {/* Sender Personal Account */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #BAE6FD', flex: 1, minWidth: '280px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0068FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', flexShrink: 0 }}>
                        <i className="fa-solid fa-user-tie" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase' }}>
                            1. SĐT NGƯỜI GỬI:
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Zalo máy / web</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <input
                            type="tel"
                            value={senderPhoneInput}
                            onChange={e => setSenderPhoneInput(e.target.value)}
                            placeholder="SĐT người gửi (VD: 0912345678)"
                            style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #7DD3FC', fontSize: '13px', fontWeight: '700', color: '#0369A1', outline: 'none' }}
                          />
                          <button
                            onClick={handleQuickSavePhone}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#0284C7', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            title="Lưu số điện thoại người gửi"
                          >
                            💾 Lưu
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#EFF6FF', border: '2px solid #93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0068FF', fontSize: '15px', fontWeight: '900' }}>
                        <i className="fa-solid fa-arrow-right" />
                      </div>
                    </div>

                    {/* Recipient Personal Account */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #6EE7B7', flex: 1, minWidth: '280px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', flexShrink: 0 }}>
                        <i className="fa-solid fa-mobile-screen-button" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>
                            2. SĐT NGƯỜI NHẬN:
                          </span>
                          <span style={{ fontSize: '10px', color: '#059669', fontWeight: '800' }}>Nhận tin thật</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <input
                            type="tel"
                            value={recipientPhoneInput}
                            onChange={e => setRecipientPhoneInput(e.target.value)}
                            placeholder="VD: 0386543483"
                            style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #6EE7B7', fontSize: '13px', fontWeight: '800', color: '#065F46', outline: 'none' }}
                          />
                          <button
                            onClick={handleQuickSavePhone}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#059669', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            title="Lưu số điện thoại nhận tin"
                          >
                            💾 Lưu SĐT
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Main 2-Column Split: Left Composer, Right Realistic Zalo Smartphone Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '22px', alignItems: 'start' }}>
                  {/* Left Column: Zalo Message Composer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Source Article Live Indicator */}
                    <div style={{ padding: '8px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ background: '#0068FF', color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>BÀI BÁO GỐC</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title || 'Chưa đặt tiêu đề bài báo'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        🔗 {activeArticleId ? `ID: #${activeArticleId}` : 'Bản nháp Canvas'}
                      </span>
                    </div>

                    {/* Sync + Link Tools Action Bar */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={generateZaloWithAi} className="action-btn" style={{ background: 'linear-gradient(135deg, #0068FF, #0284C7)', color: 'white', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,104,255,0.25)' }} title="AI tự động phân tích bài báo và soạn tin nhắn Zalo súc tích, dễ đọc và gắn kèm link">
                        ⚡ AI Soạn Tin Zalo
                      </button>
                      <button onClick={syncZaloFromWeb} className="action-btn" style={{ background: '#EFF6FF', color: '#0068FF', border: '1px solid #BFDBFE', fontWeight: '700' }} title="Đồng bộ tức thì tiêu đề, tóm tắt và link bài viết vào tin nhắn Zalo">
                        🔄 Đồng Bộ Nhanh
                      </button>
                      <button onClick={() => insertArticleLinkToChannel('zalo')} className="action-btn" style={{ background: '#FFF', color: '#0284C7', border: '1px solid #BAE6FD', fontWeight: '700', fontSize: '11.5px' }} title="Chèn nhanh link bài báo trên web vào tin nhắn">
                        🔗 Chèn Link Bài
                      </button>
                      <button onClick={() => insertDocLinksToChannel('zalo')} className="action-btn" style={{ background: '#FFF', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700', fontSize: '11.5px' }} title="Chèn link tải file đính kèm">
                        📎 Chèn Link File ({attachedFiles.filter(f => f.type !== 'image').length})
                      </button>
                    </div>

                    {/* Quick templates pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#002855' }}>Mẫu nhanh:</span>
                      {ZALO_TEMPLATES.map(tpl => (
                        <button key={tpl.label} onClick={() => setZaloText(tpl.text)} className="fbpill" style={{ background: '#E0F2FE', color: '#0369A1', borderColor: '#BAE6FD', padding: '3px 8px', fontSize: '11px' }}>{tpl.label}</button>
                      ))}
                    </div>

                    {/* Zalo Message Composer Box */}
                    <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-comment-dots" style={{ color: '#0068FF' }} />
                          NỘI DUNG TIN NHẮN ZALO GỬI ĐI:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: '700', color: zaloText.length > 1000 ? '#DC2626' : '#64748B' }}>
                            {zaloText.length} / 1000 ký tự
                          </div>
                          <button
                            onClick={sendZaloMessage}
                            disabled={isPublishingNow}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#0068FF', color: 'white', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,104,255,0.25)' }}
                            title="Gửi ngay tin nhắn"
                          >
                            <i className="fa-solid fa-paper-plane" /> 🚀 Gửi Ngay
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={zaloText}
                        onChange={e => setZaloText(e.target.value)}
                        placeholder="Nhập nội dung tin nhắn gửi tới Nhóm Zalo hoặc cá nhân..."
                        rows={10}
                        style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.65', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', background: '#FBFCFE' }}
                      />

                      {/* Photo Attachment */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-image" style={{ color: '#0068FF' }} />
                            ẢNH ĐÍNH KÈM TIN NHẮN:
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              ref={zaloFileInputRef}
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleZaloPhotoUpload}
                            />
                            <button
                              onClick={() => zaloFileInputRef.current?.click()}
                              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #0068FF', background: '#EFF6FF', color: '#0068FF', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                              title="Tải ảnh đính kèm từ máy tính của bạn"
                            >
                              <i className="fa-solid fa-cloud-arrow-up" /> + Tải ảnh từ máy tính
                            </button>
                            {eventPhotos.length > 0 && (
                              <button
                                onClick={() => {
                                  setZaloPhoto(eventPhotos[0]?.url);
                                  showRollbackToast('Đã chọn ảnh đại diện từ hồ sơ sự kiện');
                                }}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BAE6FD', background: '#FFF', color: '#0284C7', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                🖼️ Lấy ảnh từ bài
                              </button>
                            )}
                            {zaloPhoto && (
                              <button
                                onClick={() => setZaloPhoto(null)}
                                style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FFF', color: '#DC2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                ✕ Xóa ảnh
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Image Preview Banner */}
                        {zaloPhoto ? (
                          <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #BAE6FD', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                            <img src={zaloPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '6px', left: '8px', background: 'rgba(0,0,0,0.65)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                              Ảnh đính kèm
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => zaloFileInputRef.current?.click()}
                            style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '14px', textAlign: 'center', color: '#64748B', fontSize: '12px', cursor: 'pointer', background: '#F8FAFC' }}
                          >
                            Chưa có ảnh đính kèm. Nhấn để <strong>tải ảnh từ máy tính</strong>.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Action Buttons - ONE PRIMARY ACTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        onClick={sendZaloMessage} 
                        disabled={isPublishingNow}
                        className="action-btn" 
                        style={{
                          padding: '14px 18px',
                          background: zaloTargetMode === 'group'
                            ? (zaloBotStatus.isConnected ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #0068FF, #0284C7)')
                            : 'linear-gradient(135deg, #059669, #047857)',
                          color: 'white',
                          fontWeight: '800',
                          fontSize: '14px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 14px rgba(0,104,255,0.3)',
                          cursor: isPublishingNow ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <i className={zaloBotStatus.isConnected ? 'fa-solid fa-robot' : 'fa-solid fa-paper-plane'} style={{ fontSize: '17px' }} /> 
                        {isPublishingNow ? 'Đang đẩy tin...' : (
                          zaloTargetMode === 'group'
                            ? (zaloBotStatus.isConnected ? '🤖 BOT TỰ ĐỘNG ĐẨY TIN VÀO NHÓM ZALO' : '🚀 GỬI BÀI VÀO NHÓM ZALO (1-CHẠM)')
                            : `🚀 Gửi Tin Sang SĐT: ${recipientPhoneInput || '0386543483'}`
                        )}
                      </button>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => {
                            const fullContent = (zaloText || `[CÔNG ĐOÀN TDMU] ${title || 'Bản tin'}\n\n${sapo || ''}`).trim();
                            const linkUrl = getPublicArticleUrl();
                            navigator.clipboard.writeText(`${fullContent}\n\n🔗 Xem chi tiết: ${linkUrl}`);
                            showRollbackToast('📋 Đã copy toàn bộ nội dung tin nhắn và liên kết!');
                          }} 
                          className="action-btn" 
                          style={{ background: '#FFF', border: '1.5px solid #CBD5E1', color: '#334155', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          📋 Sao Chép Tin Nhắn & Link
                        </button>
                        {zaloTargetMode === 'group' ? (
                          <button 
                            onClick={() => window.open(zaloGroupLink || 'https://zalo.me/g/wdhpzaoap7wkxb074exv', '_blank')} 
                            className="action-btn" 
                            style={{ background: '#EFF6FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            💬 Mở Nhóm Zalo Trực Tiếp
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              const phoneClean = (recipientPhoneInput || '0386543483').replace(/^0/, '84');
                              window.open(`https://chat.zalo.me/?phone=${phoneClean}`, '_blank');
                            }} 
                            className="action-btn" 
                            style={{ background: '#EFF6FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            💬 Mở Chat Trực Tiếp Trên Zalo Web
                          </button>
                        )}
                        {!zaloBotStatus.isConnected && (
                          <button
                            onClick={startBotQrLogin}
                            className="action-btn"
                            style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            📲 Quét QR Bật Bot Ngầm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Realistic Zalo Smartphone Preview (Công Đoàn Review Box) */}
                  <div style={{ position: 'sticky', top: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#002855', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-mobile-screen" style={{ color: '#0068FF' }} /> XEM TRƯỚC TIN NHẮN CÔNG ĐOÀN (ZALO):
                    </div>

                    <div style={{ background: '#E5EBF5', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '2px solid #CBD5E1' }}>
                      {/* Phone Top Bar */}
                      <div style={{ background: '#0068FF', padding: '6px 14px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', fontSize: '11px', fontWeight: '700' }}>
                        <span>09:41</span>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
                          <i className="fa-solid fa-signal" />
                          <i className="fa-solid fa-wifi" />
                          <i className="fa-solid fa-battery-full" />
                        </div>
                      </div>

                      {/* Zalo Công Đoàn Chat Header */}
                      <div style={{ background: '#0068FF', padding: '8px 12px 10px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>‹</span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FFFFFF', color: '#002855', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '900', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #FCD34D', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                          <img src="/images/logo_cong_doan.png" alt="Công đoàn" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '-0.2px' }}>
                            Công Đoàn Trường ĐH Thủ Dầu Một
                            <span style={{ background: '#38BDF8', color: '#002855', fontSize: '9px', fontWeight: '900', padding: '1px 5px', borderRadius: '10px' }}>✓ OA</span>
                          </div>
                          <div style={{ fontSize: '10px', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}></span>
                            Đang hoạt động • Kênh Tin Tức &amp; Chăm Lo Đoàn Viên
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '14px', opacity: 0.9 }}>
                          <i className="fa-solid fa-phone" title="Gọi thoại" />
                          <i className="fa-solid fa-video" title="Gọi video" />
                          <i className="fa-solid fa-bars" title="Tuỳ chọn" />
                        </div>
                      </div>

                      {/* Chat Messages Canvas */}
                      <div style={{ padding: '14px 12px', minHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Date Pill */}
                        <div style={{ alignSelf: 'center', background: '#D1D5DB', color: '#374151', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>
                          HÔM NAY
                        </div>

                        {/* Speech Bubble */}
                        <div style={{ background: '#FFFFFF', borderRadius: '14px 14px 14px 2px', padding: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', maxWidth: '92%', border: '1px solid #E2E8F0' }}>
                          {/* Attached Banner Image */}
                          {(zaloPhoto || (eventPhotos.length > 0 && eventPhotos[0].url)) && (
                            <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', background: '#000' }}>
                              <img src={zaloPhoto || eventPhotos[0]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}

                          {/* Message Header */}
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0068FF', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-bullhorn" /> CÔNG ĐOÀN TDMU THÔNG BÁO
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#002855', marginBottom: '6px' }}>
                            {title || 'THÔNG BÁO HOẠT ĐỘNG CÔNG ĐOÀN'}
                          </div>

                          {/* Message Body */}
                          <div style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#1E293B', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                            {zaloText || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Nội dung tin nhắn sẽ hiển thị trực quan tại đây...</span>}
                          </div>

                          {/* Action CTA Button inside Zalo Bubble */}
                          <div style={{ marginTop: '10px', padding: '8px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#0068FF', cursor: 'pointer' }}>
                            👉 Xem toàn văn bài viết trên Web ➔
                          </div>

                          {/* Message Timestamp & Double Tick */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
                            <span>Vừa xong</span>
                            <span style={{ color: '#0068FF', fontWeight: '900' }}>✓✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Tip Card */}
                      <div style={{ background: '#F8FAFC', padding: '8px 12px', borderTop: '1px solid #CBD5E1', fontSize: '11px', color: '#475569' }}>
                        📱 <strong>Kênh phát hành:</strong> <strong>Công Đoàn Trường ĐH Thủ Dầu Một</strong> ➔ Gửi tới: <strong>Toàn thể Đoàn viên &amp; Cán bộ GV</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SCHEDULE CHANNEL ────────────────────────────────────────── */}
            {activeChannel === 'schedule' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
                  {/* Left: Schedule Form */}
                  <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-calendar-plus" style={{ color: '#8B5CF6' }} /> Hẹn Lịch Xuất Bản Tự Động
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Hệ thống Dispatcher sẽ tự động quét và phát hành đúng thời gian đã chọn:</div>
                    
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#002855', display: 'block', marginBottom: '6px' }}>Chọn các kênh đăng:</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {[['web','📰 Website'],['fb','📘 Facebook'],['zalo','💬 Zalo OA']].map(([ch, label]) => (
                          <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
                            <input type="checkbox" checked={scheduleChannels[ch]} onChange={e => setScheduleChannels(p => ({...p, [ch]: e.target.checked}))} style={{ width: '15px', height: '15px' }} />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#002855', display: 'block', marginBottom: '6px' }}>Thời gian xuất bản:</label>
                      <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <button onClick={handleConfirmSchedule} className="action-btn" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: 'white', justifyContent: 'center', fontWeight: '700', padding: '10px 16px', marginTop: '6px' }}>
                      <i className="fa-solid fa-clock" /> Xác Nhận Lập Lịch Tự Động
                    </button>
                  </div>

                  {/* Right: Scheduled Queue */}
                  <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-list-check" style={{ color: '#0284C7' }} /> Hàng Đợi Lập Lịch ({schedulesList.length})
                      </div>
                      <button onClick={fetchSchedulesList} style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-rotate-right" /> Làm mới
                      </button>
                    </div>

                    {schedulesList.length === 0 ? (
                      <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                        <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '28px', marginBottom: '8px', display: 'block', color: '#CBD5E1' }} />
                        Chưa có lịch hẹn phát hành nào trong hàng đợi.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                        {schedulesList.map(sch => (
                          <div key={sch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>{sch.title || ('Bài viết ID #' + sch.articleId)}</div>
                              <div style={{ color: '#64748B', fontSize: '11px', display: 'flex', gap: '12px' }}>
                                <span>⏰ {new Date(sch.scheduledAt).toLocaleString('vi-VN')}</span>
                                <span>📡 Kênh: {(sch.channels || [sch.channel]).join(', ').toUpperCase()}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '700', background: sch.status === 'done' ? '#DCFCE7' : sch.status === 'failed' ? '#FEE2E2' : '#FEF3C7', color: sch.status === 'done' ? '#166534' : sch.status === 'failed' ? '#991B1B' : '#92400E' }}>
                                {sch.status === 'done' ? '✓ ĐÃ PHÁT HÀNH' : sch.status === 'failed' ? '⚠ LỖI' : '⏳ CHỜ ĐẾN GIỜ'}
                              </span>
                              {sch.status === 'pending' && (
                                <button onClick={() => handleCancelSchedule(sch.id)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }} title="Hủy lịch hẹn">Hủy</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </main>

          {/* DRAGGABLE RESIZER */}
          <div onMouseDown={startResize} style={{ width: '6px', background: '#E2E8F0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = '#2563EB'} onMouseLeave={e => e.currentTarget.style.background = '#E2E8F0'} title="Kéo để điều chỉnh">
            <div style={{ width: '2px', height: '18px', background: '#94A3B8', borderRadius: '1px' }} />
          </div>

          {/* PANE 3: RIGHT AI COPILOT */}
          <aside
            onMouseEnter={() => setRightHovered(true)}
            onMouseLeave={() => setRightHovered(false)}
            style={{ width: `${effectiveRightWidth}px`, background: '#FFF', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: isDragging.current ? 'none' : 'width 0.2s ease', flexShrink: 0, zIndex: rightPinned ? 10 : 30, boxShadow: !rightPinned && rightHovered ? '-6px 0 20px rgba(0,0,0,0.1)' : 'none' }}
          >
            {!rightPinned && !rightHovered ? (
              /* Mini icon strip */
              <div style={{ width: '48px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: '14px', background: '#FAFAFA' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#002855', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </div>
                <button onClick={() => setRightPinned(true)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '13px' }} title="Ghim mở Trợ lý AI">
                  <i className="fa-solid fa-thumbtack" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: `${Math.max(280, rightWidth)}px` }}>
                {/* Header Sub-Agent Profiles */}
                {(() => {
                  const agentProfiles = {
                    web: {
                      name: 'Tổng Biên Tập AI',
                      badge: 'Web Newsroom',
                      sub: 'Chuẩn 5W1H · Báo chí chính luận · Xuất bản Word/PDF',
                      icon: 'fa-solid fa-newspaper',
                      iconColor: '#F59E0B',
                      gradient: 'linear-gradient(135deg,#002855,#001A38)'
                    },
                    fb: {
                      name: 'Trợ Lý Facebook Fanpage AI',
                      badge: 'Social Media',
                      sub: 'Viral Hooks · Hashtags · Tự động gắn Link',
                      icon: 'fa-brands fa-facebook',
                      iconColor: '#60A5FA',
                      gradient: 'linear-gradient(135deg,#1877F2,#0F172A)'
                    },
                    zalo: {
                      name: 'Trợ Lý Zalo AI',
                      badge: 'Direct Chat P2P',
                      sub: 'Gửi tin nhắn 2 số điện thoại · Tóm tắt ý chính · Đính kèm link',
                      icon: 'fa-solid fa-comment-dots',
                      iconColor: '#38BDF8',
                      gradient: 'linear-gradient(135deg,#0068FF,#0369A1)'
                    },
                    schedule: {
                      name: 'Điều Phối Viên Lập Lịch AI',
                      badge: 'Dispatcher',
                      sub: 'Lập lịch phát hành đa kênh tự động',
                      icon: 'fa-solid fa-calendar-check',
                      iconColor: '#34D399',
                      gradient: 'linear-gradient(135deg,#047857,#064E3B)'
                    }
                  };
                  const currentAgent = agentProfiles[activeChannel] || agentProfiles.web;
                  return (
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', background: currentAgent.gradient, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={currentAgent.icon} style={{ color: currentAgent.iconColor, fontSize: '15px' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>{currentAgent.name}</span>
                            <span style={{ fontSize: '8.5px', background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>{currentAgent.badge}</span>
                          </div>
                          <div style={{ fontSize: '9px', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: autopilotLoading || aiLoading ? '#F59E0B' : '#10B981', display: 'inline-block' }} />
                            <span>{autopilotLoading ? 'Đang viết bài...' : aiLoading ? 'Đang phân tích...' : currentAgent.sub}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => setChatMessages([{ id: Date.now(), sender: 'ai', text: `Trợ lý AI (${currentAgent.name}) sẵn sàng hỗ trợ bạn tác nghiệp kênh ${currentAgent.badge}!`, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94A3B8', borderRadius: '4px', padding: '3px 6px', fontSize: '10px', cursor: 'pointer' }} title="Làm mới đoạn chat">
                          <i className="fa-solid fa-arrow-rotate-right" />
                        </button>
                        <button onClick={() => setRightPinned(!rightPinned)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: rightPinned ? '#38BDF8' : '#94A3B8', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '11px' }} title={rightPinned ? 'Bỏ ghim' : 'Ghim thanh công cụ'}>
                          <i className="fa-solid fa-thumbtack" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Action Command Bar */}
                <div style={{ padding: '10px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <button
                    id="btn-upload-files"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      color: '#0284C7',
                      border: '1.5px dashed #38BDF8',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      boxShadow: '0 1px 2px rgba(2, 132, 199, 0.06)',
                      transition: 'all 0.15s'
                    }}
                    title="Nạp tài liệu Word (.docx), PDF, Excel (.xlsx) hoặc ảnh sự kiện từ máy tính hoặc kéo thả"
                  >
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '13px', color: '#0284C7' }} />
                    <span>Nạp tài liệu & ảnh sự kiện {attachedFiles.length > 0 ? `(${attachedFiles.length})` : ''}</span>
                  </button>

                  {/* Định hướng bài viết tùy chọn cho Autopilot */}
                  <textarea
                    id="autopilot-custom-direction"
                    value={autopilotPrompt}
                    onChange={e => setAutopilotPrompt(e.target.value)}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    rows={2}
                    placeholder="💡 Định hướng bài viết (tùy chọn: ví dụ 'Tập trung trận chung kết bóng đá nam', 'Nhấn mạnh chào mừng 16 năm thành lập TDMU')..."
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      maxHeight: '80px',
                      padding: '6px 10px',
                      border: '1px solid #BAE6FD',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      lineHeight: '1.45',
                      background: '#FFFFFF',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  />

                  {/* NÚT VIẾT TO NẰM NGAY BÊN DƯỚI NÚT NẠP */}
                  <button
                    id="btn-autopilot-start"
                    onClick={() => runAutopilot()}
                    disabled={autopilotLoading}
                    style={{
                      width: '100%',
                      background: autopilotLoading
                        ? '#94A3B8'
                        : 'linear-gradient(135deg, #002855 0%, #0284C7 50%, #2563EB 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      letterSpacing: '0.3px',
                      cursor: autopilotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(2,132,199,0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Phân tích hồ sơ tư liệu và tổng hợp bài viết hoàn chỉnh"
                  >
                    {autopilotLoading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '13px' }} />
                        <span>Đang Tổng Hợp Bài Viết...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#FCD34D', fontSize: '14px' }} />
                        <span>⚡ TỔNG HỢP & SOẠN THẢO BÀI VIẾT</span>
                      </>
                    )}
                  </button>

                  {(attachedFiles.length > 0 || eventPhotos.length > 0) && (
                    <div style={{ padding: '2px 4px', fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📂 Hồ sơ sẵn sàng:</span>
                      <strong style={{ color: '#0284C7' }}>{attachedFiles.length} tệp</strong>
                      <span>•</span>
                      <strong style={{ color: '#2563EB' }}>{eventPhotos.length} ảnh sự kiện</strong>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" multiple accept="image/*,.docx,.doc,.pdf,.xlsx,.pptx,.txt" style={{ display: 'none' }} onChange={e => processFiles(e.target.files, true)} />
                  <input ref={folderInputRef} type="file" multiple webkitdirectory="" style={{ display: 'none' }} onChange={e => processFiles(e.target.files, true)} />
                </div>

                {/* Chat messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rollbackNotification && (
                    <div style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', textAlign: 'center', boxShadow: '0 2px 6px rgba(37,99,235,0.08)' }}>
                      {rollbackNotification}
                    </div>
                  )}
                  {chatMessages.map(msg => {
                    // 1. Thẻ Hồ Sơ Tư Liệu
                    if (msg.type === 'dossier') {
                      return (
                        <div key={msg.id} style={{ background: '#FFF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 2px 8px rgba(2,132,199,0.08)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #E0F2FE', paddingBottom: '6px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-folder-open" style={{ color: '#0284C7' }} />
                              <span>Hồ Sơ Tư Liệu ({attachedFiles.length} tệp • {eventPhotos.length} ảnh)</span>
                            </div>
                            {attachedFiles.length > 0 && (
                              <button onClick={clearAllAttachments} style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }} title="Xóa toàn bộ hồ sơ đã nạp">
                                🗑️ Xóa hết hồ sơ
                              </button>
                            )}
                          </div>
                          {/* File list */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: eventPhotos.length > 0 ? '8px' : '0' }}>
                            {attachedFiles.filter(f => f.type !== 'image').length === 0 && eventPhotos.length === 0 ? (
                              <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '10px 0', lineHeight: '1.5' }}>
                                Chưa có tài liệu. Bấm <strong>"Nạp tài liệu & ảnh sự kiện"</strong> ở trên hoặc kéo thả tệp vào đây.
                              </div>
                            ) : attachedFiles.filter(f => f.type !== 'image').map((f, fi) => (
                              <div key={fi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', fontSize: '10.5px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                  <span style={{ background: f.name.endsWith('.xlsx') ? '#16A34A' : f.name.endsWith('.pdf') ? '#DC2626' : f.name.endsWith('.pptx') ? '#EA580C' : '#2563EB', color: 'white', fontSize: '8px', fontWeight: '900', padding: '1px 4px', borderRadius: '2px' }}>
                                    {f.name.split('.').pop().toUpperCase()}
                                  </span>
                                  <span style={{ color: '#1E293B', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={f.name}>{f.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '9.5px', color: '#15803D', fontWeight: '700' }}>✓ Sẵn sàng</span>
                                  <button onClick={() => removeAttachedFile(f.name)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px', padding: '0 3px', fontWeight: 'bold', lineHeight: '1' }} title="Xóa tệp này khỏi hồ sơ" onMouseEnter={e => e.target.style.color = '#DC2626'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Photo grid */}
                          {eventPhotos.length > 0 && (
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '5px' }}>📸 ẢNH SỰ KIỆN SẴN SÀNG CHÈN:</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                {eventPhotos.map((p, pidx) => (
                                  <div key={pidx} style={{ border: p.isFeatured ? '1.5px solid #2563EB' : '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', background: '#FFF', position: 'relative' }}>
                                    <div style={{ position: 'relative' }}>
                                      <img src={p.url} alt={p.caption} style={{ width: '100%', height: '64px', objectFit: 'cover', display: 'block' }} />
                                      {p.isAnalyzingVision && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,132,199,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '2px', fontSize: '8.5px', fontWeight: '800' }}>
                                          <i className="fa-solid fa-eye fa-bounce" style={{ fontSize: '13px' }} />
                                          <span>AI Vision đang xem...</span>
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ padding: '2px 3px' }}>
                                      <input
                                        type="text"
                                        value={p.caption || ''}
                                        onChange={e => updatePhotoCaption(pidx, e.target.value)}
                                        style={{
                                          width: '100%',
                                          boxSizing: 'border-box',
                                          border: '1px solid #E2E8F0',
                                          borderRadius: '3px',
                                          padding: '2px 4px',
                                          fontSize: '8.5px',
                                          fontWeight: '600',
                                          color: '#1E293B',
                                          background: '#F8FAFC'
                                        }}
                                        title="Bấm để chỉnh sửa tiêu đề chú thích ảnh"
                                        placeholder="AI Vision đang đặt tiêu đề..."
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px', padding: '2px 4px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
                                      <button onClick={() => insertPhoto(p.url, p.caption)} style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px', cursor: 'pointer' }} title="Chèn vào CKEditor 5">+ Chèn</button>
                                      <button onClick={() => triggerAiVision(pidx)} disabled={p.isAnalyzingVision} style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px 4px', cursor: 'pointer' }} title="Nhờ AI Vision nhìn lại ảnh này và tự đặt tiêu đề mới">👁️ AI</button>
                                      <button onClick={() => setFeaturedPhoto(pidx)} style={{ background: p.isFeatured ? '#2563EB' : '#F1F5F9', color: p.isFeatured ? 'white' : '#64748B', border: 'none', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px 4px', cursor: 'pointer' }} title={p.isFeatured ? 'Ảnh đại diện' : 'Đặt làm ảnh đại diện'}>★</button>
                                      <button onClick={() => removePhoto(pidx)} style={{ background: '#FFF1F2', color: '#E11D48', border: 'none', borderRadius: '3px', fontSize: '8.5px', fontWeight: '700', padding: '2px 5px', cursor: 'pointer' }} title="Xóa ảnh này khỏi hồ sơ">✕</button>
                                    </div>
                                    {p.isFeatured && <span style={{ position: 'absolute', top: '2px', left: '2px', background: '#2563EB', color: 'white', fontSize: '7px', fontWeight: '800', padding: '1px 3px', borderRadius: '2px' }}>Đại diện</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 2. Thẻ Tiến Độ Xử Lý AI
                    if (msg.type === 'progress') {
                      return (
                        <div key={msg.id} style={{ background: '#0F172A', color: 'white', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', lineHeight: '1.6', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#38BDF8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-wand-magic-sparkles" />
                            <span>{msg.title || 'Tiến độ xử lý AI'}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {msg.steps.map((st, si) => (
                              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                {st.status === 'running' ? (
                                  <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#38BDF8', fontSize: '10px' }} />
                                ) : st.status === 'done' ? (
                                  <i className="fa-solid fa-circle-check" style={{ color: '#34D399', fontSize: '10px' }} />
                                ) : (
                                  <i className="fa-solid fa-circle-xmark" style={{ color: '#F87171', fontSize: '10px' }} />
                                )}
                                <span style={{ color: st.status === 'running' ? '#38BDF8' : st.status === 'done' ? '#E2E8F0' : '#F87171' }}>
                                  {st.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // 3. Thẻ So Sánh Thay Đổi (Diff Review)
                    if (msg.type === 'diff') {
                      return (
                        <div key={msg.id} style={{ background: '#FFF', border: '1.5px solid #38BDF8', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 4px 12px rgba(56,189,248,0.15)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <i className="fa-solid fa-code-compare" />
                              <span>So sánh thay đổi ({msg.isSelection ? 'Đoạn bôi đen' : 'Toàn bài'})</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#64748B', marginBottom: '6px' }}>
                            <span style={{ color: '#DC2626', fontWeight: '700' }}>Đỏ: Đã xóa</span> • <span style={{ color: '#15803D', fontWeight: '700' }}>Xanh: Viết mới</span>
                          </div>
                          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11.5px', lineHeight: '1.6', maxHeight: '160px', overflowY: 'auto', marginBottom: '8px' }}>
                            {msg.diffParts.map((part, pi) => {
                              if (part.added) return <ins key={pi} style={{ background: '#DCFCE7', color: '#15803D', textDecoration: 'none', fontWeight: '600', padding: '1px 2px', borderRadius: '2px' }}>{part.value}</ins>;
                              if (part.removed) return <del key={pi} style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1px 2px', borderRadius: '2px' }}>{part.value}</del>;
                              return <span key={pi}>{part.value}</span>;
                            })}
                          </div>
                          {msg.isAccepted ? (
                            <div style={{ background: '#DCFCE7', color: '#15803D', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-circle-check" /> Đã áp dụng vào bài viết
                            </div>
                          ) : msg.isDiscarded ? (
                            <div style={{ background: '#F1F5F9', color: '#64748B', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '700' }}>
                              ✕ Đã bỏ qua thay đổi
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => acceptDiff(msg)} style={{ flex: 1, background: '#16A34A', color: 'white', border: 'none', borderRadius: '5px', padding: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✓ Chấp nhận áp dụng</button>
                              <button onClick={() => { setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isDiscarded: true } : m)); setActiveDiff(null); }} style={{ background: '#FFF', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>✕ Bỏ qua</button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 4. Tin nhắn của User
                    if (msg.sender === 'user') {
                      if (editingMsgId === msg.id) {
                        return (
                          <div key={msg.id} style={{ alignSelf: 'flex-end', width: '94%', background: '#F0F9FF', border: '1.5px solid #0284C7', borderRadius: '10px', padding: '10px 12px', boxShadow: '0 4px 12px rgba(2,132,199,0.15)' }}>
                            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0369A1', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className="fa-solid fa-pen-to-square" />
                                <span>Chỉnh sửa câu lệnh</span>
                              </div>
                              <span style={{ fontSize: '9px', color: '#64748B' }}>Nhánh mới sẽ được tạo</span>
                            </div>
                            <textarea
                              value={editPromptText}
                              onChange={e => setEditPromptText(e.target.value)}
                              rows={3}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '8px', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                              <button onClick={cancelEditUserPrompt} style={{ background: '#FFF', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', color: '#64748B', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
                              <button onClick={() => submitEditUserPrompt(msg.id)} style={{ background: '#0284C7', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', color: '#FFF', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-paper-plane" /> Lưu & Chạy lại
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} style={{ alignSelf: 'flex-end', maxWidth: '92%', background: '#002855', color: '#FFF', padding: '9px 12px', borderRadius: '12px 12px 2px 12px', fontSize: '11.5px', lineHeight: '1.5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                            {msg.scope ? <div style={{ fontSize: '9.5px', color: '#93C5FD' }}>📍 {msg.scope}</div> : <div />}
                            
                            {/* Version Navigator < 1 / 3 > */}
                            {msg.versions && msg.versions.length > 1 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '1px 6px', fontSize: '9px' }}>
                                <button onClick={() => navigateUserPromptVersion(msg.id, -1)} disabled={(msg.versionIndex || 0) === 0} style={{ background: 'none', border: 'none', color: '#FFF', opacity: (msg.versionIndex || 0) === 0 ? 0.3 : 1, cursor: (msg.versionIndex || 0) === 0 ? 'default' : 'pointer', padding: '0 2px' }} title="Phiên bản lệnh trước">
                                  <i className="fa-solid fa-chevron-left" />
                                </button>
                                <span style={{ fontWeight: '700' }}>{(msg.versionIndex || 0) + 1} / {msg.versions.length}</span>
                                <button onClick={() => navigateUserPromptVersion(msg.id, 1)} disabled={(msg.versionIndex || 0) === msg.versions.length - 1} style={{ background: 'none', border: 'none', color: '#FFF', opacity: (msg.versionIndex || 0) === msg.versions.length - 1 ? 0.3 : 1, cursor: (msg.versionIndex || 0) === msg.versions.length - 1 ? 'default' : 'pointer', padding: '0 2px' }} title="Phiên bản lệnh sau">
                                  <i className="fa-solid fa-chevron-right" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: '9.5px', color: '#93C5FD' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => startEditUserPrompt(msg)} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }} title="Chỉnh sửa lệnh này">
                                <i className="fa-solid fa-pen" /> Sửa
                              </button>
                              <button onClick={() => rollbackToTurn(msg.id)} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }} title="Rollback cuộc trò chuyện và Canvas về lượt này">
                                <i className="fa-solid fa-clock-rotate-left" /> Rollback
                              </button>
                            </div>
                            <div>{msg.ts}</div>
                          </div>
                        </div>
                      );
                    }

                    // 5. Tin nhắn của AI Assistant
                    return (
                      <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '92%', background: '#F1F5F9', color: '#0F172A', padding: '9px 12px', borderRadius: '12px 12px 12px 2px', fontSize: '11.5px', lineHeight: '1.5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        {/* Hiển thị Thẻ Tool Tác Nghiệp Tự Hành */}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                            {msg.toolCalls.map((tc, tci) => (
                              <div key={tci} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '5px 8px', fontSize: '10.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                  {tc.status === 'running' ? (
                                    <i className="fa-solid fa-gear fa-spin" style={{ color: '#0284C7', fontSize: '10px' }} />
                                  ) : (
                                    <i className="fa-solid fa-circle-check" style={{ color: '#16A34A', fontSize: '10px' }} />
                                  )}
                                  <span style={{ fontWeight: '600', color: tc.status === 'running' ? '#0369A1' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {tc.statusText || tc.toolName}
                                  </span>
                                </div>
                                {tc.result?.action === 'export_ready' && (
                                  <a href={tc.result.downloadUrl} download style={{ background: tc.result.format === 'docx' ? '#15803D' : '#DC2626', color: 'white', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                    <i className={tc.result.format === 'docx' ? 'fa-solid fa-file-word' : 'fa-solid fa-file-pdf'} /> Tải {tc.result.format.toUpperCase()}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #E2E8F0', fontSize: '9.5px', color: '#64748B' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Version Navigator < 1 / 2 > */}
                            {msg.versions && msg.versions.length > 1 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#E2E8F0', borderRadius: '10px', padding: '1px 5px', fontSize: '8.5px', color: '#334155' }}>
                                <button onClick={() => navigateAiResponseVersion(msg.id, -1)} disabled={(msg.versionIndex || 0) === 0} style={{ background: 'none', border: 'none', color: '#334155', opacity: (msg.versionIndex || 0) === 0 ? 0.3 : 1, cursor: (msg.versionIndex || 0) === 0 ? 'default' : 'pointer', padding: '0 2px' }} title="Câu trả lời trước">
                                  <i className="fa-solid fa-chevron-left" />
                                </button>
                                <span style={{ fontWeight: '700' }}>{(msg.versionIndex || 0) + 1} / {msg.versions.length}</span>
                                <button onClick={() => navigateAiResponseVersion(msg.id, 1)} disabled={(msg.versionIndex || 0) === msg.versions.length - 1} style={{ background: 'none', border: 'none', color: '#334155', opacity: (msg.versionIndex || 0) === msg.versions.length - 1 ? 0.3 : 1, cursor: (msg.versionIndex || 0) === msg.versions.length - 1 ? 'default' : 'pointer', padding: '0 2px' }} title="Câu trả lời sau">
                                  <i className="fa-solid fa-chevron-right" />
                                </button>
                              </div>
                            )}

                            {/* Nút Tạo lại (Regenerate) */}
                            <button onClick={() => regenerateAiResponse(msg.id)} disabled={aiLoading} style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }} title="Tạo lại câu trả lời khác cho lệnh này">
                              <i className="fa-solid fa-rotate-right" /> Tạo lại
                            </button>

                            {/* Nút Sao chép */}
                            <button onClick={() => { navigator.clipboard.writeText(msg.text); showRollbackToast('Đã sao chép nội dung!'); }} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }} title="Sao chép nội dung">
                              <i className="fa-regular fa-copy" />
                            </button>

                            {/* Nút Hoàn tác (Rollback) về trước lượt AI này */}
                            <button onClick={() => rollbackToTurn(msg.id)} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '4px', padding: '2px 7px', fontSize: '9.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }} title="Hoàn tác toàn bộ thay đổi do AI thực hiện ở lượt này và quay lại trước đó">
                              <i className="fa-solid fa-clock-rotate-left" /> Hoàn tác
                            </button>
                          </div>
                          <div>{msg.ts}</div>
                        </div>
                      </div>
                    );
                  })}
                  {aiLoading && (
                    <div style={{ alignSelf: 'flex-start', background: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#64748B' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '5px' }} />Đang phân tích & xử lý...
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Selection Context & Prompt Input Area */}
                <div style={{ borderTop: '1px solid #E2E8F0', background: '#FAFAFA', flexShrink: 0 }}>
                  {/* Selection Context Card (Groq Qwen3.8-27B siêu tốc) */}
                  {selectedText ? (
                    <div style={{ padding: '10px 12px', background: '#F0F9FF', borderBottom: '1px solid #BFDBFE' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: '#2563EB', color: 'white', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px' }}>⚡ GROQ QWEN</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369A1' }}>Biên tập nhanh đoạn chọn</span>
                          <span style={{ color: '#64748B', fontSize: '10px' }}>({selectedText.length} ký tự)</span>
                        </div>
                        <button
                          onClick={clearSelection}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '0 4px' }}
                          title="Bỏ chọn"
                        >✕</button>
                      </div>

                      {/* Snippet Preview */}
                      <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', background: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '8px', maxHeight: '48px', overflowY: 'auto', lineHeight: '1.4' }}>
                        "{selectedText}"
                      </div>

                      {/* 2-column Grid of Action Chips */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {[
                          { label: '✨ Sửa tự nhiên', prompt: 'Viết lại đoạn văn này tự nhiên, hấp dẫn, giữ nguyên ý nghĩa cốt lõi' },
                          { label: '✂️ Rút gọn súc tích', prompt: 'Rút ngắn đoạn này còn 1-2 câu thật súc tích, giữ các số liệu và thông tin quan trọng' },
                          { label: '🏛️ Chuẩn trang trọng', prompt: 'Biên tập lại đoạn này theo văn phong báo chí hành chính trang trọng của Công đoàn' },
                          { label: '✏️ Sửa chính tả & câu', prompt: 'Sửa toàn bộ lỗi chính tả, ngữ pháp và trau chuốt câu từ mượt mà' },
                          { label: '📢 Nhấn mạnh khí thế', prompt: 'Diễn đạt lại đoạn này nhấn mạnh tinh thần nhiệt huyết, đoàn kết và lan tỏa', span: true }
                        ].map(chip => (
                          <button
                            key={chip.label}
                            disabled={aiInlineLoading}
                            onClick={() => handleAiInlineEdit(selectedText, chip.prompt)}
                            style={{
                              gridColumn: chip.span ? 'span 2' : 'auto',
                              background: aiInlineLoading ? '#F1F5F9' : '#FFFFFF',
                              border: '1px solid #93C5FD',
                              borderRadius: '8px',
                              padding: '6px 8px',
                              fontSize: '11px',
                              color: aiInlineLoading ? '#94A3B8' : '#1E40AF',
                              cursor: aiInlineLoading ? 'wait' : 'pointer',
                              fontWeight: '700',
                              textAlign: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { if (!aiInlineLoading) { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = '#FFF'; } }}
                            onMouseLeave={e => { if (!aiInlineLoading) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#1E40AF'; } }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      {aiInlineLoading && (
                        <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: '#2563EB', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-spinner fa-spin" /> Đang sửa bằng Groq Qwen3.8-27B...
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Dynamic Sub-Agent Fast Action Chips per Channel */
                    <div style={{ padding: '5px 8px', background: '#F8FAFC', display: 'flex', gap: '4px', overflowX: 'auto', borderBottom: '1px solid #F1F5F9' }}>
                      {activeChannel === 'fb' && [
                        { label: '✨ Soạn Caption Viral', action: () => generateFbWithAi() },
                        { label: '🔗 Chèn Link Bài', action: () => insertArticleLinkToChannel('fb') },
                        { label: '📎 Link Tài Liệu', action: () => insertDocLinksToChannel('fb') },
                        { label: '🏷️ Thêm Hashtags', action: () => runAi('Thêm các hashtag nhận diện thương hiệu Công đoàn TDMU') },
                        { label: '🖼️ Link Album Ảnh', action: () => insertPhotoLinksToChannel() }
                      ].map(chip => (
                        <button key={chip.label} onClick={chip.action} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', color: '#1D4ED8', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}>{chip.label}</button>
                      ))}

                      {activeChannel === 'zalo' && [
                        { label: '📢 Soạn Thông Báo OA', action: () => generateZaloWithAi() },
                        { label: '📋 Tóm tắt 3 Ý Chính', action: () => runAi('Tóm tắt 3 ý chính súc tích nhất từ bài báo cho Zalo OA') },
                        { label: '📎 Chèn Link Tài Liệu', action: () => insertDocLinksToChannel('zalo') },
                        { label: '🔗 Chèn Link Bài', action: () => insertArticleLinkToChannel('zalo') }
                      ].map(chip => (
                        <button key={chip.label} onClick={chip.action} style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', color: '#0369A1', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}>{chip.label}</button>
                      ))}

                      {(activeChannel === 'web' || activeChannel === 'schedule') && [
                        { label: '⚡ Chuẩn 5W1H', action: () => runAi('Rà soát chuẩn mực báo chí 5W1H và chính tả toàn bài') },
                        { label: '📄 Xuất Word', action: () => runAi('Xuất bài ra file Word (.docx)') },
                        { label: '📑 Xuất PDF', action: () => runAi('Xuất bài ra file PDF') },
                        { label: '📊 Đọc kinh phí Excel', action: () => runAi('Đọc file Excel dự toán kinh phí') }
                      ].map(chip => (
                        <button key={chip.label} onClick={chip.action} style={{ background: '#FFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', color: '#334155', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}>{chip.label}</button>
                      ))}
                    </div>
                  )}

                  {/* Input form - Spacious Prompt Command Box */}
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      id="ai-prompt-input"
                      value={aiPrompt}
                      rows={3}
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          runAi();
                        }
                      }}
                      placeholder={
                        selectedText 
                          ? '👉 Nhập yêu cầu chỉnh sửa đoạn văn đang bôi đen (ví dụ: rút gọn, đổi giọng văn, thêm số liệu...)...' 
                          : activeChannel === 'fb' 
                            ? '💬 Nhập yêu cầu cho Trợ lý Facebook: viết mở đầu thu hút, gắn hashtag, chèn liên kết...'
                            : activeChannel === 'zalo'
                              ? '📱 Nhập yêu cầu cho Trợ lý Zalo OA: soạn bản tin ngắn, điểm danh đại biểu, trích xuất thông báo...'
                              : '💡 Nhập yêu cầu chỉ đạo cho Trợ lý AI (ví dụ: "Viết bài tập trung vào trận chung kết bóng đá nam", "Bổ sung danh sách khen thưởng...", "Rà soát lại chính tả toàn bài")...'
                      }
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        maxHeight: '180px',
                        padding: '10px 12px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        lineHeight: '1.55',
                        outline: 'none',
                        background: '#F8FAFC',
                        color: '#0F172A',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s, background 0.2s'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#0284C7';
                        e.target.style.background = '#FFFFFF';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#CBD5E1';
                        e.target.style.background = '#F8FAFC';
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-regular fa-keyboard" /> Nhấn <strong>Enter</strong> để gửi • <strong>Shift + Enter</strong> xuống dòng
                      </span>
                      <button
                        id="ai-send-btn"
                        onClick={() => runAi()}
                        disabled={aiLoading}
                        style={{
                          background: aiLoading ? '#94A3B8' : 'linear-gradient(135deg, #002855, #2563EB)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '7px 16px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: aiLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                          transition: 'all 0.15s'
                        }}
                        title="Gửi chỉ đạo cho Trợ lý AI"
                      >
                        {aiLoading ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin" />
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane" />
                            <span>Gửi Chỉ Đạo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
        {/* PERSISTENT EMBEDDED MODULE CANVAS (Zero-reload, instant 0ms switching) */}
        <div style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#F8FAFC',
          position: 'relative',
          display: activeNav === 'ai-creator' ? 'none' : 'flex'
        }}>
          <iframe
            ref={portalIframeRef}
            src="/admin-portal.html?embed=1#dashboard"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title="TDMU Admin Portal"
            onLoad={handlePortalIframeLoad}
          />
        </div>
      </div>

      {/* ── AI SETTINGS MODAL ────────────────────────────────────────── */}
      {settingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#002855,#001A38)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800' }}>
                <i className="fa-solid fa-sliders" style={{ color: '#38BDF8' }} />
                <span>Cấu Hình API Key AI Vision & Biên Tập Tin Bài</span>
              </div>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer', lineHeight: '1' }}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: '8px' }}>
                💡 <strong>AI Vision tự động:</strong> Khi nạp ảnh, hệ thống sẽ sử dụng <strong>Google Gemini Flash</strong> hoặc <strong>Groq Llama 3.2 Vision</strong> để trực tiếp đọc chữ trên backdrop, băng rôn và nhận diện nhân vật, hoạt động để tự động đặt tiêu đề báo chí trung thực, không hardcode.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#002855', marginBottom: '6px' }}>
                  🔑 Google Gemini API Key (Khuyên Dùng cho Vision & Viết Bài):
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px', display: 'block' }}>Hỗ trợ Gemini Flash với khả năng nhận diện hình ảnh hiện trường siêu sắc nét.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#002855', marginBottom: '6px' }}>
                  ⚡ Groq API Key (Dự phòng siêu tốc):
                </label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={e => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px', display: 'block' }}>Tự động dùng Llama 3.2 11B Vision để đọc ảnh khi cần.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => setSettingsOpen(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                <button onClick={() => saveAiSettings(geminiKey, groqKey)} style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg,#002855,#2563EB)', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>💾 Lưu Cấu Hình</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OMNICHANNEL MULTI-PUBLISH MODAL ───────────────────────────── */}
      {omnichannelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '620px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#002855,#1E40AF)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '800' }}>
                <i className="fa-solid fa-satellite-dish" style={{ color: '#38BDF8' }} />
                <span>Xuất Bản Đa Kênh Tức Thì (Omnichannel Sync)</span>
              </div>
              <button onClick={() => setOmnichannelModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', lineHeight: '1' }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Article Preview Summary */}
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>BÀI VIẾT PHÁT HÀNH:</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', lineHeight: '1.4' }}>{title || 'Bản tin Công Đoàn TDMU'}</div>
                {sapo && <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sapo}</div>}
              </div>

              {/* Channels Selector */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '8px' }}>
                  CHỌN CÁC KÊNH PHÁT HÀNH ĐỒNG LOẠT:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Website */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${omniChannels.web ? '#0284C7' : '#E2E8F0'}`, background: omniChannels.web ? '#F0F9FF' : '#FFF', cursor: 'pointer' }}>
                    <input type="checkbox" checked={omniChannels.web} onChange={e => setOmniChannels(p => ({ ...p, web: e.target.checked }))} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🌐 Cổng Website Công Đoàn (Website Gốc)</span>
                        <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>MSSQL Live</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Cập nhật trạng thái 'Đã Xuất Bản' trong CSDL và hiển thị ra trang chủ tin tức.</div>
                    </div>
                  </label>

                  {/* Facebook */}
                  <div style={{ borderRadius: '8px', border: `1.5px solid ${omniChannels.fb ? '#1877F2' : '#E2E8F0'}`, background: omniChannels.fb ? '#EFF6FF' : '#FFF', padding: '10px 14px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={omniChannels.fb} onChange={e => setOmniChannels(p => ({ ...p, fb: e.target.checked }))} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1877F2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-brands fa-facebook" />
                          <span>Fanpage Facebook Công Đoàn TDMU</span>
                          <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>Meta Graph API v20.0</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Tự động đăng kèm caption tối ưu, ảnh bìa và link bài viết.</div>
                      </div>
                    </label>
                    {omniChannels.fb && (
                      <div style={{ marginTop: '8px', paddingLeft: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1E40AF' }}>Tài khoản:</span>
                        <select
                          value={selectedFbAccId}
                          onChange={e => setSelectedFbAccId(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid #93C5FD', fontSize: '11.5px', fontWeight: '600', color: '#1E293B', background: '#FFF' }}
                        >
                          {(channelAccounts.facebook || []).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} {acc.isDefault ? '(Mặc định)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Zalo OA */}
                  <div style={{ borderRadius: '8px', border: `1.5px solid ${omniChannels.zalo ? '#0068FF' : '#E2E8F0'}`, background: omniChannels.zalo ? '#F0F9FF' : '#FFF', padding: '10px 14px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={omniChannels.zalo} onChange={e => setOmniChannels(p => ({ ...p, zalo: e.target.checked }))} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0068FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-comment-dots" />
                          <span>Zalo Official Account (OA) TDMU</span>
                          <span style={{ fontSize: '10px', background: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>Open API v3.0</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Gửi bản tin thông báo trực tiếp đến cán bộ, đoàn viên theo dõi OA hoặc Tester.</div>
                      </div>
                    </label>
                    {omniChannels.zalo && (
                      <div style={{ marginTop: '8px', paddingLeft: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0369A1' }}>Tài khoản:</span>
                        <select
                          value={selectedZaloAccId}
                          onChange={e => setSelectedZaloAccId(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1.5px solid #7DD3FC', fontSize: '11.5px', fontWeight: '700', color: '#0F172A', background: '#FFF' }}
                        >
                          {(channelAccounts.zalo || []).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} {acc.recipientPhone ? `(${acc.recipientPhone})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution Results View */}
              {publishResult && (
                <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle-check" /> Kết Quả Phát Hành Đa Kênh:
                  </div>
                  {publishResult.results?.web && (
                    <div style={{ fontSize: '12px', color: '#15803D' }}>
                      🌐 <strong>Website:</strong> {publishResult.results.web.message} (<a href={publishResult.results.web.url} target="_blank" rel="noreferrer" style={{ color: '#0284C7', textDecoration: 'underline' }}>Xem bài viết</a>)
                    </div>
                  )}
                  {publishResult.results?.facebook && (
                    <div style={{ fontSize: '12px', color: '#1D4ED8' }}>
                      📘 <strong>Facebook:</strong> {publishResult.results.facebook.message} (<a href={publishResult.results.facebook.permalinkUrl} target="_blank" rel="noreferrer" style={{ color: '#1877F2', textDecoration: 'underline' }}>Xem bài Fanpage</a>)
                    </div>
                  )}
                  {publishResult.results?.zalo && (
                    <div style={{ fontSize: '12px', color: '#0369A1' }}>
                      💬 <strong>Zalo OA:</strong> {publishResult.results.zalo.message} (Mã tin: {publishResult.results.zalo.messageId})
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setOmnichannelModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}>
                {publishResult ? 'Hoàn Tất' : 'Hủy'}
              </button>
              <button 
                onClick={handleOmnichannelPublishNow} 
                disabled={isPublishingNow}
                style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg,#002855,#2563EB)', color: 'white', fontSize: '12.5px', fontWeight: '800', cursor: isPublishingNow ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
              >
                {isPublishingNow ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Đang phát hành đa kênh...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" /> 🚀 Phát Hành Đa Kênh Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNEL ACCOUNT CONFIGURATION MODAL ─────────────────────── */}
      {accountModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: editingChannel === 'facebook' ? 'linear-gradient(135deg,#1877F2,#1E40AF)' : 'linear-gradient(135deg,#0068FF,#0284C7)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800' }}>
                <i className={editingChannel === 'facebook' ? "fa-brands fa-facebook" : "fa-solid fa-comment-dots"} />
                <span>Cấu Hình Tài Khoản {editingChannel === 'facebook' ? 'Facebook Fanpage' : 'Zalo Gửi Tin'}</span>
              </div>
              <button onClick={() => setAccountModalOpen(false)} style={{ background: 'none', border: 'none', color: '#E2E8F0', fontSize: '20px', cursor: 'pointer', lineHeight: '1' }}>✕</button>
            </div>

            {/* Form Fields */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Account Name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                  TÊN TÀI KHOẢN HIỂN THỊ: *
                </label>
                <input
                  type="text"
                  value={editingAccountData.name || ''}
                  onChange={e => setEditingAccountData(p => ({ ...p, name: e.target.value }))}
                  placeholder={editingChannel === 'zalo' ? "VD: Zalo của tôi (Tester), Ban Truyền Thông CĐ..." : "VD: Fanpage Công Đoàn TDMU, Trang Tester..."}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Account Type */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                  LOẠI HÌNH TÀI KHOẢN:
                </label>
                <select
                  value={editingChannel === 'facebook' ? (editingAccountData.type === 'personal' ? 'personal' : 'page') : (editingAccountData.type || 'personal')}
                  onChange={e => setEditingAccountData(p => ({ ...p, type: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', background: '#FFF' }}
                >
                  {editingChannel === 'zalo' ? (
                    <>
                      <option value="personal">👤 Tài khoản cá nhân / Số điện thoại Tester (Khuyên dùng để test ngay)</option>
                      <option value="oa">🏢 Zalo Official Account Doanh nghiệp (Cần Access Token)</option>
                    </>
                  ) : (
                    <>
                      <option value="page">🏢 Fanpage Doanh nghiệp / Đơn vị (Graph API v20.0)</option>
                      <option value="personal">👤 Trang cá nhân / Sandbox</option>
                    </>
                  )}
                </select>
              </div>

              {/* Zalo-specific fields */}
              {editingChannel === 'zalo' && (
                <>
                  <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', padding: '12px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <i className="fa-solid fa-user-tie" /> SỐ ĐIỆN THOẠI NGƯỜI GỬI:
                      </label>
                      <input
                        type="tel"
                        value={editingAccountData.senderPhone || ''}
                        onChange={e => setEditingAccountData(p => ({ ...p, senderPhone: e.target.value }))}
                        placeholder="VD: 0912345678 (SĐT Zalo trên máy bạn)"
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #7DD3FC', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <i className="fa-solid fa-mobile-screen" /> SỐ ĐIỆN THOẠI NGƯỜI NHẬN (CỦA BẠN):
                      </label>
                      <input
                        type="tel"
                        value={editingAccountData.recipientPhone || ''}
                        onChange={e => setEditingAccountData(p => ({ ...p, recipientPhone: e.target.value }))}
                        placeholder="VD: 0386543483"
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #6EE7B7', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontWeight: '700' }}
                      />
                    </div>

                    <div style={{ fontSize: '11px', color: '#0369A1' }}>
                      💡 <strong>Chế độ Zalo Cá Nhân:</strong> Gửi tin nhắn thật trực tiếp giữa 2 số điện thoại, không cần OA hay Token phức tạp.
                    </div>
                  </div>

                  {editingAccountData.type === 'oa' && (
                    <>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                          ZALO OA ID:
                        </label>
                        <input
                          type="text"
                          value={editingAccountData.oaId || ''}
                          onChange={e => setEditingAccountData(p => ({ ...p, oaId: e.target.value }))}
                          placeholder="VD: 448899123456789"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                          ACCESS TOKEN ZALO OA:
                        </label>
                        <input
                          type="password"
                          value={editingAccountData.accessToken || ''}
                          onChange={e => setEditingAccountData(p => ({ ...p, accessToken: e.target.value }))}
                          placeholder="Nhập Access Token Zalo OA thật"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Facebook-specific fields */}
              {editingChannel === 'facebook' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                      FACEBOOK PAGE ID:
                    </label>
                    <input
                      type="text"
                      value={editingAccountData.pageId || ''}
                      onChange={e => setEditingAccountData(p => ({ ...p, pageId: e.target.value }))}
                      placeholder="VD: 100098765432100"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                      TÊN FANPAGE HIỂN THỊ:
                    </label>
                    <input
                      type="text"
                      value={editingAccountData.pageName || ''}
                      onChange={e => setEditingAccountData(p => ({ ...p, pageName: e.target.value }))}
                      placeholder="VD: Công Đoàn Trường ĐH Thủ Dầu Một"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: '#002855', display: 'block', marginBottom: '4px' }}>
                      PAGE ACCESS TOKEN (Vĩnh viễn hoặc dài hạn):
                    </label>
                    <input
                      type="password"
                      value={editingAccountData.accessToken || ''}
                      onChange={e => setEditingAccountData(p => ({ ...p, accessToken: e.target.value }))}
                      placeholder="EAA..."
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                    <div style={{ fontSize: '11px', color: '#0284C7', marginTop: '4px', lineHeight: '1.4' }}>
                      💡 <strong>Tự động quy đổi:</strong> Bạn có thể dán User Token hoặc Page Token từ Graph API Explorer. Máy chủ sẽ tự động gọi Meta Graph API v20.0 để trích xuất Page Access Token vĩnh viễn tương ứng.
                    </div>
                  </div>
                </>
              )}

              {/* Set as default checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={Boolean(editingAccountData.isDefault)}
                  onChange={e => setEditingAccountData(p => ({ ...p, isDefault: e.target.checked }))}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B' }}>Đặt làm tài khoản mặc định cho kênh này</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!editingAccountData.isDefault && editingAccountData.id && (
                  <button
                    onClick={() => handleDeleteAccount(editingChannel, editingAccountData.id)}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🗑️ Xóa
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setAccountModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveAccount}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg,#002855,#2563EB)', color: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                >
                  💾 Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL QUÉT MÃ QR KẾT NỐI BOT ZALO ──────────────────────── */}
      {zaloQrModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 15, 38, 0.75)', backdropFilter: 'blur(5px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '2px solid #0068FF', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #002855, #0068FF)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-robot" style={{ fontSize: '20px', color: '#60A5FA' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>KẾT NỐI BOT ZALO TỰ ĐỘNG</h3>
                  <div style={{ fontSize: '11px', color: '#BFDBFE' }}>Tự động bắn tin vào nhóm Zalo 100% ngầm</div>
                </div>
              </div>
              <button
                onClick={() => setZaloQrModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              {/* QR Code Container */}
              <div style={{ width: '260px', height: '260px', borderRadius: '12px', border: '2px dashed #93C5FD', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {zaloQrImage ? (
                  <img src={zaloQrImage} alt="Zalo QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0068FF' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Đang sinh mã QR kết nối...</span>
                  </div>
                )}
              </div>

              {/* Status Message */}
              <div style={{ background: zaloQrStatus === 'success' ? '#ECFDF5' : (zaloQrStatus === 'scanned' ? '#FEF3C7' : '#EFF6FF'), border: `1px solid ${zaloQrStatus === 'success' ? '#A7F3D0' : (zaloQrStatus === 'scanned' ? '#FDE68A' : '#BFDBFE')}`, borderRadius: '8px', padding: '10px 14px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: zaloQrStatus === 'success' ? '#065F46' : (zaloQrStatus === 'scanned' ? '#92400E' : '#0369A1') }}>
                  {zaloQrMessage || 'Vui lòng mở app Zalo trên điện thoại để quét mã'}
                </div>
              </div>

              {/* Instructions */}
              <div style={{ textAlign: 'left', width: '100%', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#334155', lineHeight: '1.6' }}>
                <strong style={{ color: '#002855' }}>3 BƯỚC KÍCH HOẠT NHANH:</strong>
                <div style={{ marginTop: '4px' }}>1. Mở ứng dụng <strong>Zalo trên điện thoại</strong> (tài khoản đã tham gia nhóm Zalo).</div>
                <div>2. Chọn biểu tượng <strong>Quét mã QR</strong> ở góc trên bên phải Zalo.</div>
                <div>3. Quét mã QR này và chọn <strong>"Đăng nhập"</strong> trên điện thoại.</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', background: '#F1F5F9', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={startBotQrLogin}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0284C7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="fa-solid fa-arrows-rotate" /> Tạo lại mã
              </button>
              <button
                onClick={() => setZaloQrModalOpen(false)}
                style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: '#64748B', color: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


