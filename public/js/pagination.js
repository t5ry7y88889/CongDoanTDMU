/**
 * TDMUPagination - Powered by TOAST UI Pagination (nhn/tui.pagination v3.4.0)
 * Open-Source Library downloaded from official CDN: https://uicdn.toast.com/tui.pagination/
 * Enriched with:
 * - Real-time Record Count Info Summary ("Hiển thị 1 - 10 / 45 bài viết")
 * - PageSize Selector (5, 10, 20, 50 / trang)
 * - Array Slicing Helper (TDMUPagination.paginate)
 * - Custom TDMU Corporate Theme (Navy #002855, Gold #D4A017, Primary #0284C7)
 */

class TDMUPagination {
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    this.totalItems = Math.max(0, parseInt(options.totalItems) || 0);
    this.pageSize = Math.max(1, parseInt(options.pageSize) || 10);
    this.currentPage = Math.max(1, parseInt(options.currentPage) || 1);
    this.pageSizeOptions = options.pageSizeOptions || [5, 10, 20, 50];
    this.showInfo = options.showInfo !== false;
    this.showPageSizeSelector = options.showPageSizeSelector !== false;
    this.itemLabel = options.itemLabel || 'bản ghi';
    this.onPageChange = typeof options.onPageChange === 'function' ? options.onPageChange : () => {};

    this.instanceId = 'tdmu_pg_' + (++TDMUPagination._idCounter);
    TDMUPagination._instances[this.instanceId] = this;
    this.tuiPagination = null;

    this.ensureValidPage();
    if (this.container) {
      this.render();
    }
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  ensureValidPage() {
    const maxPage = this.totalPages;
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  setTotalItems(total, resetToFirst = false) {
    this.totalItems = Math.max(0, parseInt(total) || 0);
    if (resetToFirst) {
      this.currentPage = 1;
    } else {
      this.ensureValidPage();
    }
    this.render();
  }

  goToPage(page) {
    const targetPage = Math.max(1, Math.min(this.totalPages, parseInt(page) || 1));
    if (targetPage !== this.currentPage) {
      this.currentPage = targetPage;
      this.render();
      this.onPageChange(this.currentPage, this.pageSize);
    }
  }

  setPageSize(newSize) {
    const size = Math.max(1, parseInt(newSize) || 10);
    if (size !== this.pageSize) {
      this.pageSize = size;
      this.currentPage = 1;
      this.render();
      this.onPageChange(this.currentPage, this.pageSize);
    }
  }

  static paginate(array = [], page = 1, pageSize = 10) {
    const safeArray = Array.isArray(array) ? array : [];
    const totalItems = safeArray.length;
    const safePageSize = Math.max(1, parseInt(pageSize) || 10);
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const safePage = Math.max(1, Math.min(totalPages, parseInt(page) || 1));
    const startIndex = (safePage - 1) * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, totalItems);
    const pagedItems = safeArray.slice(startIndex, endIndex);

    return {
      pagedItems,
      totalItems,
      totalPages,
      currentPage: safePage,
      pageSize: safePageSize,
      startIndex: totalItems > 0 ? startIndex + 1 : 0,
      endIndex
    };
  }

