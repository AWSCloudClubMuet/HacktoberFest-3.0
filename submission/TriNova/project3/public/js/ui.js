/* Small UI helpers: escaping, toasts, modal form. */
(function () {
  'use strict';

  const esc = (v) => String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function toast(message, kind) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = message;
    box.appendChild(t);
    setTimeout(() => t.remove(), kind === 'error' ? 5000 : 3000);
  }

  /** Turns an API error into {fields:{name:msg}, message}. details may be an object or array. */
  function errorParts(err) {
    const fields = {};
    const d = err && err.details;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      for (const [k, v] of Object.entries(d)) fields[k] = String(v);
    }
    return { fields, message: err && err.message ? err.message : 'Something went wrong' };
  }

  /**
   * Opens a modal form.
   * opts: { title, fields:[{name,label,type,options,value,readonly,min}], submitLabel,
   *         validate(values)->{ok,errors}, onSubmit(values) -> Promise }
   */
  function formModal(opts) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const fieldsHtml = opts.fields.map((f) => {
      const id = 'f_' + f.name;
      let control;
      if (f.type === 'select') {
        control = `<select id="${id}" name="${f.name}"${f.disabled ? ' disabled' : ''}>` +
          f.options.map((o) => `<option value="${esc(o)}"${String(o) === String(f.value) ? ' selected' : ''}>${esc(o)}</option>`).join('') +
          '</select>';
      } else {
        control = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value)}"` +
          `${f.min !== undefined ? ` min="${f.min}"` : ''}${f.readonly ? ' readonly' : ''} autocomplete="off">`;
      }
      return `<div class="field" data-field="${f.name}"><label for="${id}">${esc(f.label)}</label>${control}<div class="err"></div></div>`;
    }).join('');
    overlay.innerHTML = `
      <form class="modal" novalidate role="dialog" aria-modal="true" aria-label="${esc(opts.title)}">
        <h2>${esc(opts.title)}</h2>
        <div class="body"><div class="form-error" hidden></div>${fieldsHtml}</div>
        <div class="foot">
          <button type="button" class="btn secondary" data-cancel>Cancel</button>
          <button type="submit" class="btn">${esc(opts.submitLabel || 'Save')}</button>
        </div>
      </form>`;
    document.body.appendChild(overlay);
    const form = overlay.querySelector('form');
    const formErr = overlay.querySelector('.form-error');
    const submit = form.querySelector('[type=submit]');
    const close = () => overlay.remove();

    function showErrors(errors, message) {
      form.querySelectorAll('.field').forEach((w) => {
        const msg = errors[w.dataset.field];
        w.classList.toggle('invalid', !!msg);
        w.querySelector('.err').textContent = msg || '';
      });
      const leftover = message && !Object.keys(errors).length ? message : '';
      formErr.textContent = leftover;
      formErr.hidden = !leftover;
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const values = {};
      opts.fields.forEach((f) => { values[f.name] = form.elements[f.name].value; });
      if (opts.validate) {
        const check = opts.validate(values);
        if (!check.ok) return showErrors(check.errors);
      }
      showErrors({});
      submit.disabled = true;
      try {
        await opts.onSubmit(values);
        close();
      } catch (err) {
        const p = errorParts(err);
        const known = {};
        for (const k of Object.keys(p.fields)) if (form.elements[k]) known[k] = p.fields[k];
        showErrors(known, p.message);
        if (Object.keys(known).length && !Object.keys(p.fields).every((k) => known[k])) {
          formErr.textContent = p.message; formErr.hidden = false;
        }
        submit.disabled = false;
      }
    });
    overlay.querySelector('[data-cancel]').addEventListener('click', close);
    overlay.addEventListener('mousedown', (ev) => { if (ev.target === overlay) close(); });
    document.addEventListener('keydown', function onKey(ev) {
      if (!document.body.contains(overlay)) return document.removeEventListener('keydown', onKey);
      if (ev.key === 'Escape') close();
    });
    const first = form.querySelector('input:not([readonly]), select');
    if (first) first.focus();
  }

  /** Simple confirm dialog. Resolves true/false. */
  function confirmBox(title, message, okLabel) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.innerHTML = `
        <div class="modal" role="alertdialog" aria-modal="true">
          <h2>${esc(title)}</h2>
          <div class="body">${esc(message)}</div>
          <div class="foot">
            <button class="btn secondary" data-no>Cancel</button>
            <button class="btn danger" data-yes>${esc(okLabel || 'Delete')}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const done = (v) => { overlay.remove(); resolve(v); };
      overlay.querySelector('[data-no]').addEventListener('click', () => done(false));
      overlay.querySelector('[data-yes]').addEventListener('click', () => done(true));
      overlay.querySelector('[data-no]').focus();
    });
  }

  window.UI = { esc, toast, errorParts, formModal, confirmBox };
})();