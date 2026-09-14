import React, { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api.js'

const STORAGE_KEY = 'congdoan_studio_v3'
const SETTINGS_KEY = 'congdoan_admin_settings_v3'

const PROVIDERS = ['gemini', 'openai', 'anthropic', 'custom']
const PROVIDER_LABELS = { gemini: 'Google Gemini', openai: 'ChatGPT (OpenAI)', anthropic: 'Claude (Anthropic)', custom: 'Custom AI' }

function loadDraft() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function defaultState() {
  return {
    title: '',
    lead: '',
    body: '',
    channelContent: { facebook: '', zalo: '' },
    keyword: '',
    status: 'draft',
    provider: 'gemini',
    tone: 'chính luận',
    length: 'medium',
    wordsSaved: 0,
    material: '',
    materialFileName: '',
    articleId: null
  }
}

function safeHtml(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

function counters(state) {
  const titleCount = (state.title || '').length
  const leadCount = (state.lead || '').length
  const bodyCount = (state.body || '').length
  return { titleCount, leadCount, bodyCount }
}

function ChannelCanvas({ label, value, onChange, counter, counterMax = 500, counterWarn = 300 }) {
  return (
    <div className="studio-pane">
      <div className="pane-head">
        <span className="pane-title">{label}</span>
        <span className="badge" style={{ background: counter > counterWarn ? '#FEF3C7' : '#DCFCE7', color: counter > counterWarn ? '#92600A' : '#166534' }}>
          {counter}/{counterMax}
        </span>
      </div>
      <div className="pane-body">
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Nội dung ${label}…`}
          style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
    </div>
  )
}

function PreviewPane({ activeChannel, state }) {
  const dateStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  if (activeChannel === 'facebook') {
    return (
      <div className="preview-fb">
        <div className="pfb-head">
          <div className="pfb-ava"><img src="/images/logo_cong_doan.png" alt="" /></div>
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#050505' }}>Công Đoàn TDMU</div>
            <div style={{ fontSize: 12, color: '#65676B' }}>{dateStr}</div>
          </div>
        </div>
        <div className="pfb-body" style={{ whiteSpace: 'pre-wrap' }}>{state.channelContent.facebook || state.lead || 'Nội dung Facebook…'}</div>
        <div style={{ borderTop: '1px solid #E4E6EB', fontSize: 12, color: '#65676B', padding: '8px 14px', display: 'flex', gap: 18 }}>
          <span><i className="fa-regular fa-thumbs-up me-1"></i>Thích</span>
          <span><i className="fa-regular fa-comment me-1"></i>Bình luận</span>
          <span><i className="fa-regular fa-share-from-square me-1"></i>Chia sẻ</span>
        </div>
      </div>
    )
  }

  if (activeChannel === 'zalo') {
    return (
      <div className="preview-zalo">
        <div className="pz-head">
          <div className="pz-ava"><img src="/images/logo_cong_doan.png" alt="" /></div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>Zalo OA — Công Đoàn TDMU</div>
        </div>
        <div className="pz-body" style={{ whiteSpace: 'pre-wrap' }}>{state.channelContent.zalo || state.lead || 'Nội dung Zalo…'}</div>
      </div>
    )
  }

  return (
    <div className="preview-article">
      <div className="pv-top">
        <img src="/images/logo_cong_doan.png" alt="" />
        <span>CỔNG THÔNG TIN CÔNG ĐOÀN TDMU</span>
      </div>
      <div className="pv-body">
        <h1>{state.title || 'Tiêu đề bài viết sẽ hiển thị tại đây'}</h1>
        {state.lead && <p className="pv-lead">{state.lead}</p>}
        <div className="pv-meta">
          <span><i className="fa-regular fa-calendar me-1"></i>{dateStr}</span>
          <span><i className="fa-regular fa-user me-1"></i>Biên Tập Viên</span>
          <span><i className="fa-solid fa-wand-magic-sparkles me-1"></i>AI Copilot</span>
        </div>
        {state.body
          ? <div className="pv-content" dangerouslySetInnerHTML={{ __html: safeHtml(state.body) }} />
          : <p style={{ color: '#94A3B8' }}>Nội dung bài viết chưa có — bấm "Tạo bản thảo" để soạn nhanh.</p>}
      </div>
    </div>
  )
}

export default function Studio({ notify }) {
  const saved = loadDraft()
  const settings = loadSettings()
  const [state, setState] = useState(() => {
    const merged = { ...defaultState(), ...saved }
    if (!PROVIDERS.includes(merged.provider)) merged.provider = settings.aiProvider || 'gemini'
    return merged
  })
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeChannel, setActiveChannel] = useState('body')
  const [view, setView] = useState('edit')
  const [saveStatus, setSaveStatus] = useState(saved ? 'Đã khôi phục bản nháp' : 'Chưa có bản lưu')
  const [publishTargets, setPublishTargets] = useState({ website: true, facebook: false, zalo: false })
  const [publishing, setPublishing] = useState(false)
  const [lastPublishedUrl, setLastPublishedUrl] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ channel: 'web', scheduledAt: '', facebook: '', zalo: '' })
  const fileRef = useRef(null)

  const ct = counters(state)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, status: 'draft' }))
        setSaveStatus((s) => (s.startsWith('Đã lưu') || s === 'Đã khôi phục bản nháp') ? s : 'Đã lưu tự động')
      } catch { /* noop */ }
    }, 800)
    return () => clearTimeout(timer)
  }, [state])

  const setField = useCallback((k, v) => setState((s) => ({ ...s, [k]: v })), [])
  const setChannel = useCallback((ch, v) => setState((s) => ({ ...s, channelContent: { ...s.channelContent, [ch]: v } })), [])

  const ensureArticle = async () => {
    if (state.articleId) return state.articleId
    const title = (state.title || 'Bài viết thông tin Công đoàn TDMU').trim()
    const res = await api.createArticle({
      title,
      author: 'Biên Tập Viên',
      summary: state.lead || title,
      content: state.body || state.channelContent.facebook || title,
      categoryId: 1,
      categoryName: 'Thông Báo Chỉ Đạo',
      status: 'draft',
      isAiGenerated: true
    })
    const id = res?.data?.id
    if (!id) throw new Error('Không lấy được mã bài viết khi lưu')
    setField('articleId', id)
    return id
  }

  const handleGenerate = async () => {
    const headline = (state.title || '').trim()
    const keywords = (state.keyword || '').trim()
    const material = (state.material || '').trim()
    if (!headline && !keywords && !material) { notify('warn', 'Nhập chủ đề/tiêu đề hoặc upload tư liệu để AI tạo bản thảo'); return }
    setGenerating(true)
    try {
      const provider = state.provider || 'gemini'
      const useGearKey = (settings.aiProvider || 'gemini') === provider
      const prompt = `Viết bài truyền thông Công đoàn TDMU. ${headline ? `Tiêu đề dự kiến: ${headline}.` : ''} ${keywords ? `Chủ đề/từ khóa: ${keywords}.` : ''}`
      const res = await api.aiGenerate({
        prompt,
        category: '',
        tone: state.tone,
        lengthOption: state.length,
        targetAudience: 'cán bộ, giảng viên, đoàn viên',
        provider,
        model: useGearKey ? settings.aiModel || '' : '',
        apiKey: useGearKey ? settings.aiApiKey || '' : '',
        endpoint: settings.aiEndpoint || '',
        material
      })
      const html = (res.content || '').trim()
      const aiTitle = Array.isArray(res.titles) && res.titles.length ? res.titles[0] : (res.title || '')
      const lead = (res.summary || res.subTitle || '').trim()
      let body = html || String(res.text || res.body || '')
      setState((s) => ({
        ...s,
        title: (s.title || '').trim() || aiTitle,
        lead: lead || s.lead,
        body: body || s.body
      }))
      setSaveStatus('Đã tạo bằng AI — xem trước & chỉnh sửa')
      notify('success', `AI đã tạo bản thảo (${res.source || PROVIDER_LABELS[provider] || 'AI'}) — mở tab Xem trước!`)
    } catch (e) { notify('error', e.message) } finally { setGenerating(false) }
  }

  const handleSaveDraft = async () => {
    if (!state.title.trim() && !state.body.trim()) { notify('warn', 'Nhập tiêu đề hoặc nội dung trước khi lưu'); return }
    setSaving(true)
    try {
      const existingId = state.articleId
      const articleId = await ensureArticle()
      if (existingId) {
        await api.updateArticle(articleId, {
          title: state.title.trim(),
          summary: state.lead,
          content: state.body || state.channelContent.facebook || '',
          status: 'draft'
        })
      }
      notify('success', `Đã lưu nháp #${articleId} vào hệ thống`)
      setSaveStatus(`Nháp #${articleId}`)
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handlePublishNow = async () => {
    const targets = Object.entries(publishTargets).filter(([, on]) => on)
    if (!targets.length) { notify('warn', 'Chọn ít nhất một kênh xuất bản'); return }
    if (!state.title.trim()) { notify('warn', 'Nhập tiêu đề trước khi xuất bản'); return }
    setPublishing(true)
    try {
      const existingId = state.articleId
      const articleId = await ensureArticle()
      if (existingId) {
        await api.updateArticle(articleId, {
          title: state.title.trim(),
          summary: state.lead,
          content: state.body || state.channelContent.facebook || '',
          status: 'draft'
        })
      }
      const results = []
      let webUrl = ''
      for (const [key, on] of Object.entries(publishTargets)) {
        if (!on) continue
        const channel = key === 'website' ? 'web' : key
        const content = channel === 'web' ? state.body : (state.channelContent[channel] || state.lead)
        const r = await api.publishNow({ articleId, channel, content })
        if (channel === 'web' && r?.data?.url) webUrl = r.data.url
        if (r?.message) results.push(r.message)
      }
      if (webUrl) setLastPublishedUrl(webUrl)
      setSaveStatus(`Đã xuất bản bài #${articleId}`)
      notify('success', results.join(' — ') || `Đã xuất bản bài #${articleId}`)
    } catch (e) { notify('error', e.message) } finally { setPublishing(false) }
  }

  const submitSchedule = async (e) => {
    e.preventDefault()
    if (!scheduleForm.scheduledAt) { notify('error', 'Chọn thời gian hẹn xuất bản'); return }
    setSaving(true)
    try {
      const articleId = await ensureArticle()
      await api.createSchedule({
        articleId,
        channel: scheduleForm.channel,
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        title: state.title.trim(),
        content: state.body || state.channelContent.facebook || '',
        facebook: { message: scheduleForm.facebook || state.channelContent.facebook || state.lead },
        zalo: { message: scheduleForm.zalo || state.channelContent.zalo || state.lead }
      })
      notify('success', 'Đã hẹn lịch xuất bản đa kênh')
      setScheduleOpen(false)
      setSaveStatus(`Đã hẹn lịch bài #${articleId}`)
    } catch (err) { notify('error', err.message) } finally { setSaving(false) }
  }

  const handleReset = () => {
    if (!window.confirm('Xóa nội dung hiện tại?')) return
    setState(defaultState())
    localStorage.removeItem(STORAGE_KEY)
    setLastPublishedUrl('')
    setSaveStatus('Đã xóa')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext)) {
      notify('warn', 'Chỉ chấp nhận file .txt, .md, .docx hoặc .pdf'); return
    }
    setUploading(true)
    try {
      if (ext === 'docx') {
        const reader = new FileReader()
        const b64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
        const docResult = await api.parseDocx({ fileBase64: b64, fileName: file.name })
        const docText = docResult.text || docResult.html || ''
        if (!docText.trim()) { notify('warn', 'File không có nội dung văn bản'); setUploading(false); return }
        setState((s) => ({ ...s, material: docText, materialFileName: file.name }))
        notify('success', `Đã trích xuất ${docText.length.toLocaleString()} ký tự từ ${file.name}`)
      } else {
        const text = await file.text()
        setState((s) => ({ ...s, material: text, materialFileName: file.name }))
        notify('success', `Đã tải ${text.length.toLocaleString()} ký tự từ ${file.name}`)
      }
    } catch (err) {
      notify('error', `Lỗi đọc file: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const gearKey = settings.aiApiKey || ''
  const gearProvider = settings.aiProvider || 'gemini'
  const keyHint = gearKey
    ? (gearProvider === state.provider
      ? { cls: 'ok', icon: 'fa-circle-check', msg: `Đang dùng API key trong ⚙️ cho ${PROVIDER_LABELS[state.provider] || state.provider}${settings.aiModel ? ` · ${settings.aiModel}` : ''}` }
      : { cls: 'warn', icon: 'fa-triangle-exclamation', msg: `Key trong ⚙️ thuộc ${PROVIDER_LABELS[gearProvider] || gearProvider} — đổi provider sang kênh đó để dùng key, hoặc thêm key tương ứng vào ⚙️` })
    : { cls: 'warn', icon: 'fa-circle-exclamation', msg: 'Chưa có key trong ⚙️ — server sẽ thử key từ .env (thêm xong phải khởi động lại server).' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-info" style={{ fontSize: 13, padding: '7px 14px' }}>
                  <i className="fa-solid fa-feather me-2" style={{ fontSize: 15 }}></i>Editor trực quan
                </span>
                <span className="badge badge-gold"><span className="stat-dot dot-green"></span>{saveStatus}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm btn-outline" onClick={handleReset}><i className="fa-solid fa-rotate-left me-1"></i>Xóa</button>
                <button className="btn btn-sm btn-outline" onClick={handleSaveDraft} disabled={saving}>
                  <i className="fa-solid fa-floppy-disk me-1"></i>{saving ? 'Đang lưu…' : 'Lưu nháp'}
                </button>
                <button className="btn btn-sm btn-navy" onClick={() => { setScheduleForm({ channel: 'web', scheduledAt: '', facebook: state.channelContent.facebook, zalo: state.channelContent.zalo }); setScheduleOpen(true) }}>
                  <i className="fa-regular fa-clock me-1"></i>Hẹn giờ
                </button>
                <button className="btn btn-sm btn-gold" onClick={handlePublishNow} disabled={publishing || !Object.values(publishTargets).some(Boolean)}>
                  <i className={`fa-solid ${publishing ? 'fa-spinner fa-spin' : 'fa-rocket'} me-1`}></i>{publishing ? 'Đang xuất bản…' : 'Xuất bản ngay'}
                </button>
              </div>
            </div>

            <div className="publish-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kênh xuất bản:</span>
                {[
                  { id: 'website', label: 'Website', icon: 'fa-globe' },
                  { id: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook' },
                  { id: 'zalo', label: 'Zalo', icon: 'fa-solid fa-comment-dots' }
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    className={`publish-pill ${publishTargets[ch.id] ? 'on' : ''} ${ch.id === 'website' ? 'locked' : ''}`}
                    onClick={() => setPublishTargets((t) => ({ ...t, [ch.id]: ch.id === 'website' ? true : !t[ch.id] }))}
                    style={{ border: 'none', cursor: ch.id !== 'website' ? 'pointer' : 'default' }}
                  >
                    <i className={ch.icon}></i>{ch.label}
                  </button>
                ))}
              </div>
              {lastPublishedUrl ? (
                <a className="publish-link" href={`${window.location.origin}${lastPublishedUrl}`} target="_blank" rel="noreferrer">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>Mở bài trên website
                </a>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Mặc định chỉ lên Website; bật thêm FB/Zalo nếu cần.</span>
              )}
            </div>

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 700 }}>Headline / tiêu đề</label>
              <input
                value={state.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Tiêu đề bài viết chuẩn SEO"
                style={{ fontSize: 14.5, padding: '11px 14px' }}
              />
            </div>

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 700 }}>Lead / Sapo</label>
              <textarea
                rows={3}
                value={state.lead}
                onChange={(e) => setField('lead', e.target.value)}
                placeholder="Mở bài tóm tắt vấn đề"
              />
            </div>

            <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: 12, padding: '14px 16px', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF3C7', color: '#92600A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    <i className="fa-solid fa-file-import"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Nạp tư liệu nguồn</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      {state.materialFileName
                        ? <span><i className="fa-solid fa-file-lines me-1" style={{ color: '#0284C7' }}></i>{state.materialFileName} — {(state.material || '').length.toLocaleString()} ký tự <button type="button" className="btn btn-sm btn-outline" style={{ marginLeft: 8 }} onClick={() => setState((s) => ({ ...s, material: '', materialFileName: '' }))}><i className="fa-solid fa-xmark me-1"></i>Gỡ</button></span>
                        : 'Upload văn bản (.txt, .doc/.docx, .pdf, .md) để AI dựa vào đó viết bài.'}
                    </div>
                  </div>
                </div>
                <label className="btn btn-sm btn-navy" style={{ cursor: 'pointer', margin: 0 }}>
                  <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} me-1`}></i>
                  {uploading ? 'Đang xử lý…' : 'Chọn file'}
                  <input ref={fileRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: 0 }}>
            {[
              { id: 'body', label: 'Nội dung chính', icon: 'fa-file-lines' },
              { id: 'facebook', label: 'Nội dung Facebook', icon: 'fa-facebook' },
              { id: 'zalo', label: 'Nội dung Zalo', icon: 'fa-comment-dots' }
            ].map((ch) => (
              <button key={ch.id} className={`btn btn-sm ${activeChannel === ch.id ? 'btn-navy' : 'btn-outline'}`} onClick={() => setActiveChannel(ch.id)}>
                <i className={`fa-brands ${ch.icon}`}></i>{ch.label}
              </button>
            ))}
          </div>
          <div className="seg-view" role="tablist" aria-label="Chế độ xem">
            <button type="button" className={view === 'edit' ? 'on' : ''} onClick={() => setView('edit')}><i className="fa-solid fa-pen me-1" style={{ fontSize: 11 }}></i>Biên tập</button>
            <button type="button" className={view === 'preview' ? 'on' : ''} onClick={() => setView('preview')}><i className="fa-solid fa-eye me-1" style={{ fontSize: 11 }}></i>Xem trước</button>
          </div>
        </div>

        {view === 'preview' && (
          <div className="preview-scroll">
            <PreviewPane activeChannel={activeChannel} state={state} />
          </div>
        )}

        {view === 'edit' && activeChannel === 'body' && (
          <div className="studio-pane">
            <div className="pane-head">
              <span className="pane-title">Nội dung chính (Body)</span>
              <span className="badge" style={{ background: ct.bodyCount > 3000 ? '#FEE2E2' : '#DCFCE7', color: ct.bodyCount > 3000 ? '#991B1B' : '#166534' }}>
                {ct.bodyCount} ký tự
              </span>
            </div>
            <div className="pane-body">
              <textarea
                rows={18}
                value={state.body}
                onChange={(e) => setField('body', e.target.value)}
                placeholder="Nội dung bài viết chi tiết…"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>
          </div>
        )}

        {view === 'edit' && activeChannel === 'facebook' && (
          <ChannelCanvas
            label="Facebook"
            value={state.channelContent.facebook}
            onChange={(v) => setChannel('facebook', v)}
            counter={(state.channelContent.facebook || '').length}
          />
        )}

        {view === 'edit' && activeChannel === 'zalo' && (
          <ChannelCanvas
            label="Zalo"
            value={state.channelContent.zalo}
            onChange={(v) => setChannel('zalo', v)}
            counter={(state.channelContent.zalo || '').length}
            counterMax={1000}
          />
        )}
      </div>

      <div>
        <div className="card" style={{ position: 'sticky', top: 90 }}>
          <div className="card-head"><h2><i className="fa-solid fa-wand-magic-sparkles me-2" style={{ color: '#7C3AED' }}></i>AI Copilot</h2></div>
          <div className="card-body">
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Chủ đề / từ khóa</label>
              <input value={state.keyword} onChange={(e) => setField('keyword', e.target.value)} placeholder="VD: Hưởng ứng đại hội XII Công đoàn" />
            </div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Phong cách</label>
              <select value={state.tone} onChange={(e) => setField('tone', e.target.value)}>
                {['chính luận', 'gần gũi', 'phỏng vấn', 'thuyết minh'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Độ dài</label>
              <select value={state.length} onChange={(e) => setField('length', e.target.value)}>
                <option value="short">Ngắn</option>
                <option value="medium">Trung bình</option>
                <option value="long">Dài</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Nhà cung cấp AI</label>
              <select value={state.provider} onChange={(e) => setField('provider', e.target.value)}>
                <option value="gemini">Google Gemini</option>
                <option value="openai">ChatGPT (OpenAI)</option>
                <option value="anthropic">Claude (Anthropic)</option>
                <option value="custom">Custom AI Model</option>
              </select>
              <div className={`ai-hint ${keyHint.cls}`}>
                <i className={`fa-solid ${keyHint.icon} me-1`}></i>{keyHint.msg}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                <i className="fa-solid fa-circle-info me-1"></i>Key thường thêm tại ⚙️ trên thanh trên cùng (mở, nhập, Lưu cấu hình).
              </div>
            </div>
            <button className="btn btn-gold btn-lg" onClick={handleGenerate} disabled={generating} style={{ width: '100%' }}>
              <i className="fa-solid fa-sparkles me-1"></i>{generating ? 'Đang tạo…' : 'Tạo bản thảo'}
            </button>
            <div style={{ marginTop: 14, fontSize: 12, color: '#64748B' }}>
              <p style={{ marginBottom: 6 }}><strong>Phím tắt:</strong></p>
              <p>• <kbd style={kbd}>Ctrl</kbd>+<kbd style={kbd}>B</kbd> in đậm</p>
              <p>• <kbd style={kbd}>Ctrl</kbd>+<kbd style={kbd}>I</kbd> in nghiêng</p>
            </div>
          </div>
        </div>
      </div>

      {scheduleOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setScheduleOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3><i className="fa-solid fa-calendar-plus me-2" style={{ color: '#7C3AED' }}></i>Hẹn Giờ Xuất Bản</h3>
              <button className="modal-close" onClick={() => setScheduleOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form className="modal-body" onSubmit={submitSchedule}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Kênh phân phối (*)</label>
                  <select value={scheduleForm.channel} onChange={(e) => setScheduleForm((f) => ({ ...f, channel: e.target.value }))}>
                    <option value="web">Website</option>
                    <option value="facebook">Facebook</option>
                    <option value="zalo">Zalo OA</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Thời gian hẹn (*)</label>
                  <input type="datetime-local" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                {(scheduleForm.channel === 'facebook' || scheduleForm.channel === 'zalo') && (
                  <div className="form-field full">
                    <label>Nội dung {scheduleForm.channel === 'facebook' ? 'Facebook' : 'Zalo'}</label>
                    <textarea
                      rows={3}
                      value={scheduleForm.channel === 'facebook' ? scheduleForm.facebook : scheduleForm.zalo}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, [scheduleForm.channel]: e.target.value }))}
                      placeholder="Bỏ trống để dùng nội dung đang soạn"
                    />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setScheduleOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-navy" disabled={saving}>
                  <i className="fa-solid fa-clock me-1"></i>{saving ? 'Đang đặt…' : 'Hẹn lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const kbd = {
  display: 'inline-block', padding: '2px 6px', background: '#F1F5F9', border: '1px solid #E2E8F0',
  borderRadius: 4, fontSize: 11, fontFamily: 'monospace'
}