  render() {
    if (!this.container) return;

    if (this.totalItems === 0) {
      this.container.innerHTML = `
        <div class="tdmu-pagination-wrapper empty">
          <div class="tdmu-pagination-info"><i class="fa-solid fa-circle-info me-1 text-muted"></i> Không có ${this.itemLabel} nào để hiển thị</div>
        </div>
      `;
      this.tuiPagination = null;
      return;
    }

    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(startItem + this.pageSize - 1, this.totalItems);
    const controlsId = `tui_ctrl_${this.instanceId}`;

    let html = `<div class="tdmu-pagination-wrapper">`;

    // 1. Info and PageSize Selector on Left
    html += `<div class="tdmu-pagination-left">`;
    if (this.showInfo) {
      html += `
        <div class="tdmu-pagination-info">
          Hiển thị <strong>${startItem} - ${endItem}</strong> trên tổng số <strong>${this.totalItems}</strong> ${this.itemLabel}
        </div>
      `;
    }
    if (this.showPageSizeSelector && this.pageSizeOptions && this.pageSizeOptions.length > 0) {
      html += `
        <div class="tdmu-pagination-size-wrap">
          <label class="tdmu-size-label">Hiển thị:</label>
          <select class="tdmu-page-size-select" onchange="TDMUPagination._instances['${this.instanceId}'].setPageSize(this.value)">
            ${this.pageSizeOptions.map(opt => `
              <option value="${opt}" ${opt === this.pageSize ? 'selected' : ''}>${opt} / trang</option>
            `).join('')}
          </select>
        </div>
      `;
    }
    html += `</div>`;

    // 2. Navigation controls on Right (mounted by TOAST UI Pagination or Native fallback)
    html += `<div class="tdmu-pagination-controls tui-pagination" id="${controlsId}"></div>`;
    html += `</div>`;

    this.container.innerHTML = html;

    const ctrlEl = document.getElementById(controlsId);
    if (!ctrlEl) return;

    // Use official TOAST UI Pagination if available
    if (window.tui && window.tui.Pagination) {
      try {
        this.tuiPagination = new tui.Pagination(ctrlEl, {
          totalItems: this.totalItems,
          itemsPerPage: this.pageSize,
          visiblePages: 5,
          page: this.currentPage,
          centerAlign: false,
          template: {
            page: '<a href="javascript:void(0)" class="tui-page-btn tdmu-page-btn">{{page}}</a>',
            currentPage: '<strong class="tui-page-btn tdmu-page-btn active tui-is-selected">{{page}}</strong>',
            moveButton: function(type) {
              const t = type.type;
              const icons = {
                first: '<i class="fa-solid fa-angles-left"></i>',
                prev: '<i class="fa-solid fa-angle-left"></i>',
                next: '<i class="fa-solid fa-angle-right"></i>',
                last: '<i class="fa-solid fa-angles-right"></i>'
              };
              const titles = {
                first: 'Trang đầu',
                prev: 'Trang trước',
                next: 'Trang sau',
                last: 'Trang cuối'
              };
              return '<a href="javascript:void(0)" class="tui-page-btn tdmu-page-btn tui-' + t + '" title="' + (titles[t] || '') + '">' + (icons[t] || '') + '</a>';
            },
            disabledMoveButton: function(type) {
              const t = type.type;
              const icons = {
                first: '<i class="fa-solid fa-angles-left"></i>',
                prev: '<i class="fa-solid fa-angle-left"></i>',
                next: '<i class="fa-solid fa-angle-right"></i>',
                last: '<i class="fa-solid fa-angles-right"></i>'
              };
              return '<span class="tui-page-btn tdmu-page-btn disabled tui-is-disabled tui-' + t + '">' + (icons[t] || '') + '</span>';
            },
            moreButton:
              '<span class="tui-page-btn tdmu-page-btn tdmu-page-ellipsis tui-{{type}}-is-ellip"><i class="fa-solid fa-ellipsis"></i></span>'
          }
        });

        this.tuiPagination.on('afterMove', (ev) => {
          if (ev && ev.page && ev.page !== this.currentPage) {
            this.currentPage = ev.page;
            this.updateInfoText();
            this.onPageChange(this.currentPage, this.pageSize);
          }
        });
        return;
      } catch (e) {
        console.warn('Fallback to native controls:', e);
      }
    }

    // Fallback if TUI is not yet loaded
    this.renderFallbackControls(ctrlEl);
  }

  updateInfoText() {
    const infoEl = this.container.querySelector('.tdmu-pagination-info');
    if (!infoEl) return;
    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(startItem + this.pageSize - 1, this.totalItems);
    infoEl.innerHTML = `Hiển thị <strong>${startItem} - ${endItem}</strong> trên tổng số <strong>${this.totalItems}</strong> ${this.itemLabel}`;
  }

  renderFallbackControls(ctrlEl) {
    const totalPages = this.totalPages;
    const isFirst = this.currentPage <= 1;
    const isLast = this.currentPage >= totalPages;

    let h = '';
    h += `<button type="button" class="tdmu-page-btn ${isFirst ? 'disabled' : ''}" ${isFirst ? 'disabled' : ''} onclick="TDMUPagination._instances['${this.instanceId}'].goToPage(1)" title="Trang đầu"><i class="fa-solid fa-angles-left"></i></button>`;
    h += `<button type="button" class="tdmu-page-btn ${isFirst ? 'disabled' : ''}" ${isFirst ? 'disabled' : ''} onclick="TDMUPagination._instances['${this.instanceId}'].goToPage(${this.currentPage - 1})" title="Trang trước"><i class="fa-solid fa-angle-left"></i></button>`;

    const pages = this.calculatePageNumbers(totalPages, this.currentPage);
    for (const p of pages) {
      if (p === '...') {
        h += `<span class="tdmu-page-ellipsis">…</span>`;
      } else {
        const isActive = p === this.currentPage;
        h += `<button type="button" class="tdmu-page-btn ${isActive ? 'active' : ''}" onclick="TDMUPagination._instances['${this.instanceId}'].goToPage(${p})">${p}</button>`;
      }
    }

    h += `<button type="button" class="tdmu-page-btn ${isLast ? 'disabled' : ''}" ${isLast ? 'disabled' : ''} onclick="TDMUPagination._instances['${this.instanceId}'].goToPage(${this.currentPage + 1})" title="Trang tiếp"><i class="fa-solid fa-angle-right"></i></button>`;
    h += `<button type="button" class="tdmu-page-btn ${isLast ? 'disabled' : ''}" ${isLast ? 'disabled' : ''} onclick="TDMUPagination._instances['${this.instanceId}'].goToPage(${totalPages})" title="Trang cuối"><i class="fa-solid fa-angles-right"></i></button>`;
    ctrlEl.innerHTML = h;
  }

  calculatePageNumbers(totalPages, current) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (current >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
    }
    return pages;
  }
}

TDMUPagination._instances = {};
TDMUPagination._idCounter = 0;

window.TDMUPagination = TDMUPagination;
