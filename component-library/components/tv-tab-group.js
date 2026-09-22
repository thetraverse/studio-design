/* ============================================================
   <tv-tab-group>  —  Traverse component library
   The page tab strip: a row of <tv-tab>s with the shared bottom
   border. Owns the active state — clicking a tab activates it,
   clears the rest, and emits tv-change with the tab's value.
   Lifted from the dashboard `.tabs`.

   Single source of truth: edit THIS file and every page updates.

   Usage:
     <tv-tab-group value="summary">
       <tv-tab value="summary" icon="layout-dashboard" label="Summary"></tv-tab>
       <tv-tab value="users" icon="users" label="Users" count="6"></tv-tab>
       <tv-tab value="settings" icon="settings" label="Settings"></tv-tab>
     </tv-tab-group>

   Attributes:
     value   the active tab's value (reflected; read/write via .value)

   Events: tv-change (detail:{ value })
   Tokens: --surface-200
   ============================================================ */
(() => {
  if (customElements.get('tv-tab-group')) return

  class TvTabGroup extends HTMLElement {
    static get observedAttributes() {
      return ['value']
    }
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }
    connectedCallback() {
      // If a page set `.value` before this element upgraded (the component
      // scripts load asynchronously, so any inline script that runs during
      // parsing gets there first), that assignment created an own data
      // property which now SHADOWS the accessor below. The attribute is then
      // never written, attributeChangedCallback never fires, _sync() never
      // runs — and clicking a tab moves the panel but not the underline.
      // Re-apply the value through the setter so it reflects to the attribute.
      this._upgradeProperty('value')
      this.render()
      this.addEventListener('click', this._onClick)
      // sync after children upgrade
      requestAnimationFrame(() => this._sync())
    }
    _upgradeProperty(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop]
        delete this[prop]
        this[prop] = value
      }
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._sync()
    }
    get value() {
      return this.getAttribute('value')
    }
    set value(v) {
      if (v == null) this.removeAttribute('value')
      else this.setAttribute('value', v)
    }
    _tabs() {
      return Array.from(this.querySelectorAll('tv-tab'))
    }
    _onClick = (e) => {
      const tab = e.target.closest && e.target.closest('tv-tab')
      if (!tab || tab.hasAttribute('disabled') || !this.contains(tab)) return
      const v = tab.getAttribute('value')
      if (v == null || v === this.value) return
      this.value = v
      this.dispatchEvent(new CustomEvent('tv-change', { bubbles: true, detail: { value: v } }))
    }
    // Reflect the group's value onto the children's active state.
    _sync() {
      const v = this.value
      this._tabs().forEach((t) => {
        if (t.getAttribute('value') === v) t.setAttribute('active', '')
        else t.removeAttribute('active')
      })
    }
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host{ display:flex; gap:28px; border-bottom:1px solid var(--surface-200,#e2e8f0); }
        </style>
        <slot></slot>
      `
      this._sync()
    }
  }
  customElements.define('tv-tab-group', TvTabGroup)
})()
