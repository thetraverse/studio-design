/* ============================================================
   <tv-modal-card>  —  Traverse component library
   The atom of interaction. A focused action on a single object.
   Header (subject + marker) and footer (destructive-left / primary-right)
   are fixed; only the body (slotted) varies.

   Single source of truth: edit THIS file and every modal updates.

   Usage:
     <tv-modal-card id="grade" heading="Criterion 3 · Risk assessment"
        marker-kind="ai" marker-label="AI graded"
        danger-label="Revert to AI" primary-label="Save adjustment">
       …body markup (forms, excerpt, justification)…
     </tv-modal-card>
     <script>
       const m = document.getElementById('grade')
       openTrigger.addEventListener('click', () => m.open())
       m.addEventListener('tv-confirm', () => { ...persist... })
       m.addEventListener('tv-danger',  () => { ...revert... })
       m.confirmDisabled = true        // gate the primary until valid
     </script>

   Attributes:
     open            present while shown (managed by open()/close())
     size            sm | md | lg                    (default md)
     heading         title text
     subtitle        small uppercase context line
     icon            header icon name (default 'pencil')
     marker-kind     ai | adjusted | flag | auto …   (renders <tv-status-tag>)
     marker-label    marker text
     primary-label   shows the primary button when set
     primary-variant primary | danger  — set 'danger' when the confirm action
                     itself is destructive (cancel / delete / remove): the
                     primary button keeps its right-hand position but renders red
     danger-label    secondary destructive button (left) alongside a non-destructive primary
     cancel-label    secondary (dismiss) button text        (default 'Cancel')
                     Set it explicitly to get a footer with no primary beside it.
     cancel-closes   'false' keeps the card open when the secondary is pressed —
                     for a secondary that is an action, not a dismissal
                     (Ignore, View all). ✕ / Esc / scrim still close. Default: closes.
     footer-hint     optional bottom-left footer text (form modals: validation / guidance)

   Slots:
     (default)       the card body
     footer-start    optional controls pinned to the FOOTER's left edge, before
                     the hint. For stepping through a set the card is working
                     across (‹ 3 of 12 ›) — navigation *within* the card, not a
                     commit. Anything that commits stays a footer button on the
                     right. Omit it and the footer is unchanged.
     dismissible     allow close button / esc / overlay (default true)
     confirm-disabled  disable the primary button
     guard           if present, prompt before closing when .dirty is true

   Events (bubble, composed):  tv-open, tv-confirm, tv-cancel, tv-danger, tv-close
   Methods:  open(), close({force})
   Property: confirmDisabled (bool), dirty (bool)
   ============================================================ */
