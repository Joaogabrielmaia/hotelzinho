const el = (s, p = document) => p.querySelector(s)
const els = (s, p = document) => [...p.querySelectorAll(s)]
const storeKey = "alunos_v1"
const urlKey = "webapp_url"
const pwdKey = "settings_pwd"
const sessionKey = "app_session_ok"
const triesKey = "app_login_tries"
const blockKey = "app_login_block_until"

let alunos = []
let selectedId = null

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function load() { alunos = JSON.parse(localStorage.getItem(storeKey) || "[]") }
function save() { localStorage.setItem(storeKey, JSON.stringify(alunos)) }
function toast(m) { const t = el('#toast'); el('#toastMsg').textContent = m; bootstrap.Toast.getOrCreateInstance(t).show() }
function leftPad(n) { return n < 10 ? "0" + n : "" + n }
function formatDateISOToDMY(iso) { if (!iso) return ""; const d = new Date(iso); return `${leftPad(d.getDate())}-${leftPad(d.getMonth() + 1)}-${d.getFullYear()}` }
function formatNowDMYHM() { const d = new Date(); return `${leftPad(d.getDate())}-${leftPad(d.getMonth() + 1)}-${d.getFullYear()} ${leftPad(d.getHours())}:${leftPad(d.getMinutes())}` }

function resumir(a) { return { nome: a.criancaNome, pacote: a.pacote, pago: a.mensalidade === 'sim', resp: a.paiNome || a.maeNome } }
function card(a) {
  const pago = a.mensalidade === 'sim'
  const status = pago ? '<span class="aluno-status pago">Pago</span>' : '<span class="aluno-status pendente">Em aberto</span>'
  const ini = (a.criancaNome || '').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

  return `
  <div class="col-card col-12 col-md-6 col-xl-4">
    <div class="aluno-card">
      <div class="aluno-head">
        <div class="aluno-avatar">${ini}</div>
        <div>
          <h6 class="aluno-title">${a.criancaNome}</h6>
          <div class="aluno-meta">
            <span class="item"><i class="bi bi-cake2"></i> ${a.criancaNascimento || '-'}</span>
            <span class="item"><i class="bi bi-person"></i> Resp.: ${a.paiNome || a.maeNome || '-'}</span>
          </div>
        </div>
        <div class="text-end">
          <div class="aluno-chip"><i class="bi bi-box-seam"></i> ${(a.pacote || '-').toUpperCase()}</div>
          <div class="mt-2">${status}</div>
        </div>
      </div>
      <div class="aluno-actions">
        <button class="btn btn-sm btn-primary" data-id="${a.id}" data-action="ver"><i class="bi bi-eye"></i> Ver mais</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${a.id}" data-action="del"><i class="bi bi-x-circle"></i></button>
      </div>
    </div>
  </div>`
}

function render(list = alunos) { const q = el('#search').value?.toLowerCase() || ''; const f = list.filter(a => a.criancaNome.toLowerCase().includes(q)); el('#listaAlunos').innerHTML = f.map(card).join('') || '<div class="text-muted">Sem alunos cadastrados.</div>' }
function detalhes(a) {
  return `
<ul class="list-group">
<li class="list-group-item"><strong>Criança:</strong> ${a.criancaNome}</li>
<li class="list-group-item"><strong>Nascimento:</strong> ${a.criancaNascimento}</li>
<li class="list-group-item"><strong>Pacote:</strong> ${a.pacote}</li>
<li class="list-group-item"><strong>Mensalidade:</strong> ${a.mensalidade === 'sim' ? 'Sim' : 'Não'}</li>
<li class="list-group-item"><strong>Pai:</strong> ${a.paiNome}</li>
<li class="list-group-item"><strong>Mãe:</strong> ${a.maeNome}</li>
<li class="list-group-item"><strong>CPF:</strong> ${a.cpf}</li>
<li class="list-group-item"><strong>E-mail:</strong> ${a.email}</li>
<li class="list-group-item"><strong>Telefone:</strong> ${a.telefone}</li>
<li class="list-group-item"><strong>CEP:</strong> ${a.cep}</li>
<li class="list-group-item"><strong>Endereço:</strong> ${a.endereco}</li>
</ul>`}

function validarCPF(v) { const n = v.replace(/\D/g, ''); if (n.length !== 11) return false; let s = 0; for (let i = 0; i < 9; i++)s += parseInt(n[i]) * (10 - i); let d1 = 11 - (s % 11); d1 = d1 > 9 ? 0 : d1; s = 0; for (let i = 0; i < 10; i++)s += parseInt(n[i]) * (11 - i); let d2 = 11 - (s % 11); d2 = d2 > 9 ? 0 : d2; return d1 == n[9] && d2 == n[10] }
function toRow(a) { return { timestamp: formatNowDMYHM(), pai: a.paiNome, mae: a.maeNome, crianca: a.criancaNome, nascimento: formatDateISOToDMY(a.criancaNascimento), cpf: a.cpf, endereco: a.endereco, email: a.email, cep: a.cep, telefone: a.telefone, mensalidade: a.mensalidade, pacote: a.pacote } }

