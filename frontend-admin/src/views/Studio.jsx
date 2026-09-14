import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

const STORAGE_KEY = 'congdoan_studio_v3'

function loadDraft() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null }
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
    wordsSaved: 0
  }
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

export default function Studio({ notify }) {
  const saved = loadDraft()
  const [state, setState] = useState({ ...defaultState(), ...saved })
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeChannel, setActiveChannel] = useState('body')
  const [saveStatus, setSaveStatus] = useState(saved ? 'Đã khôi phục bản nháp' : 'Chưa có bản lưu')

  const ct = counters(state)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, status: 'draft' }))
        setSaveStatus('Đã lưu tự động')
      } catch { /* noop */ }
    }, 800)
    return () => clearTimeout(timer)
  }, [state])

  const setField = useCallback((k, v) => setState((s) => ({ ...s, [k]: v })), [])
  const setChannel = useCallback((ch, v) => setState((s) => ({ ...s, channelContent: { ...s.channelContent, [ch]: v } })), [])

  const handleGenerate = async () => {
    const headline = (state.title || '').trim()
    const keywords = (state.keyword || '').trim()
    if (!headline && !keywords) { notify('warn', 'Nhập chủ đề hoặc tiêu đề để AI tạo bản thảo'); return }
    setGenerating(true)
    try {
      const prompt = `Viết bài truyền thông Công đoàn TDMU. ${headline ? `Tiêu đề dự kiến: ${headline}.` : ''} ${keywords ? `Chủ đề/từ khóa: ${keywords}.` : ''}`
      const res = await api.aiGenerate({
        prompt, category: '', tone: state.tone, lengthOption: state.length, targetAudience: 'cán bộ, giảng viên, đoàn viên'
      })
      const text = res.text || res.content || res.data?.text || res.data?.content || JSON.stringify(res)
      const lines = text.split(/\r?\n/)
      let title = state.title
      let lead = ''
      let body = ''
      if (lines.length > 0 && lines[0].toLowerCase().startsWith('tiêu đề:')) {
        title = lines[0].replace(/tiêu đề:\s*/i, '').trim() || title
        lead = lines.slice(1, 3).join('\n').trim()
        body = lines.slice(3).join('\n').trim()
      } else {
        lead = lines.slice(0, 2).join('\n').trim()
        body = lines.slice(2).join('\n').trim()
      }
      setState((s) => ({ ...s, title: title || s.title, lead: lead || s.lead, body: body || s.body }))
      setSaveStatus('Đã tạo bằng AI — chỉnh sửa trước khi lưu')
      notify('success', 'AI đã tạo bản thảo — xem trước chỉnh sửa!')
    } catch (e) { notify('error', e.message) } finally { setGenerating(false) }
  }

  const handlePublish = async () => {
    if (!state.title.trim()) { notify('warn', 'Nhập tiêu đề'); return }
    setSaving(true)
    try {
      await api.createArticle({
        title: state.title, author: 'AI Copilot', summary: state.lead,
        content: state.body || state.channelContent.facebook || '', status: 'draft', categoryId: ''
      })
      notify('success', 'Đã lưu bản nháp vào hệ thống!')
      setSaveStatus('Đã xuất bản nháp')
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleReset = () => {
    if (!window.confirm('Xóa nội dung hiện tại?')) return
    setState(defaultState())
    localStorage.removeItem(STORAGE_KEY)
    setSaveStatus('Đã xóa')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-info" style={{ fontSize: 13, padding: '7px 14px' }}>
                  <i className="fa-solid fa-feather me-2" style={{ fontSize: 15 }}></i>Editor trực quan
                </span>
                <span className="badge badge-gold"><span className="stat-dot dot-green"></span>{saveStatus}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={handleReset}><i className="fa-solid fa-rotate-left me-1"></i>Xóa</button>
                <button className="btn btn-sm btn-navy" onClick={handlePublish} disabled={saving}>
                  <i className="fa-solid fa-bookmark me-1"></i>{saving ? 'Đang lưu…' : 'Lưu vào bài viết'}
                </button>
              </div>
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
          </div>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
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

        {activeChannel === 'body' && (
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

        {activeChannel === 'facebook' && (
          <ChannelCanvas
            label="Facebook"
            value={state.channelContent.facebook}
            onChange={(v) => setChannel('facebook', v)}
            counter={(state.channelContent.facebook || '').length}
          />
        )}

        {activeChannel === 'zalo' && (
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
                <option value="openai">OpenAI</option>
              </select>
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
    </div>
  )
}

const kbd = {
  display: 'inline-block', padding: '2px 6px', background: '#F1F5F9', border: '1px solid #E2E8F0',
  borderRadius: 4, fontSize: 11, fontFamily: 'monospace'
}