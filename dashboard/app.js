/** ojao hospital partner and platform administration portal. */
(() => {
  'use strict';

  const state = {
    accessToken: sessionStorage.getItem('ojao.accessToken') || null,
    refreshToken: sessionStorage.getItem('ojao.refreshToken') || null,
    user: JSON.parse(sessionStorage.getItem('ojao.user') || 'null'),
    registrationCodeSent: false,
    resetCodeSent: false,
  };
  const apiBase = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '8081'
    ? 'http://localhost:8081/api/v1'
    : '/api/v1';

  const $ = (selector) => document.querySelector(selector);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    toast(`JavaScript error: ${event.message}`, true);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    toast(event.reason?.message || 'A network error occurred.', true);
  });

  class ApiError extends Error {
    constructor(message, code, status) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }

  async function api(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;

    let response;
    try {
      response = await fetch(`${apiBase}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (_) {
      throw new ApiError('Could not reach the API. Check your connection.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && auth && state.refreshToken && path !== '/auth/refresh') {
        if (await tryRefresh()) return api(path, { method, body, auth });
        clearSession();
        showAuth();
      }
      throw new ApiError(data.message || `Request failed (${response.status})`, data.error, response.status);
    }
    return data;
  }

  async function tryRefresh() {
    try {
      const data = await api('/auth/refresh', {
        method: 'POST',
        auth: false,
        body: { refreshToken: state.refreshToken },
      });
      setTokens(data);
      return true;
    } catch (_) {
      return false;
    }
  }

  function setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      state.accessToken = accessToken;
      sessionStorage.setItem('ojao.accessToken', accessToken);
    }
    if (refreshToken) {
      state.refreshToken = refreshToken;
      sessionStorage.setItem('ojao.refreshToken', refreshToken);
    }
  }

  function storeSession(data) {
    setTokens(data);
    state.user = data.user;
    sessionStorage.setItem('ojao.user', JSON.stringify(data.user));
  }

  function clearSession() {
    state.accessToken = null;
    state.refreshToken = null;
    state.user = null;
    ['accessToken', 'refreshToken', 'user'].forEach((key) => sessionStorage.removeItem(`ojao.${key}`));
  }

  async function signOut() {
    const refreshToken = state.refreshToken;
    clearSession();
    showAuth();
    if (refreshToken) {
      await api('/auth/logout', { method: 'POST', auth: false, body: { refreshToken } }).catch(() => {});
    }
  }

  function showAuth() {
    $('#portal-view').hidden = true;
    $('#auth-view').hidden = false;
  }

  function showPortal() {
    $('#auth-view').hidden = true;
    $('#portal-view').hidden = false;
    const isAdmin = state.user.role === 'PLATFORM_ADMIN';
    $('#portal-label').textContent = isAdmin ? 'admin' : 'partner';
    $('#whoami').textContent = `${state.user.name || 'Account'} · ${state.user.phone}`;
    $('#admin-tabs').hidden = !isAdmin;
    $('#partner-workspace').hidden = isAdmin;
    $('#tab-applications').hidden = !isAdmin;
    $('#tab-audit').hidden = true;
    if (isAdmin) loadApplications();
    else loadMyApplication();
  }

  function switchAudience(name) {
    document.querySelectorAll('.audience').forEach((button) => {
      button.classList.toggle('active', button.dataset.audience === name);
    });
    $('#partner-auth').hidden = name !== 'partner';
    $('#admin-auth').hidden = name !== 'admin';
  }

  function switchPartnerMode(mode) {
    document.querySelectorAll('.form-mode').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });
    const registering = mode === 'register';
    $('#partner-login-form').hidden = registering;
    $('#partner-register-form').hidden = !registering;
    $('#partner-reset-form').hidden = true;
    $('#partner-auth-title').textContent = registering ? 'Create a verified partner account' : 'Sign in to your application';
    $('#partner-auth-copy').textContent = registering
      ? 'We will verify your phone number with a WhatsApp code before creating the account.'
      : 'Continue an application or review its current status.';
    $('#partner-auth-error').textContent = '';
  }

  function showResetMode() {
    document.querySelector('.form-switch').hidden = true;
    $('#partner-login-form').hidden = true;
    $('#partner-register-form').hidden = true;
    $('#partner-reset-form').hidden = false;
    $('#partner-auth-title').textContent = 'Reset your password';
    $('#partner-auth-copy').textContent = 'Verify your registered WhatsApp number, then choose a new password.';
    $('#partner-auth-error').textContent = '';
  }

  function leaveResetMode() {
    document.querySelector('.form-switch').hidden = false;
    switchPartnerMode('login');
  }

  async function partnerLogin(event) {
    event.preventDefault();
    await authenticate($('#partner-login-btn'), $('#partner-auth-error'), '/auth/login', {
      phone: $('#partner-phone').value.trim(),
      password: $('#partner-password').value,
    }, 'Sign in');
  }

  async function partnerRegister(event) {
    event.preventDefault();
    if (!state.registrationCodeSent) {
      await sendOtp('register', $('#register-phone').value.trim(), $('#partner-register-btn'), 'Send WhatsApp code');
      if (state.registrationCodeSent) {
        $('#register-phone').readOnly = true;
        $('#register-code-section').hidden = false;
        $('#register-resend').hidden = false;
        $('#register-otp').required = true;
        setBusy($('#partner-register-btn'), false, 'Verify and create account');
        startResendCooldown($('#register-resend'));
      }
      return;
    }

    await authenticate($('#partner-register-btn'), $('#partner-auth-error'), '/auth/register', {
      name: $('#register-name').value.trim(),
      phone: $('#register-phone').value.trim(),
      email: $('#register-email').value.trim() || undefined,
      password: $('#register-password').value,
      otp: $('#register-otp').value.trim(),
    }, 'Verify and create account');
  }

  async function partnerReset(event) {
    event.preventDefault();
    const button = $('#partner-reset-btn');
    const error = $('#partner-auth-error');
    error.textContent = '';
    if (!state.resetCodeSent) {
      await sendOtp('password_reset', $('#reset-phone').value.trim(), button, 'Send reset code');
      if (state.resetCodeSent) {
        $('#reset-phone').readOnly = true;
        $('#reset-code-section').hidden = false;
        $('#reset-resend').hidden = false;
        $('#reset-otp').required = true;
        $('#reset-password').required = true;
        $('#reset-password-confirm').required = true;
        setBusy(button, false, 'Change password');
        startResendCooldown($('#reset-resend'));
      }
      return;
    }

    if ($('#reset-password').value !== $('#reset-password-confirm').value) {
      error.textContent = 'The new passwords do not match.';
      return;
    }
    setBusy(button, true, 'Changing password...');
    try {
      await api('/auth/password/reset', {
        method: 'POST',
        auth: false,
        body: {
          phone: $('#reset-phone').value.trim(),
          newPassword: $('#reset-password').value,
          otp: $('#reset-otp').value.trim(),
        },
      });
      state.resetCodeSent = false;
      leaveResetMode();
      $('#partner-phone').value = $('#reset-phone').value.trim();
      $('#partner-password').value = '';
      $('#partner-reset-form').reset();
      $('#reset-phone').readOnly = false;
      $('#reset-code-section').hidden = true;
      $('#reset-resend').hidden = true;
      toast('Password changed. Sign in with your new password.');
    } catch (err) {
      error.textContent = err.message;
      setBusy(button, false, 'Change password');
    }
  }

  async function sendOtp(purpose, phone, button, idleText, isResend = false) {
    const error = $('#partner-auth-error');
    error.textContent = '';
    setBusy(button, true, 'Sending WhatsApp code...');
    try {
      const result = await api('/auth/otp/request', { method: 'POST', auth: false, body: { phone, purpose } });
      if (purpose === 'register') state.registrationCodeSent = true;
      else state.resetCodeSent = true;
      if (isResend) toast(result.message || 'A new code was requested. Check WhatsApp.');
    } catch (err) {
      error.textContent = err.message;
    } finally {
      setBusy(button, false, idleText);
    }
  }

  async function resendRegistrationCode() {
    const button = $('#register-resend');
    await sendOtp('register', $('#register-phone').value.trim(), button, 'Resend code', true);
    if (state.registrationCodeSent) startResendCooldown(button);
  }

  async function resendResetCode() {
    const button = $('#reset-resend');
    await sendOtp('password_reset', $('#reset-phone').value.trim(), button, 'Resend code', true);
    if (state.resetCodeSent) startResendCooldown(button);
  }

  function startResendCooldown(button, seconds = 60) {
    let remaining = seconds;
    button.disabled = true;
    button.textContent = `Resend code in ${remaining}s`;
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        button.disabled = false;
        button.textContent = 'Resend code';
      } else {
        button.textContent = `Resend code in ${remaining}s`;
      }
    }, 1000);
  }

  async function adminLogin(event) {
    event.preventDefault();
    const button = $('#admin-login-btn');
    const error = $('#admin-auth-error');
    error.textContent = '';
    setBusy(button, true, 'Signing in...');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        auth: false,
        body: { phone: $('#admin-phone').value.trim(), password: $('#admin-password').value },
      });
      if (data.user.role !== 'PLATFORM_ADMIN') throw new ApiError('This account is not a platform administrator.');
      storeSession(data);
      showPortal();
    } catch (err) {
      error.textContent = err.message;
      setBusy(button, false, 'Sign in as admin');
    }
  }

  async function authenticate(button, error, path, body, idleText) {
    error.textContent = '';
    setBusy(button, true, path.endsWith('register') ? 'Creating account...' : 'Signing in...');
    try {
      const data = await api(path, { method: 'POST', auth: false, body });
      if (data.user.role === 'PLATFORM_ADMIN') {
        throw new ApiError('Use the platform admin sign-in for this account.');
      }
      storeSession(data);
      showPortal();
    } catch (err) {
      error.textContent = err.message;
      setBusy(button, false, idleText);
    }
  }

  async function loadMyApplication() {
    const refresh = $('#refresh-status');
    refresh.disabled = true;
    try {
      const { application } = await api('/hospital-applications/mine');
      if (application) renderApplicationStatus(application);
      else renderApplicationForm();
    } catch (err) {
      toast(err.message, true);
    } finally {
      refresh.disabled = false;
    }
  }

  function renderApplicationForm(previous = null) {
    const reapplying = previous?.status === 'REJECTED';
    $('#partner-page-title').textContent = reapplying ? 'Revise your application' : 'Hospital onboarding';
    $('#partner-page-copy').textContent = reapplying
      ? 'Update the rejected application using the review notes, then submit it for another review.'
      : 'Provide the details our verification team needs to review your facility.';
    $('#application-form-panel').hidden = false;
    $('#application-status-panel').hidden = true;
    $('#application-form').reset();
    $('#hospital-name').value = previous?.hospitalName || '';
    $('#hospital-address').value = previous?.submittedAddress || '';
    $('#hospital-phone').value = previous?.submittedPhone || state.user.phone || '';
    $('#hospital-latitude').value = previous?.latitude ?? '';
    $('#hospital-longitude').value = previous?.longitude ?? '';
    $('#submit-application').textContent = reapplying ? 'Submit revised application' : 'Submit for verification';
    resetDocumentFields(previous?.submittedDocuments || []);
  }

  function renderApplicationStatus(application) {
    $('#application-form-panel').hidden = true;
    $('#application-status-panel').hidden = false;
    $('#partner-page-title').textContent = application.hospitalName;
    $('#partner-page-copy').textContent = 'Your hospital application and verification outcome.';

    const statusInfo = {
      PENDING: ['Application under review', 'Our verification team is checking the submitted facility information.', 'clock'],
      APPROVED: ['Hospital approved', 'Your hospital has been verified and activated on the ojao network.', 'check'],
      REJECTED: ['Changes required', 'The verification team could not approve this submission.', 'alert'],
      SUSPENDED: ['Hospital suspended', 'This hospital is currently inactive. Review the notes or contact platform support.', 'pause'],
    }[application.status] || ['Application received', 'The application status was updated.', 'clock'];

    const summary = $('#status-summary');
    summary.innerHTML = '';
    const icon = el('div', `status-icon status-${application.status.toLowerCase()}`, statusInfo[2] === 'check' ? '✓' : statusInfo[2] === 'alert' ? '!' : statusInfo[2] === 'pause' ? 'Ⅱ' : '◷');
    const copy = el('div', 'status-copy');
    copy.append(el('span', `badge badge-${application.status.toLowerCase()}`, application.status));
    copy.append(el('h2', null, statusInfo[0]));
    copy.append(el('p', 'muted', statusInfo[1]));
    summary.append(icon, copy);
    if (application.reviewNotes) {
      const review = el('div', 'review-note');
      review.append(el('strong', null, 'Review notes'), el('p', null, application.reviewNotes));
      summary.appendChild(review);
    }
    if (application.status === 'REJECTED') {
      const reapply = el('button', 'btn primary reapply-btn', 'Revise and reapply');
      reapply.type = 'button';
      reapply.onclick = () => renderApplicationForm(application);
      summary.appendChild(reapply);
    }

    const details = $('#status-details');
    details.innerHTML = '';
    details.append(el('h3', null, 'Submitted application'));
    const meta = el('dl', 'meta status-meta');
    addRow(meta, 'Hospital', application.hospitalName);
    addRow(meta, 'Contact', application.submittedPhone || 'Not provided');
    addRow(meta, 'Address', application.submittedAddress || 'Not provided');
    addRow(meta, 'Location', application.latitude != null ? `${application.latitude.toFixed(6)}, ${application.longitude.toFixed(6)}` : 'Not provided');
    addRow(meta, 'Documents', `${(application.submittedDocuments || []).length} reference(s)`);
    addRow(meta, 'Submitted', formatTime(application.createdAt));
    if (application.reviewedAt) addRow(meta, 'Reviewed', formatTime(application.reviewedAt));
    if (application.hospitalId) addRow(meta, 'Hospital ID', application.hospitalId);
    details.appendChild(meta);
  }

  async function submitApplication(event) {
    event.preventDefault();
    const button = $('#submit-application');
    const error = $('#application-error');
    error.textContent = '';
    const latitudeRaw = $('#hospital-latitude').value;
    const longitudeRaw = $('#hospital-longitude').value;
    if ((latitudeRaw && !longitudeRaw) || (!latitudeRaw && longitudeRaw)) {
      error.textContent = 'Provide both latitude and longitude, or leave both empty.';
      return;
    }

    setBusy(button, true, 'Submitting application...');
    let application;
    try {
      const initialDocuments = collectDocuments();
      application = await api('/hospital-applications', {
        method: 'POST',
        body: {
          hospitalName: $('#hospital-name').value.trim(),
          submittedAddress: $('#hospital-address').value.trim(),
          submittedPhone: $('#hospital-phone').value.trim(),
          ...(latitudeRaw ? { latitude: Number(latitudeRaw), longitude: Number(longitudeRaw) } : {}),
          submittedDocuments: [],
        },
      });

      let current = application;
      try {
        for (const document of initialDocuments) {
          current = await api(`/hospital-applications/${application.id}/documents`, {
            method: 'POST',
            body: document,
          });
        }
      } catch (documentError) {
        renderApplicationStatus(current);
        toast(`Application submitted, but a document reference was not attached: ${documentError.message}`, true);
        return;
      }
      renderApplicationStatus(current);
      toast('Application submitted for verification.');
    } catch (err) {
      error.textContent = err.message;
      setBusy(button, false, 'Submit for verification');
      if (application) await loadMyApplication();
    }
  }

  function collectDocuments() {
    return [...document.querySelectorAll('.document-row')].map((row) => ({
      label: row.querySelector('.document-label').value.trim() || undefined,
      storageKey: row.querySelector('.document-key').value.trim(),
    })).filter((document) => document.storageKey);
  }

  function resetDocumentFields(documents) {
    const fields = $('#document-fields');
    fields.innerHTML = '';
    if (!documents.length) {
      addDocumentField();
      return;
    }
    documents.forEach((document) => addDocumentField(document));
  }

  function addDocumentField(document = null) {
    const row = el('div', 'document-row removable');
    const label = el('label', null, 'Document label');
    const labelInput = el('input', 'document-label');
    labelInput.type = 'text';
    labelInput.maxLength = 200;
    labelInput.placeholder = 'Accreditation certificate';
    labelInput.value = document?.label || '';
    label.appendChild(labelInput);
    const key = el('label', null, 'Private storage key');
    const keyInput = el('input', 'document-key');
    keyInput.type = 'text';
    keyInput.maxLength = 500;
    keyInput.placeholder = 'applications/accreditation.pdf';
    keyInput.value = document?.storageKey || '';
    key.appendChild(keyInput);
    const remove = el('button', 'btn icon-btn', '×');
    remove.type = 'button';
    remove.title = 'Remove document reference';
    remove.onclick = () => row.remove();
    row.append(label, key, remove);
    $('#document-fields').appendChild(row);
  }

  function useCurrentLocation() {
    const message = $('#location-message');
    if (!navigator.geolocation) {
      message.textContent = 'Location is not supported by this browser.';
      return;
    }
    message.textContent = 'Requesting your current position...';
    navigator.geolocation.getCurrentPosition((position) => {
      $('#hospital-latitude').value = position.coords.latitude.toFixed(6);
      $('#hospital-longitude').value = position.coords.longitude.toFixed(6);
      message.textContent = `Location captured with approximately ${Math.round(position.coords.accuracy)} m accuracy.`;
    }, (error) => {
      message.textContent = error.code === 1 ? 'Location permission was denied. Enter coordinates manually.' : 'Could not retrieve location. Enter coordinates manually.';
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  async function loadApplications() {
    const status = $('#status-filter').value;
    const list = $('#apps-list');
    list.innerHTML = '';
    $('#apps-empty').hidden = true;
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const { results } = await api(`/admin/hospital-applications${query}`);
      if (!results.length) {
        $('#apps-empty').hidden = false;
        return;
      }
      results.forEach((application) => list.appendChild(applicationCard(application)));
    } catch (err) {
      toast(err.message, true);
    }
  }

  function applicationCard(application) {
    const card = el('div', 'card app-card');
    const head = el('div', 'app-head');
    head.append(el('h3', null, application.hospitalName), el('span', `badge badge-${application.status.toLowerCase()}`, application.status));
    card.appendChild(head);
    const meta = el('dl', 'meta');
    addRow(meta, 'Phone', application.submittedPhone || '—');
    addRow(meta, 'Address', application.submittedAddress || '—');
    addRow(meta, 'Location', application.latitude != null ? `${application.latitude.toFixed(5)}, ${application.longitude.toFixed(5)}` : '—');
    addRow(meta, 'Documents', `${(application.submittedDocuments || []).length} attached`);
    addRow(meta, 'Submitted', formatTime(application.createdAt));
    if (application.reviewNotes) addRow(meta, 'Review notes', application.reviewNotes);
    card.appendChild(meta);

    const actions = el('div', 'actions');
    if (application.status === 'PENDING') {
      const approve = el('button', 'btn primary', 'Approve');
      approve.onclick = () => decide(application, 'approve');
      const reject = el('button', 'btn danger', 'Reject');
      reject.onclick = () => decide(application, 'reject');
      actions.append(approve, reject);
    } else if (application.hospitalId) {
      const suspend = el('button', 'btn', 'Suspend hospital');
      suspend.onclick = () => setHospitalActive(application.hospitalId, false);
      const reactivate = el('button', 'btn', 'Reactivate');
      reactivate.onclick = () => setHospitalActive(application.hospitalId, true);
      actions.append(suspend, reactivate);
    }
    if (actions.children.length) card.appendChild(actions);
    return card;
  }

  async function decide(application, action) {
    const reviewNotes = prompt(
      action === 'reject' ? `Reject "${application.hospitalName}" — reason (required):` : `Approve "${application.hospitalName}" — optional notes:`,
    ) || '';
    if (action === 'reject' && reviewNotes.trim().length < 3) return toast('A rejection reason is required.', true);
    try {
      await api(`/admin/hospital-applications/${application.id}/${action}`, { method: 'POST', body: { reviewNotes } });
      toast(`Application ${action === 'approve' ? 'approved' : 'rejected'}.`);
      loadApplications();
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function setHospitalActive(hospitalId, active) {
    const reason = active ? '' : (prompt('Suspend hospital — reason (optional):') || '');
    try {
      await api(`/admin/hospitals/${hospitalId}/${active ? 'reactivate' : 'suspend'}`, { method: 'POST', body: { reason } });
      toast(active ? 'Hospital reactivated.' : 'Hospital suspended.');
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function loadAudit() {
    const entityType = $('#audit-entity').value.trim();
    const body = $('#audit-rows');
    body.innerHTML = '';
    $('#audit-empty').hidden = true;
    try {
      const query = entityType ? `?entityType=${encodeURIComponent(entityType)}` : '';
      const { results } = await api(`/admin/audit-logs${query}`);
      if (!results.length) {
        $('#audit-empty').hidden = false;
        return;
      }
      results.forEach((entry) => {
        const row = el('tr');
        row.append(el('td', 'mono', formatTime(entry.createdAt)));
        row.append(el('td', null, entry.action));
        row.append(el('td', 'mono', `${entry.entityType}${entry.entityId ? ` · ${short(entry.entityId)}` : ''}`));
        row.append(el('td', 'mono', entry.actorUserId ? short(entry.actorUserId) : '—'));
        row.append(el('td', 'mono', JSON.stringify(entry.metadata || {})));
        body.appendChild(row);
      });
    } catch (err) {
      toast(err.message, true);
    }
  }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
    $('#tab-applications').hidden = name !== 'applications';
    $('#tab-audit').hidden = name !== 'audit';
    if (name === 'audit') loadAudit();
  }

  function addRow(list, label, value) {
    list.append(el('dt', null, label), el('dd', null, value));
  }

  function setBusy(button, busy, text) {
    button.disabled = busy;
    button.textContent = text;
  }

  function short(id) {
    return String(id).slice(0, 8);
  }

  function formatTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  let toastTimer;
  function toast(message, isError = false) {
    const node = $('#toast');
    node.textContent = message;
    node.className = `toast${isError ? ' error' : ''}`;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 4000);
  }

  async function resumeSession() {
    if (!state.accessToken || !state.user) {
      showAuth();
      return;
    }
    try {
      const { user } = await api('/auth/me');
      state.user = user;
      sessionStorage.setItem('ojao.user', JSON.stringify(user));
      showPortal();
    } catch (_) {
      clearSession();
      showAuth();
    }
  }

  function init() {
    document.querySelectorAll('.audience').forEach((button) => button.addEventListener('click', () => switchAudience(button.dataset.audience)));
    document.querySelectorAll('.form-mode').forEach((button) => button.addEventListener('click', () => switchPartnerMode(button.dataset.mode)));
    $('#partner-login-form').addEventListener('submit', partnerLogin);
    $('#partner-register-form').addEventListener('submit', partnerRegister);
    $('#partner-reset-form').addEventListener('submit', partnerReset);
    $('#forgot-password-link').addEventListener('click', showResetMode);
    $('#reset-back').addEventListener('click', leaveResetMode);
    $('#register-resend').addEventListener('click', resendRegistrationCode);
    $('#reset-resend').addEventListener('click', resendResetCode);
    $('#admin-login-form').addEventListener('submit', adminLogin);
    $('#logout').addEventListener('click', signOut);
    $('#application-form').addEventListener('submit', submitApplication);
    $('#use-location').addEventListener('click', useCurrentLocation);
    $('#add-document').addEventListener('click', addDocumentField);
    $('#refresh-status').addEventListener('click', loadMyApplication);
    $('#refresh-apps').addEventListener('click', loadApplications);
    $('#status-filter').addEventListener('change', loadApplications);
    $('#refresh-audit').addEventListener('click', loadAudit);
    document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    resumeSession();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
