import React from 'react';
import { navSections } from './hangSoAdmin';

export default function AdminSidebar({
  sidebarCollapsed,
  sidebarHovered,
  setSidebarHovered,
  activeNav,
  handleNavClick
}) {
  return (
    <aside
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
      style={{
        width: sidebarCollapsed ? (sidebarHovered ? '240px' : '64px') : '240px',
        background: 'linear-gradient(180deg,#002855 0%,#001A38 100%)',
        color: '#FFF',
        transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0,40,85,0.15)',
        zIndex: 100,
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      <div style={{ height: '54px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <img
          src="/images/logo_cong_doan.png"
          alt="Logo"
          style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
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
              <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '10px 8px 4px 8px' }}>
                {sec.label}
              </div>
            )}
            {sec.items.map(item => {
              const collapsed = sidebarCollapsed && !sidebarHovered;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
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
        {(!sidebarCollapsed || sidebarHovered) && <span>Phiên bản v2.5 Chính Thức</span>}
        <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', fontSize: '9px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px' }}>TRỰC TUYẾN</span>
      </div>
    </aside>
  );
}