function maskCPFInput(elm) { let v = elm.value.replace(/\D/g, '').slice(0, 11); v = v.replace(/(\d{3})(\d)/, '$1.$2'); v = v.replace(/(\d{3})(\d)/, '$1.$2'); v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); elm.value = v }
function maskPhoneInput(elm) { let v = elm.value.replace(/\D/g, '').slice(0, 11); if (v.length >= 2) v = v.replace(/^(\d{2})(\d+)/, '$1 $2'); if (v.length > 7) v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2'); elm.value = v }
function maskCEPInput(elm) { let v = elm.value.replace(/\D/g, '').slice(0, 8); if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})$/, '$1-$2'); elm.value = v }

async function enviarParaSheet(a) { const url = localStorage.getItem(urlKey) || ''; if (!url) { toast('Configure a URL do Apps Script.'); return } const payload = JSON.stringify(toRow(a)); const body = new URLSearchParams(); body.append('payload', payload); try { const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }); const ct = res.headers.get('content-type') || ''; const txt = await res.text(); if (ct.includes('application/json')) { const j = JSON.parse(txt); if (j.ok) { toast('Enviado para a planilha.'); return } toast('Servidor respondeu com erro.'); return } toast('Resposta inesperada do servidor.') } catch (e) { toast('Falha ao enviar. Verifique a URL.') } }

function resetForm() { el('#formAluno').reset() }
function onSubmit(e) { e.preventDefault(); const a = { id: uid(), paiNome: el('#paiNome').value.trim(), maeNome: el('#maeNome').value.trim(), criancaNome: el('#criancaNome').value.trim(), criancaNascimento: el('#criancaNascimento').value, cpf: el('#cpf').value.trim(), endereco: el('#endereco').value.trim(), email: el('#email').value.trim(), cep: el('#cep').value.trim(), telefone: el('#telefone').value.trim(), mensalidade: el('#mensalidade').value, pacote: el('#pacote').value }; if (!a.criancaNome || !a.paiNome || !a.maeNome || !a.email) { toast('Preencha os campos obrigatórios.'); return } if (a.cpf && !validarCPF(a.cpf)) { toast('CPF inválido.'); return } alunos.push(a); save(); render(); resetForm(); toast('Aluno cadastrado.') }

function onListClick(e) { const btn = e.target.closest('button[data-action]'); if (!btn) return; const id = btn.dataset.id; const a = alunos.find(x => x.id === id); if (!a) return; const action = btn.dataset.action; if (action === 'ver') { selectedId = id; el('#detalhesConteudo').innerHTML = detalhes(a); bootstrap.Modal.getOrCreateInstance(el('#modalDetalhes')).show() } else if (action === 'del') { if (confirm('Remover cadastro?')) { alunos = alunos.filter(x => x.id !== id); save(); render(); toast('Removido.') } } }
function onSearch() { render() }
function limpar() { if (confirm('Apagar todos os dados?')) { alunos = []; save(); render(); toast('Tudo limpo.') } }

async function openSettings() {
  const saved = localStorage.getItem(pwdKey)
  const { value: pass } = await Swal.fire({ title: 'Senha necessária', input: 'password', inputLabel: 'Digite a senha para abrir Configurações', showCancelButton: true, confirmButtonText: 'Entrar', cancelButtonText: 'Cancelar' })
  if (!pass) return
  const hash = await sha256(pass)
  if (hash !== saved) { Swal.fire('Erro', 'Senha incorreta.', 'error'); return }
  el('#webAppUrl').value = localStorage.getItem(urlKey) || ''; bootstrap.Modal.getOrCreateInstance(el('#modalSettings')).show()
}
function saveSettings() { localStorage.setItem(urlKey, el('#webAppUrl').value.trim()); toast('Configurações salvas.') }

async function sha256(str) { const enc = new TextEncoder().encode(str); const buf = await crypto.subtle.digest('SHA-256', enc); const arr = [...new Uint8Array(buf)]; return arr.map(b => b.toString(16).padStart(2, '0')).join('') }

async function requireAccess() {
  const defaultPwd = 'Adm1n@hotelzinho'
  if (!localStorage.getItem(pwdKey)) { const defaultHash = await sha256(defaultPwd); localStorage.setItem(pwdKey, defaultHash) }
  if (sessionStorage.getItem(sessionKey) === '1') return
  const now = Date.now()
  const blockUntil = parseInt(localStorage.getItem(blockKey) || '0', 10)
  if (now < blockUntil) { const wait = Math.ceil((blockUntil - now) / 1000); await Swal.fire('Acesso bloqueado', `Tente novamente em ${wait}s`, 'error'); return requireAccess() }
  const saved = localStorage.getItem(pwdKey)
  let tries = parseInt(localStorage.getItem(triesKey) || '0', 10)
  while (true) {
    const { value: pass } = await Swal.fire({ title: 'Acesso ao sistema', input: 'password', inputLabel: 'Digite a senha', showCancelButton: false, confirmButtonText: 'Entrar' })
    if (!pass) continue
    const hash = await sha256(pass)
    if (hash === saved) { sessionStorage.setItem(sessionKey, '1'); localStorage.setItem(triesKey, '0'); break }
    tries++; localStorage.setItem(triesKey, String(tries))
    if (tries >= 3) { localStorage.setItem(blockKey, String(Date.now() + 30_000)); localStorage.setItem(triesKey, '0'); await Swal.fire('Bloqueado', 'Muitas tentativas. Aguarde 30s.', 'error'); return requireAccess() }
    await Swal.fire('Erro', 'Senha incorreta.', 'error')
  }
}