(() => {
  if (customElements.get('tv-modal-card')) return

  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

  class TvModalCard extends HTMLElement {
    static get observedAttributes() {
      return ['heading', 'subtitle', 'icon', 'marker-kind', 'marker-label', 'primary-label', 'primary-variant', 'danger-label', 'cancel-label', 'footer-hint', 'size', 'confirm-disabled', 'dismissible']
    }

    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
      this._lastFocus = null
      this._prevOverflow = ''
      this.dirty = false
      this._onKey = this._onKey.bind(this)
    }

    connectedCallback() {
      // If a property was set before this element upgraded (e.g. a form's init
      // code set `.confirmDisabled` while the component script was still
      // loading), the own data-property shadows the accessor and never reflects
      // to the attribute — so the primary button would stay disabled forever.
      // Re-apply any such property through its setter so it takes effect.
      this._upgradeProperty('confirmDisabled')
      this.render()
    }
    _upgradeProperty(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop]
        delete this[prop]
        this[prop] = value
      }
    }
    attributeChangedCallback() {
      if (this.shadowRoot && this._built) this.render()
    }

    /* ---- public API ---- */
    get confirmDisabled() {
      return this.hasAttribute('confirm-disabled')
    }
    set confirmDisabled(v) {
      v ? this.setAttribute('confirm-disabled', '') : this.removeAttribute('confirm-disabled')
    }

    open() {
      if (this.hasAttribute('open')) return
      this._lastFocus = document.activeElement
      this.dirty = false
      this.setAttribute('open', '')
      this._prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      // next frame → run the enter transition
      requestAnimationFrame(() => this._ov && this._ov.classList.add('is-open'))
      document.addEventListener('keydown', this._onKey)
      this.dispatchEvent(new CustomEvent('tv-open', { bubbles: true, composed: true }))
      setTimeout(() => {
        const f = this._firstFocusable()
        f && f.focus()
      }, 60)
    }

    close({ force = false } = {}) {
      if (!this.hasAttribute('open')) return
      const dismissible = this.getAttribute('dismissible') !== 'false'
      if (!force && !dismissible) return
      if (!force && this.hasAttribute('guard') && this.dirty && !window.confirm('Discard your changes?')) return
      this._ov && this._ov.classList.remove('is-open')
      document.removeEventListener('keydown', this._onKey)
      let done = false
      const finish = () => {
        if (done) return
        done = true
        this.removeAttribute('open')
        document.body.style.overflow = this._prevOverflow
        if (this._lastFocus && this._lastFocus.focus) this._lastFocus.focus()
        this.dispatchEvent(new CustomEvent('tv-close', { bubbles: true, composed: true }))
      }
      this._card && this._card.addEventListener('transitionend', finish, { once: true })
      setTimeout(finish, 260)
    }

    /* ---- internals ---- */
    _firstFocusable() {
      const body = [...this.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      return body[0] || this._closeBtn || this._card
    }
    _focusables() {
      const list = []
      if (this._closeBtn && this._closeBtn.offsetParent !== null) list.push(this._closeBtn)
      list.push(...[...this.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null))
      list.push(...[...this._footer.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null))
      return list
    }
    _onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        this.close()
      } else if (e.key === 'Tab') {
        const f = this._focusables()
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        const active = this.shadowRoot.activeElement || document.activeElement
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    render() {
      this._built = true
      const size = this.getAttribute('size') || 'md'
      const heading = this.getAttribute('heading') || ''
      const subtitle = this.getAttribute('subtitle') || ''
      const iconName = this.getAttribute('icon') || 'pencil'
      const iconClass = window.__tvIcon ? window.__tvIcon(iconName) : 'icon-' + iconName
      const markerKind = this.getAttribute('marker-kind')
      const markerLabel = this.getAttribute('marker-label') || ''
      const primary = this.getAttribute('primary-label')
      // When the confirm action itself is destructive (cancel / delete / remove),
      // set primary-variant="danger" — the primary button stays in its standard
      // right-hand position but renders red. Use danger-label ONLY for a
      // secondary destructive action sitting alongside a non-destructive primary.
      const primaryVariant = this.getAttribute('primary-variant') === 'danger' ? 'danger' : 'primary'
      const danger = this.getAttribute('danger-label')
      const cancelLabel = this.getAttribute('cancel-label') || 'Cancel'
      // Optional bottom-left footer hint — for form modals (validation / guidance).
      const footerHint = this.getAttribute('footer-hint') || ''
      const dismissible = this.getAttribute('dismissible') !== 'false'
      const confirmDisabled = this.hasAttribute('confirm-disabled')

      const widths = { sm: '440px', md: '600px', lg: '760px' }
      const marker = markerKind ? `<tv-status-tag kind="${markerKind}" label="${markerLabel}"></tv-status-tag>` : ''
      // Only mount the footer-start slot when the host actually supplies one,
      // so `footer:empty` still collapses for cards with no footer at all.
      const hasFooterStart = !!this.querySelector('[slot="footer-start"]')

      // A card may want a secondary button with no primary beside it (a
      // read-only card whose only footer action is "Close"). Setting
      // cancel-label explicitly is the opt-in; without it the footer still
      // collapses entirely, so nothing already built changes.
      const footerBtns =
        danger || primary || this.hasAttribute('cancel-label')
          ? `${danger ? `<tv-button variant="danger" data-act="danger" class="f-danger">${danger}</tv-button>` : ''}
             <tv-button variant="secondary" data-act="cancel">${cancelLabel}</tv-button>
             ${primary ? `<tv-button variant="${primaryVariant}" data-act="confirm" ${confirmDisabled ? 'disabled' : ''}>${primary}</tv-button>` : ''}`
          : ''

      this.shadowRoot.innerHTML = `
        <style>
          :host{ display:contents; font-family:var(--tv-font,'Geist','Inter',system-ui,sans-serif); }
          .ov{
            position:fixed; inset:0; z-index:1000;
            display:flex; align-items:center; justify-content:center; padding:40px;
            background:rgb(15 23 42 / .42);
            -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px);
            opacity:0; visibility:hidden;
            transition:opacity var(--dur-base,200ms) var(--ease-std,ease), visibility 0s linear var(--dur-base,200ms);
          }
          .ov.is-open{ opacity:1; visibility:visible; transition:opacity var(--dur-base,200ms) var(--ease-std,ease); }
          .card{
            width:${widths[size] || widths.md}; max-width:100%; max-height:88vh;
            display:flex; flex-direction:column; overflow:hidden;
            background:var(--surface-0,#fff); border:1px solid var(--border-subtle,#e2e8f0);
            border-radius:var(--radius-xl,16px); box-shadow:var(--shadow-lg,0 10px 15px -3px rgb(0 0 0/.1),0 4px 6px -4px rgb(0 0 0/.1));
            transform:translateY(8px) scale(.98); opacity:0;
            transition:transform var(--dur-base,200ms) var(--ease-std,ease), opacity var(--dur-base,200ms) var(--ease-std,ease);
          }
          .ov.is-open .card{ transform:none; opacity:1; }
          header{ display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--surface-100,#f1f5f9); flex:0 0 auto; }
          .hicon{ width:28px; height:28px; border-radius:var(--radius-md,8px); background:var(--primary-600,#4f46e5); color:#fff; display:grid; place-items:center; flex:0 0 auto; font-size:15px; line-height:1; }
          .titles{ min-width:0; display:flex; flex-direction:column; gap:1px; }
          .title{ } /* type via .tv-h6 */
          .subtitle{ } /* type via .tv-eyebrow */
          .subtitle:empty{ display:none; }
          .marker{ margin-left:auto; display:inline-flex; }
          .marker:empty{ display:none; }
          .close{ width:30px; height:30px; border:none; background:none; cursor:pointer; border-radius:var(--radius-md,8px); display:grid; place-items:center; color:var(--fg-3,#64748b); flex:0 0 auto; transition:background var(--dur-quick,100ms) var(--ease-std,ease); }
          .close:hover{ background:var(--surface-100,#f1f5f9); color:var(--fg-1,#0f172a); }
          .close:focus-visible{ outline:none; box-shadow:var(--shadow-ring-primary,0 0 0 3px rgba(99,102,241,.3)); }
          .close{ font-size:16px; line-height:1; }
          .marker + .close{ margin-left:0; }
          header.no-marker .close{ margin-left:auto; }
          .body{ padding:18px; overflow:auto; flex:1 1 auto; }
          /* scoped to the body's slot so footer-start content is untouched */
          .body ::slotted(* + *){ margin-top:14px; }
          footer{ display:flex; align-items:center; gap:10px; padding:13px 18px; border-top:1px solid var(--surface-100,#f1f5f9); flex:0 0 auto; justify-content:flex-end; }
          footer:empty{ display:none; }
          .fstart{ display:inline-flex; align-items:center; gap:4px; margin-right:auto; }
          footer .f-danger{ margin-right:auto; }
          .fhint{ margin-right:auto; font:400 12px var(--tv-font,'Geist','Inter',system-ui,sans-serif); color:var(--surface-500,#64748b); }
          .fhint:empty{ display:none; }
          @media (prefers-reduced-motion: reduce){
            .ov, .card{ transition-duration:1ms !important; } .card{ transform:none; }
          }
        </style>
        <div class="ov" part="overlay">
          <div class="card" role="dialog" aria-modal="true" aria-label="${heading.replace(/"/g, '&quot;')}" part="card" tabindex="-1">
            <header class="${marker ? '' : 'no-marker'}">
              <span class="hicon" aria-hidden="true"><i class="${iconClass}"></i></span>
              <span class="titles"><span class="title tv-h6">${heading}</span><span class="subtitle tv-eyebrow">${subtitle}</span></span>
              <span class="marker">${marker}</span>
              ${dismissible ? `<button class="close" type="button" aria-label="Close"><i class="icon-x"></i></button>` : ''}
            </header>
            <div class="body"><slot></slot></div>
            <footer>${hasFooterStart ? `<span class="fstart"><slot name="footer-start"></slot></span>` : ''}${footerHint ? `<span class="fhint">${footerHint}</span>` : ''}${footerBtns}</footer>
          </div>
        </div>
      `

      if (window.__tvType) window.__tvType(this.shadowRoot)
      if (window.__tvIcons) window.__tvIcons(this.shadowRoot)

      // refs
      this._ov = this.shadowRoot.querySelector('.ov')
      this._card = this.shadowRoot.querySelector('.card')
      this._footer = this.shadowRoot.querySelector('footer')
      this._closeBtn = this.shadowRoot.querySelector('.close')

      // Preserve the visible state across re-renders. attributeChangedCallback
      // re-renders the shadow DOM, which would otherwise rebuild the overlay
      // without its `.is-open` class — making an open modal vanish while the
      // host keeps its `open` attribute (so open() can never re-show it).
      // Changing heading / primary-label / confirm-disabled mid-flow is therefore safe.
      if (this.hasAttribute('open') && this._ov) this._ov.classList.add('is-open')

      // wiring
      this._ov.addEventListener('mousedown', (e) => {
        if (e.target === this._ov) this.close()
      })
      this._closeBtn && this._closeBtn.addEventListener('click', () => this.close())
      this._footer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]')
        if (!btn) return
        const act = btn.getAttribute('data-act')
        if (act === 'cancel') {
          this.dispatchEvent(new CustomEvent('tv-cancel', { bubbles: true, composed: true }))
          // cancel-closes="false": the secondary is an action in its own right
          // (Ignore this finding, View all) rather than a dismissal, so it
          // reports and leaves the card open. Close still works via ✕ / Esc /
          // the scrim. Default is unchanged: cancel dismisses.
          if (this.getAttribute('cancel-closes') !== 'false') this.close()
        } else if (act === 'danger') {
          this.dispatchEvent(new CustomEvent('tv-danger', { bubbles: true, composed: true }))
        } else if (act === 'confirm') {
          if (this.hasAttribute('confirm-disabled')) return
          this.dispatchEvent(new CustomEvent('tv-confirm', { bubbles: true, composed: true }))
        }
      })
    }
  }

  customElements.define('tv-modal-card', TvModalCard)
})()
