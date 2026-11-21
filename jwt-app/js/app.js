const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-');
const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const currentUser = () => JSON.parse(localStorage.getItem('user') || 'null');
const state = { bookFilter: {}, loanStatus: '' };

function msg(text, ok = false) {
  const el = $('#msg');
  el.textContent = text;
  el.className = ok ? 'ok' : 'err';
  el.hidden = false;
  clearTimeout(msg.t);
  msg.t = setTimeout(() => (el.hidden = true), 5000);
}

// ---------- LISTAGEM GENERICA COM FORMULARIO (CRUD) ----------
async function crudPage(cfg) {
  const { title, path, fields, columns, canWrite = true, canDelete = canWrite, extra = [] } = cfg;
  const rows = await api(path);
  let editing = null;
  const cols = columns || fields.filter((f) => f.type !== 'password');

  $('#content').innerHTML = `
    <h2>${title}</h2>
    ${canWrite ? `<form id="crud-form" class="card grid">
      ${fields.map((f) => f.type === 'checkbox'
        ? `<label><span>${f.label}</span><input type="checkbox" name="${f.key}"></label>`
        : `<label>${f.label}<input name="${f.key}" type="${f.type || 'text'}"></label>`).join('')}
      <button type="submit" id="save-btn">Salvar</button>
      <button type="button" class="sec" id="cancel-btn" hidden>Cancelar edição</button>
    </form>` : ''}
    <table>
      <thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join('')}<th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        ${cols.map((c) => `<td>${esc(c.show ? c.show(r[c.key], r) : r[c.key])}</td>`).join('')}
        <td class="actions" data-id="${r.id}">
          ${extra.map((e, i) => `<button data-extra="${i}" class="sec">${e.label(r)}</button>`).join('')}
          ${canWrite ? '<button data-edit>Editar</button>' : ''}
          ${canDelete ? '<button data-del class="danger">Excluir</button>' : ''}
        </td></tr>`).join('') || `<tr><td colspan="${cols.length + 1}">Nenhum registro</td></tr>`}
      </tbody>
    </table>
    <div id="extra"></div>`;

  const form = $('#crud-form');
  const reload = () => crudPage(cfg);

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {};
      for (const f of fields) {
        const el = form.elements[f.key];
        let v = f.type === 'checkbox' ? el.checked : el.value;
        if (f.type === 'password' && v === '' && editing) continue; // mantem a senha
        if (v === '') v = null;
        if (f.type === 'number' && v !== null) v = Number(v);
        data[f.key] = v;
      }
      try {
        await api(editing ? `${path}/${editing}` : path, { method: editing ? 'PUT' : 'POST', body: data });
        msg('Salvo com sucesso!', true);
        reload();
      } catch (err) { msg(err.message); }
    };
    $('#cancel-btn').onclick = reload;
  }

  $('tbody').onclick = async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.closest('td').dataset.id;
    const row = rows.find((r) => String(r.id) === id);
    try {
      if (btn.hasAttribute('data-edit')) {
        editing = id;
        for (const f of fields) {
          const el = form.elements[f.key];
          if (f.type === 'checkbox') el.checked = !!row[f.key];
          else if (f.type === 'password') el.value = '';
          else el.value = row[f.key] ?? '';
        }
        $('#cancel-btn').hidden = false;
        form.scrollIntoView();
      } else if (btn.hasAttribute('data-del')) {
        if (!confirm('Excluir este registro?')) return;
        await api(`${path}/${id}`, { method: 'DELETE' });
        msg('Excluído!', true);
        reload();
      } else if (btn.dataset.extra !== undefined) {
        await extra[btn.dataset.extra].fn(row, reload);
      }
    } catch (err) { msg(err.message); }
  };
}

// ---------- TELAS ----------
async function renderDashboard() {
  const d = await api('/reports/dashboard');
  $('#content').innerHTML = `<h2>Dashboard</h2><div class="cards">
    <div class="card">Títulos cadastrados<strong>${d.totalBooks}</strong></div>
    <div class="card">Empréstimos ativos<strong>${d.activeLoans}</strong></div>
    <div class="card">Empréstimos atrasados<strong>${d.overdueLoans}</strong></div>
    <div class="card">Multas cobradas<strong>${money(d.totalFines)}</strong></div></div>`;
}

const renderCategories = () => crudPage({
  title: 'Categorias', path: '/categories', canWrite: currentUser().isAdmin,
  fields: [{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }],
});

const renderAuthors = () => crudPage({
  title: 'Autores', path: '/authors', canWrite: currentUser().isAdmin,
  fields: [{ key: 'name', label: 'Nome' }, { key: 'nationality', label: 'Nacionalidade' }, { key: 'birthDate', label: 'Nascimento', type: 'date' }],
});

const renderReaders = () => crudPage({
  title: 'Leitores', path: '/readers', canDelete: false,
  fields: [{ key: 'name', label: 'Nome' }, { key: 'cpf', label: 'CPF' }, { key: 'email', label: 'E-mail', type: 'email' }, { key: 'phone', label: 'Telefone' }],
  extra: [{
    label: () => 'Histórico',
    fn: async (reader) => {
      const loans = await api(`/readers/${reader.id}/loans`);
      $('#extra').innerHTML = `<h3>Histórico de ${esc(reader.name)}</h3><table>
        <tr><th>Livro</th><th>Empréstimo</th><th>Vencimento</th><th>Devolução</th><th>Status</th><th>Multa</th></tr>
        ${loans.map((l) => `<tr><td>${esc(l.Book?.title)}</td><td>${fmtDate(l.loanDate)}</td><td>${fmtDate(l.dueDate)}</td>
          <td>${fmtDate(l.returnDate)}</td><td><span class="tag ${l.status}">${l.status}</span></td><td>${money(l.fine)}</td></tr>`).join('')
          || '<tr><td colspan="6">Sem empréstimos</td></tr>'}</table>`;
    },
  }],
});

const renderUsers = () => crudPage({
  title: 'Atendentes', path: '/user', canDelete: false,
  fields: [
    { key: 'name', label: 'Nome' }, { key: 'username', label: 'Username' },
    { key: 'email', label: 'E-mail', type: 'email' }, { key: 'password', label: 'Senha (em branco = não muda)', type: 'password' },
    { key: 'isAdmin', label: 'Administrador', type: 'checkbox' },
  ],
  columns: [
    { key: 'name', label: 'Nome' }, { key: 'username', label: 'Username' }, { key: 'email', label: 'E-mail' },
    { key: 'isAdmin', label: 'Admin', show: (v) => (v ? 'Sim' : 'Não') },
    { key: 'active', label: 'Ativo', show: (v) => (v ? 'Sim' : 'Não') },
  ],
  extra: [{
    label: (r) => (r.active ? 'Desativar' : 'Ativar'),
    fn: async (row, reload) => {
      await api(`/user/${row.id}/active`, { method: 'PATCH', body: { active: !row.active } });
      reload();
    },
  }],
});

async function renderBooks() {
  const admin = currentUser().isAdmin;
  const [cats, authors] = await Promise.all([api('/categories'), api('/authors')]);
  const f = state.bookFilter;
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const books = await api('/books' + (qs ? `?${qs}` : ''));
  let editing = null;
  const catOpts = (sel) => cats.map((c) => `<option value="${c.id}" ${String(sel) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const authOpts = authors.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('');

  $('#content').innerHTML = `
    <h2>Livros</h2>
    <form id="filter-form" class="card grid">
      <label>Título <input name="title" value="${esc(f.title || '')}"></label>
      <label>Categoria <select name="categoryId"><option value="">Todas</option>${catOpts(f.categoryId)}</select></label>
      <label>Autor <select name="authorId"><option value="">Todos</option>${authors.map((a) => `<option value="${a.id}" ${String(f.authorId) === String(a.id) ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
      <label><span>Só disponíveis</span><input type="checkbox" name="available" ${f.available ? 'checked' : ''}></label>
      <button>Filtrar</button>
    </form>
    ${admin ? `<form id="book-form" class="card grid">
      <label>Título <input name="title"></label>
      <label>ISBN <input name="isbn"></label>
      <label>Ano <input name="year" type="number"></label>
      <label>Exemplares <input name="totalCopies" type="number" min="1" value="1"></label>
      <label>Categoria <select name="categoryId"><option value="">Selecione</option>${catOpts('')}</select></label>
      <label>Autores (Ctrl para vários) <select name="authorIds" multiple size="4">${authOpts}</select></label>
      <button>Salvar</button><button type="button" class="sec" id="cancel-btn" hidden>Cancelar edição</button>
    </form>` : ''}
    <table><thead><tr><th>Título</th><th>ISBN</th><th>Categoria</th><th>Autores</th><th>Disponíveis</th><th></th></tr></thead><tbody>
      ${books.map((b) => `<tr><td>${esc(b.title)}</td><td>${esc(b.isbn)}</td><td>${esc(b.Category?.name)}</td>
        <td>${esc((b.Authors || []).map((a) => a.name).join(', '))}</td><td>${b.availableCopies}/${b.totalCopies}</td>
        <td class="actions" data-id="${b.id}">${admin ? '<button data-edit>Editar</button><button data-del class="danger">Excluir</button>' : ''}</td></tr>`).join('')
        || '<tr><td colspan="6">Nenhum livro</td></tr>'}</tbody></table>`;

  $('#filter-form').onsubmit = (e) => {
    e.preventDefault();
    const fm = e.target.elements;
    state.bookFilter = { title: fm.title.value, categoryId: fm.categoryId.value, authorId: fm.authorId.value, available: fm.available.checked ? 'true' : '' };
    renderBooks().catch((err) => msg(err.message));
  };
  if (!admin) return;

  const form = $('#book-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fm = form.elements;
    const body = {
      title: fm.title.value, isbn: fm.isbn.value, year: fm.year.value ? Number(fm.year.value) : null,
      totalCopies: Number(fm.totalCopies.value), categoryId: fm.categoryId.value || null,
      authorIds: [...fm.authorIds.selectedOptions].map((o) => Number(o.value)),
    };
    try {
      await api(editing ? `/books/${editing}` : '/books', { method: editing ? 'PUT' : 'POST', body });
      msg('Livro salvo!', true);
      renderBooks();
    } catch (err) { msg(err.message); }
  };
  $('#cancel-btn').onclick = () => renderBooks();

  $('tbody').onclick = async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.closest('td').dataset.id;
    const b = books.find((x) => String(x.id) === id);
    try {
      if (btn.hasAttribute('data-edit')) {
        editing = id;
        const fm = form.elements;
        fm.title.value = b.title; fm.isbn.value = b.isbn; fm.year.value = b.year ?? '';
        fm.totalCopies.value = b.totalCopies; fm.categoryId.value = b.categoryId ?? '';
        const ids = (b.Authors || []).map((a) => String(a.id));
        [...fm.authorIds.options].forEach((o) => (o.selected = ids.includes(o.value)));
        $('#cancel-btn').hidden = false;
        form.scrollIntoView();
      } else if (btn.hasAttribute('data-del')) {
        if (!confirm('Excluir este livro?')) return;
        await api(`/books/${id}`, { method: 'DELETE' });
        msg('Livro excluído!', true);
        renderBooks();
      }
    } catch (err) { msg(err.message); }
  };
}

async function renderLoans() {
  const [readers, books, loans] = await Promise.all([
    api('/readers'), api('/books?available=true'),
    api('/loans' + (state.loanStatus ? `?status=${state.loanStatus}` : '')),
  ]);
  $('#content').innerHTML = `
    <h2>Empréstimos</h2>
    <form id="loan-form" class="card grid">
      <label>Leitor <select name="readerId" required><option value="">Selecione</option>${readers.map((r) => `<option value="${r.id}">${esc(r.name)} (${esc(r.cpf)})</option>`).join('')}</select></label>
      <label>Livro <select name="bookId" required><option value="">Selecione</option>${books.map((b) => `<option value="${b.id}">${esc(b.title)} (${b.availableCopies} disp.)</option>`).join('')}</select></label>
      <button>Registrar empréstimo</button>
    </form>
    <label>Filtrar status
      <select id="status-filter">${['', 'ATIVO', 'ATRASADO', 'DEVOLVIDO'].map((s) => `<option value="${s}" ${state.loanStatus === s ? 'selected' : ''}>${s || 'Todos'}</option>`).join('')}</select>
    </label><br><br>
    <table><thead><tr><th>Livro</th><th>Leitor</th><th>Empréstimo</th><th>Vencimento</th><th>Devolução</th><th>Status</th><th>Multa</th><th></th></tr></thead><tbody>
      ${loans.map((l) => `<tr><td>${esc(l.Book?.title)}</td><td>${esc(l.Reader?.name)}</td><td>${fmtDate(l.loanDate)}</td><td>${fmtDate(l.dueDate)}</td>
        <td>${fmtDate(l.returnDate)}</td><td><span class="tag ${l.status}">${l.status}</span></td>
        <td>${money(l.returnDate ? l.fine : l.fineDue)}</td>
        <td>${l.returnDate ? '' : `<button data-return="${l.id}">Devolver${l.fineDue ? ` (multa ${money(l.fineDue)})` : ''}</button>`}</td></tr>`).join('')
        || '<tr><td colspan="8">Nenhum empréstimo</td></tr>'}</tbody></table>`;

  $('#loan-form').onsubmit = async (e) => {
    e.preventDefault();
    const fm = e.target.elements;
    try {
      await api('/loans', { method: 'POST', body: { readerId: Number(fm.readerId.value), bookId: Number(fm.bookId.value) } });
      msg('Empréstimo registrado! Prazo de 7 dias.', true);
      renderLoans();
    } catch (err) { msg(err.message); }
  };
  $('#status-filter').onchange = (e) => { state.loanStatus = e.target.value; renderLoans().catch((err) => msg(err.message)); };
  $('tbody').onclick = async (e) => {
    const btn = e.target.closest('button[data-return]');
    if (!btn) return;
    try {
      const l = await api(`/loans/${btn.dataset.return}/return`, { method: 'PATCH' });
      msg(l.fine > 0 ? `Devolvido com atraso. Multa: ${money(l.fine)}` : 'Devolvido sem multa.', true);
      renderLoans();
    } catch (err) { msg(err.message); }
  };
};

// ---------- NAVEGACAO / SESSAO ----------
const pages = [
  { id: 'dashboard', label: 'Dashboard', admin: true, render: renderDashboard },
  { id: 'loans', label: 'Empréstimos', render: renderLoans },
  { id: 'books', label: 'Livros', render: renderBooks },
  { id: 'readers', label: 'Leitores', render: renderReaders },
  { id: 'categories', label: 'Categorias', render: renderCategories },
  { id: 'authors', label: 'Autores', render: renderAuthors },
  { id: 'users', label: 'Atendentes', admin: true, render: renderUsers },
];

function go(id) {
  const page = pages.find((p) => p.id === id);
  document.querySelectorAll('#menu button').forEach((b) => b.classList.toggle('active', b.dataset.id === id));
  page.render().catch((err) => msg(err.message));
}

function showApp() {
  const u = currentUser();
  $('#login-screen').hidden = true;
  $('#app-screen').hidden = false;
  $('#user-info').textContent = `${u.name} (${u.isAdmin ? 'admin' : 'atendente'})`;
  // menus de admin escondidos para atendente (a API tambem bloqueia com 403)
  const visible = pages.filter((p) => !p.admin || u.isAdmin);
  $('#menu').innerHTML = visible.map((p) => `<button data-id="${p.id}">${p.label}</button>`).join('');
  $('#menu').onclick = (e) => e.target.dataset.id && go(e.target.dataset.id);
  go(visible[0].id);
}

function showLogin() {
  $('#app-screen').hidden = true;
  $('#login-screen').hidden = false;
}

$('#login-form').onsubmit = async (e) => {
  e.preventDefault();
  const fm = e.target.elements;
  try {
    saveSession(await api('/auth/login', { method: 'POST', body: { email: fm.email.value, password: fm.password.value } }));
    e.target.reset();
    showApp();
  } catch (err) { msg(err.message); }
};

$('#logout').onclick = async () => {
  try { await api('/auth/logout', { method: 'POST', body: { refreshToken: localStorage.getItem('refreshToken') } }); } catch {}
  clearSession();
  showLogin();
};

// refresh falhou => limpa a sessao e volta para o login
window.addEventListener('session-expired', () => { showLogin(); msg('Sessão expirada. Faça login novamente.'); });

// rota protegida: sem sessao, mostra login
if (localStorage.getItem('accessToken') && currentUser()) showApp(); else showLogin();