function logout() { sessionStorage.removeItem(sessionKey); Swal.fire('Ok', 'Sessão encerrada.', 'success').then(() => location.reload()) }
function enviarAtual() { const a = alunos.find(x => x.id === selectedId); if (a) enviarParaSheet(a) }

document.addEventListener('DOMContentLoaded', async () => {
  await requireAccess()
  load(); render()
  el('#formAluno').addEventListener('submit', onSubmit)
  el('#listaAlunos').addEventListener('click', onListClick)
  el('#search').addEventListener('input', onSearch)
  el('#btnClear')?.addEventListener('click', limpar)
  el('#btnOpenSettings')?.addEventListener('click', openSettings)
  el('#btnSaveSettings')?.addEventListener('click', saveSettings)
  el('#btnEnviarSheet')?.addEventListener('click', enviarAtual)
  el('#btnLogout')?.addEventListener('click', logout)
  el('#cpf').addEventListener('input', e => maskCPFInput(e.target))
  el('#telefone').addEventListener('input', e => maskPhoneInput(e.target))
  el('#cep').addEventListener('input', e => maskCEPInput(e.target))
})


function initials(name) {
  const p = (name || '').trim().split(/\s+/)
  return (p[0]?.[0] || '').toUpperCase() + (p[1]?.[0] || '').toUpperCase()
}

function card(a) {
  const pago = a.mensalidade === 'sim'
  const status = pago
    ? '<span class="aluno-status pago">Pago</span>'
    : '<span class="aluno-status pendente">Em aberto</span>'

  return `
  <div class="col-12">
    <div class="aluno-card">
      <div class="aluno-head">
        <div class="aluno-avatar">${initials(a.criancaNome)}</div>
        <div>
          <h6 class="aluno-title">${a.criancaNome}</h6>
          <div class="aluno-meta">
            <span class="item"><i class="bi bi-cake2"></i> ${a.criancaNascimento || '-'}</span>
            <span class="item"><i class="bi bi-person-badge"></i> Resp.: ${a.paiNome || a.maeNome || '-'}</span>
          </div>
        </div>
        <div class="text-end">
          <div class="aluno-chip"><i class="bi bi-box-seam"></i> ${a.pacote?.toUpperCase() || '-'}</div>
          <div class="mt-2">${status}</div>
        </div>
      </div>

      <div class="d-flex justify-content-end aluno-actions">
        <button class="btn btn-sm btn-primary" data-id="${a.id}" data-action="ver">
          <i class="bi bi-eye"></i> Ver mais
        </button>
        <button class="btn btn-sm btn-outline-danger" data-id="${a.id}" data-action="del">
          <i class="bi bi-x-circle"></i>
        </button>
      </div>
    </div>
  </div>`
}

function detalhes(a) {
  const pago = a.mensalidade === 'sim'
  const status = pago
    ? '<span class="aluno-status pago">Pago</span>'
    : '<span class="aluno-status pendente">Em aberto</span>'

  return `
  <div class="ficha">
    <div class="ficha-head">
      <div class="ficha-avatar">${initials(a.criancaNome)}</div>
      <div>
        <h5 class="ficha-title">${a.criancaNome}</h5>
        <div class="ficha-sub">Nascimento: <strong>${a.criancaNascimento || '-'}</strong></div>
      </div>
      <div class="text-end">
        <div class="ficha-tags">
          <span class="ficha-tag"><i class="bi bi-box-seam"></i> ${a.pacote?.toUpperCase() || '-'}</span>
          ${status}
        </div>
      </div>
    </div>

    <div class="ficha-body">
      <div class="ficha-grid">
        <div class="ficha-item">
          <div class="label">Pai</div>
          <div class="value"><i class="bi bi-person"></i> ${a.paiNome || '-'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Mãe</div>
          <div class="value"><i class="bi bi-person"></i> ${a.maeNome || '-'}</div>
        </div>

        <div class="ficha-item">
          <div class="label">CPF</div>
          <div class="value"><i class="bi bi-file-earmark-text"></i> ${a.cpf || '-'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">E-mail</div>
          <div class="value"><i class="bi bi-envelope"></i> ${a.email || '-'}</div>
        </div>

        <div class="ficha-item">
          <div class="label">Telefone</div>
          <div class="value"><i class="bi bi-telephone"></i> ${a.telefone || '-'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">CEP</div>
          <div class="value"><i class="bi bi-geo-alt"></i> ${a.cep || '-'}</div>
        </div>

        <div class="ficha-item" style="grid-column: 1 / -1;">
          <div class="label">Endereço</div>
          <div class="value"><i class="bi bi-house"></i> ${a.endereco || '-'}</div>
        </div>
      </div>
    </div>
  </div>`
}
