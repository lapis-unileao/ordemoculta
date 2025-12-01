// main.js
const SUPABASE_URL = 'https://fvyvpavacebbnrvpweob.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eXZwYXZhY2ViYm5ydnB3ZW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjQ1OTIsImV4cCI6MjA3NTAwMDU5Mn0.HnJvvl2kktm6_715B7BePy7trelrcvLAnfA2cNgnovc'
// --------------------------------------------------

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/* Helpers */
const $ = s => document.querySelector(s)
const $$ = s => Array.from(document.querySelectorAll(s))
const toastEl = () => $('#toast')
function showToast(text, ms = 3000) {
  const t = toastEl()
  if (!t) { console.info('Toast:', text); return }
  t.hidden = false; t.textContent = text
  clearTimeout(t._tm)
  t._tm = setTimeout(() => { t.hidden = true }, ms)
}
function setMsg(el, text, color=null) { 
  if (!el) return
  el.textContent = text || ''
  el.style.color = color || ''
  if (text && color) {
    if (color === 'green' || color === 'var(--success)') {
      el.style.borderLeftColor = 'var(--success)'
      el.style.background = '#ecfdf5'
    } else if (color === 'crimson' || color === 'var(--error)') {
      el.style.borderLeftColor = 'var(--error)'
      el.style.background = '#fef2f2'
    }
  }
}
function escapeHtml(s){ 
  if (s===null||s===undefined) return ''
  return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) 
}

/* Utilities */
function fmtDateISOToLocale(s) { 
  if(!s) return '-'
  const d=new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleString('pt-BR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
function fmtDateShort(s) {
  if(!s) return '-'
  const d=new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleDateString('pt-BR')
}
function cleanCPF(s){ return (s||'').replace(/\D/g,'') }
function validCPFbasic(s){ return cleanCPF(s).length === 11 }
function formatCPF(cpf) {
  const cleaned = cleanCPF(cpf)
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

/* ---------- LOGIN ---------- */
const loginForm = $('#loginForm')
if (loginForm) {
  const email = $('#email'), senha = $('#senha'), loginMsg = $('#loginMsg')
  loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    setMsg(loginMsg, '')
    const emailVal = email.value.trim(), senhaVal = senha.value.trim()
    if (!emailVal || !senhaVal) { 
      setMsg(loginMsg, 'Preencha e-mail e senha', 'var(--error)')
      return 
    }
    try {
      const { data, error } = await supabase.from('psicologos').select('*').eq('email', emailVal).eq('senha', senhaVal).single()
      if (error || !data) { 
        setMsg(loginMsg, 'E-mail ou senha incorretos', 'var(--error)')
        return 
      }
      localStorage.setItem('psicologo', JSON.stringify(data))
      setMsg(loginMsg, 'Autenticado – redirecionando...', 'var(--success)')
      showToast('Login efetuado com sucesso')
      setTimeout(()=> window.location.href = 'dashboard.html', 700)
    } catch (e) { 
      console.error('Login error', e)
      setMsg(loginMsg, 'Erro ao conectar (veja console)', 'var(--error)') 
    }
  })
}

/* ---------- CADASTRO PSICÓLOGO ---------- */
const cadForm = $('#cadForm')
if (cadForm) {
  const nome = $('#nome'), email = $('#email_cad'), senha = $('#senha_cad'), cadMsg = $('#cadMsg')
  cadForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    setMsg(cadMsg, '')
    const nomeVal = nome.value.trim(), emailVal = email.value.trim(), senhaVal = senha.value.trim()
    if (!nomeVal || !emailVal || !senhaVal) { 
      setMsg(cadMsg, 'Preencha todos os campos', 'var(--error)')
      return 
    }
    try {
      const payload = { nome: nomeVal, email: emailVal, senha: senhaVal, data: new Date().toISOString() }
      const { error } = await supabase.from('psicologos').insert([payload])
      if (error) { 
        console.error(error)
        setMsg(cadMsg, `Erro: ${error.message}`, 'var(--error)')
        return 
      }
      setMsg(cadMsg, 'Cadastrado com sucesso – redirecionando...', 'var(--success)')
      showToast('Cadastro realizado com sucesso')
      setTimeout(()=> window.location.href = 'index.html', 900)
    } catch (e) { 
      console.error('Cadastro psicologo error', e)
      setMsg(cadMsg, 'Erro inesperado', 'var(--error)') 
    }
  })
}

/* ---------- CADASTRO PACIENTE ---------- */
const pacienteForm = $('#pacienteForm')
if (pacienteForm) {
  const pNome = $('#p_nome'), pCpf = $('#p_cpf'), pGenero = $('#p_genero'), pIdade = $('#p_idade')
  const pacMsg = $('#pacMsg'), btnSalvar = $('#btnSalvarPaciente'), btnCancelar = $('#btnCancelar')
  
  btnCancelar?.addEventListener('click', () => { window.location.href = 'dashboard.html' })
  
  pacienteForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    setMsg(pacMsg, '')
    const nomeVal = pNome.value.trim(), cpfRaw = pCpf.value.trim(), cpf = cleanCPF(cpfRaw), generoVal = pGenero.value
    const idadeVal = Number(pIdade.value)
    
    if (!nomeVal || !cpf || !generoVal || !pIdade.value) { 
      setMsg(pacMsg, 'Preencha todos os campos obrigatórios.', 'var(--error)')
      return 
    }
    if (!validCPFbasic(cpf)) { 
      setMsg(pacMsg, 'CPF inválido (11 dígitos).', 'var(--error)')
      return 
    }
    if (isNaN(idadeVal) || idadeVal < 0 || idadeVal > 120) { 
      setMsg(pacMsg, 'Idade inválida.', 'var(--error)')
      return 
    }
    
    btnSalvar.disabled = true
    const originalText = btnSalvar.textContent
    btnSalvar.textContent = 'Salvando...'
    
    try {
      const { data: existing, error: errCheck } = await supabase.from('paciente').select('cpf').eq('cpf', cpf).limit(1).maybeSingle()
      if (errCheck) { 
        console.error(errCheck)
        setMsg(pacMsg, 'Erro ao verificar CPF (veja console)', 'var(--error)')
        btnSalvar.disabled=false
        btnSalvar.textContent=originalText
        return 
      }
      if (existing) { 
        setMsg(pacMsg, 'Já existe paciente com esse CPF.', 'var(--error)')
        btnSalvar.disabled=false
        btnSalvar.textContent=originalText
        return 
      }
      
      const payload = { nome: nomeVal, cpf, genero: generoVal, idade: idadeVal, data_cadastro: new Date().toISOString() }
      const { data: insertData, error: insertErr } = await supabase.from('paciente').insert([payload])
      if (insertErr) { 
        console.error(insertErr)
        setMsg(pacMsg, 'Erro ao salvar paciente: ' + (insertErr.message||''), 'var(--error)')
        btnSalvar.disabled=false
        btnSalvar.textContent=originalText
        return 
      }
      
      setMsg(pacMsg, 'Paciente cadastrado com sucesso.', 'var(--success)')
      showToast('Paciente salvo com sucesso')
      setTimeout(()=> window.location.href = 'dashboard.html', 900)
    } catch (e) { 
      console.error('Salvar paciente exception', e)
      setMsg(pacMsg, 'Erro inesperado (veja console)', 'var(--error)')
      btnSalvar.disabled=false
      btnSalvar.textContent=originalText
    }
  })
}

/* ---------- EDITAR PACIENTE ---------- */
const editarForm = $('#editarForm')
if (editarForm) {
  const pacienteId = $('#paciente_id')
  const eNome = $('#e_nome'), eCpf = $('#e_cpf'), eGenero = $('#e_genero'), eIdade = $('#e_idade')
  const editMsg = $('#editMsg'), btnSalvar = $('#btnSalvar'), btnCancelar = $('#btnCancelar'), btnExcluir = $('#btnExcluir')
  const deleteModal = $('#deleteModal'), deletePatientInfo = $('#deletePatientInfo')
  const btnConfirmarExclusao = $('#btnConfirmarExclusao'), btnCancelarExclusao = $('#btnCancelarExclusao')
  
  // Pegar o CPF da URL
  const urlParams = new URLSearchParams(window.location.search)
  const cpfParam = urlParams.get('cpf')
  
  if (!cpfParam) {
    setMsg(editMsg, 'CPF não fornecido. Redirecionando...', 'var(--error)')
    setTimeout(() => window.location.href = 'dashboard.html', 1500)
  } else {
    carregarPaciente(cpfParam)
  }
  
  async function carregarPaciente(cpf) {
    try {
      const { data, error } = await supabase.from('paciente').select('*').eq('cpf', cpf).single()
      if (error || !data) {
        setMsg(editMsg, 'Paciente não encontrado.', 'var(--error)')
        setTimeout(() => window.location.href = 'dashboard.html', 1500)
        return
      }
      
      pacienteId.value = data.id || ''
      eNome.value = data.nome || ''
      eCpf.value = formatCPF(data.cpf) || ''
      eGenero.value = data.genero || ''
      eIdade.value = data.idade || ''
      
      deletePatientInfo.textContent = `${data.nome} - CPF: ${formatCPF(data.cpf)}`
    } catch (e) {
      console.error('Erro ao carregar paciente:', e)
      setMsg(editMsg, 'Erro ao carregar dados.', 'var(--error)')
    }
  }
  
  btnCancelar?.addEventListener('click', () => { window.location.href = 'dashboard.html' })
  
  editarForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    setMsg(editMsg, '')
    
    const nomeVal = eNome.value.trim()
    const cpf = cleanCPF(eCpf.value)
    const generoVal = eGenero.value
    const idadeVal = Number(eIdade.value)
    
    if (!nomeVal || !generoVal || !eIdade.value) {
      setMsg(editMsg, 'Preencha todos os campos obrigatórios.', 'var(--error)')
      return
    }
    
    if (isNaN(idadeVal) || idadeVal < 0 || idadeVal > 120) {
      setMsg(editMsg, 'Idade inválida.', 'var(--error)')
      return
    }
    
    btnSalvar.disabled = true
    const originalText = btnSalvar.textContent
    btnSalvar.textContent = 'Salvando...'
    
    try {
      const payload = { nome: nomeVal, genero: generoVal, idade: idadeVal }
      const { error } = await supabase.from('paciente').update(payload).eq('cpf', cpf)
      
      if (error) {
        console.error(error)
        setMsg(editMsg, `Erro ao atualizar: ${error.message}`, 'var(--error)')
        btnSalvar.disabled = false
        btnSalvar.textContent = originalText
        return
      }
      
      setMsg(editMsg, 'Paciente atualizado com sucesso!', 'var(--success)')
      showToast('Alterações salvas')
      setTimeout(() => window.location.href = 'dashboard.html', 900)
    } catch (e) {
      console.error('Erro ao atualizar paciente:', e)
      setMsg(editMsg, 'Erro inesperado.', 'var(--error)')
      btnSalvar.disabled = false
      btnSalvar.textContent = originalText
    }
  })
  
  btnExcluir?.addEventListener('click', () => {
    deleteModal.hidden = false
    document.body.style.overflow = 'hidden'
  })
  
  btnCancelarExclusao?.addEventListener('click', () => {
    deleteModal.hidden = true
    document.body.style.overflow = ''
  })
  
  btnConfirmarExclusao?.addEventListener('click', async () => {
    const cpf = cleanCPF(eCpf.value)
    
    btnConfirmarExclusao.disabled = true
    const originalText = btnConfirmarExclusao.textContent
    btnConfirmarExclusao.textContent = 'Excluindo...'
    
    try {
      const { error } = await supabase.from('paciente').delete().eq('cpf', cpf)
      
      if (error) {
        console.error(error)
        showToast('Erro ao excluir paciente')
        btnConfirmarExclusao.disabled = false
        btnConfirmarExclusao.textContent = originalText
        return
      }
      
      showToast('Paciente excluído com sucesso')
      setTimeout(() => window.location.href = 'dashboard.html', 500)
    } catch (e) {
      console.error('Erro ao excluir:', e)
      showToast('Erro inesperado')
      btnConfirmarExclusao.disabled = false
      btnConfirmarExclusao.textContent = originalText
    }
  })
  
  deleteModal?.querySelector('.modal-overlay')?.addEventListener('click', () => {
    deleteModal.hidden = true
    document.body.style.overflow = ''
  })
}

/* ---------- FICHA DO PACIENTE ---------- */
if (window.location.pathname.includes('ficha_paciente.html')) {
  const urlParams = new URLSearchParams(window.location.search)
  const cpfParam = urlParams.get('cpf')
  
  if (!cpfParam) {
    showToast('CPF não fornecido')
    setTimeout(() => window.location.href = 'dashboard.html', 1500)
  } else {
    carregarFichaPaciente(cleanCPF(cpfParam))
  }
  
  // Tab switching
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab
      $$('.tab-btn').forEach(b => b.classList.remove('active'))
      $$('.tab-content').forEach(c => c.classList.remove('active'))
      btn.classList.add('active')
      $(`#tab-${targetTab}`)?.classList.add('active')
    })
  })
  
  // Editar paciente
  $('#btnEditarPaciente')?.addEventListener('click', () => {
    window.location.href = `editar_paciente.html?cpf=${encodeURIComponent(cpfParam)}`
  })
  
  async function carregarFichaPaciente(cpf) {
    try {
      // Carregar dados do paciente
      const { data: patient, error: patientError } = await supabase
        .from('paciente')
        .select('*')
        .eq('cpf', cpf)
        .single()
      
      if (patientError || !patient) {
        showToast('Paciente não encontrado')
        setTimeout(() => window.location.href = 'dashboard.html', 1500)
        return
      }
      
      // Preencher dados do paciente
      $('#patientName').textContent = patient.nome
      $('#patientAge').textContent = patient.idade || '-'
      $('#patientGender').textContent = patient.genero || '-'
      $('#patientCPF').textContent = formatCPF(patient.cpf)
      $('#patientDate').textContent = fmtDateShort(patient.data_cadastro)
      
      // Carregar dados dos jogos em paralelo
      Promise.all([
        carregarBrick(cpf),
        carregarFlexo(cpf),
        carregarMemoria(cpf)
      ])
    } catch (e) {
      console.error('Erro ao carregar ficha:', e)
      showToast('Erro ao carregar dados do paciente')
    }
  }
  
  async function carregarBrick(cpf) {
    try {
      const { data, error } = await supabase
        .from('brick')
        .select('data, tempo, pontuacao, vida_perdida')
        .eq('cpf', cpf)
        .order('data', { ascending: false })
      
      const tbody = $('#brickTable')
      if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="muted">Nenhuma partida registrada</td></tr>'
        $('#brickCount').textContent = '0'
        return
      }
      
      $('#brickCount').textContent = data.length
      tbody.innerHTML = data.map(row => `
        <tr>
          <td>${escapeHtml(fmtDateISOToLocale(row.data))}</td>
          <td>${escapeHtml(row.tempo ?? '-')}</td>
          <td>${escapeHtml(row.pontuacao ?? '-')}</td>
          <td>${escapeHtml(row.vida_perdida ?? '-')}</td>
        </tr>
      `).join('')
      
      window.APP._brickData = data
    } catch (e) {
      console.error('Erro ao carregar Brick:', e)
      $('#brickTable').innerHTML = '<tr><td colspan="4" class="muted">Erro ao carregar dados</td></tr>'
    }
  }
  
  async function carregarFlexo(cpf) {
    try {
      const { data, error } = await supabase
        .from('flexo')
        .select('data, tempo')
        .eq('cpf', cpf)
        .order('data', { ascending: false })
      
      const tbody = $('#flexoTable')
      if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="muted">Nenhuma partida registrada</td></tr>'
        $('#flexoCount').textContent = '0'
        return
      }
      
      $('#flexoCount').textContent = data.length
      tbody.innerHTML = data.map(row => `
        <tr>
          <td>${escapeHtml(fmtDateISOToLocale(row.data))}</td>
          <td>${escapeHtml(row.tempo ?? '-')}</td>
        </tr>
      `).join('')
      
      window.APP._flexoData = data
    } catch (e) {
      console.error('Erro ao carregar Flexo:', e)
      $('#flexoTable').innerHTML = '<tr><td colspan="2" class="muted">Erro ao carregar dados</td></tr>'
    }
  }
  
  async function carregarMemoria(cpf) {
    try {
      const { data, error } = await supabase
        .from('memoria')
        .select('data, pontuacao, tempo, cartas_erradas')
        .eq('cpf', cpf)
        .order('data', { ascending: false })
      
      const tbody = $('#memoriaTable')
      if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="muted">Nenhuma partida registrada</td></tr>'
        $('#memoriaCount').textContent = '0'
        return
      }
      
      $('#memoriaCount').textContent = data.length
      tbody.innerHTML = data.map(row => `
        <tr>
          <td>${escapeHtml(fmtDateISOToLocale(row.data))}</td>
          <td>${escapeHtml(row.pontuacao ?? '-')}</td>
          <td>${escapeHtml(row.tempo ?? '-')}</td>
          <td>${escapeHtml(row.cartas_erradas ?? '-')}</td>
        </tr>
      `).join('')
      
      window.APP._memoriaData = data
    } catch (e) {
      console.error('Erro ao carregar Memória:', e)
      $('#memoriaTable').innerHTML = '<tr><td colspan="4" class="muted">Erro ao carregar dados</td></tr>'
    }
  }
}

/* ---------- DASHBOARD ---------- */
const tblBody = $('#tblBody')
if (tblBody) {
  const greeting = $('#greeting'), btnLogout = $('#btnLogout'), btnRefresh = $('#btnRefresh'), search = $('#search'), filter = $('#filter'), pageSizeSelect = $('#pageSize'), pagination = $('#pagination')
  
  let psych = null
  try { psych = JSON.parse(localStorage.getItem('psicologo')) } catch(e){ psych = null }
  if (!psych) { 
    window.location.href = 'index.html' 
  } else { 
    if (greeting) greeting.textContent = `Dr(a). ${psych.nome}` 
  }

  $('#btnNovoPaciente')?.addEventListener('click', ()=> window.location.href = 'cadastro_paciente.html')
  $('#btnLogout')?.addEventListener('click', ()=> { 
    localStorage.removeItem('psicologo')
    showToast('Logout realizado')
    window.location.href = 'index.html' 
  })
  $('#btnRefresh')?.addEventListener('click', ()=> loadPatients(true))
  search?.addEventListener('keyup', (e)=> { if (e.key === 'Enter') doSearch() })
  filter?.addEventListener('change', doSearch)
  pageSizeSelect?.addEventListener('change', ()=> { 
    pageSize = Number(pageSizeSelect.value)
    page=1
    renderPage() 
  })

  let cache = [], page = 1, pageSize = Number(pageSizeSelect?.value || 10)

  async function loadPatients(force=false) {
    if (!force && cache.length) return renderPage()
    tblBody.innerHTML = `<tr><td colspan="6" class="muted">Carregando...</td></tr>`
    try {
      const { data, error } = await supabase.from('paciente').select('nome,cpf,genero,idade,data_cadastro').order('nome', { ascending: true })
      if (error) { 
        console.error(error)
        tblBody.innerHTML = `<tr><td colspan="6" class="muted">Erro: ${escapeHtml(error.message)}</td></tr>`
        return 
      }
      cache = data || []
      page = 1
      renderPage()
      showToast(`${cache.length} paciente(s) carregado(s)`)
    } catch (e) { 
      console.error('loadPatients error', e)
      tblBody.innerHTML = `<tr><td colspan="6" class="muted">Erro inesperado</td></tr>` 
    }
  }

  function doSearch() {
    const q = (search.value || '').trim().toLowerCase()
    const g = (filter.value || '')
    const filtered = cache.filter(p => {
      const matchQ = !q || (p.nome && p.nome.toLowerCase().includes(q)) || (p.cpf && String(p.cpf).includes(q))
      const matchG = !g || p.genero === g
      return matchQ && matchG
    })
    page = 1
    renderPage(filtered)
  }

  function renderPage(list = null) {
    const source = list || cache
    if (!source || source.length === 0) { 
      tblBody.innerHTML = `<tr><td colspan="6" class="muted">Nenhum paciente cadastrado</td></tr>`
      renderPagination(0)
      return 
    }
    const total = source.length
    const start = (page - 1) * pageSize
    const end = Math.min(start + pageSize, total)
    const pageItems = source.slice(start, end)
    
    tblBody.innerHTML = ''
    pageItems.forEach(p => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>
          <a href="ficha_paciente.html?cpf=${encodeURIComponent(p.cpf)}" class="patient-name-link">
            ${escapeHtml(p.nome)}
          </a>
        </td>
        <td>${escapeHtml(formatCPF(p.cpf))}</td>
        <td>${escapeHtml(p.genero)}</td>
        <td>${escapeHtml(p.idade ?? '-')}</td>
        <td>${escapeHtml(fmtDateISOToLocale(p.data_cadastro))}</td>
        <td>
          <button class="btn-icon" onclick="window.location.href='editar_paciente.html?cpf=${encodeURIComponent(p.cpf)}'" title="Editar paciente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </td>
      `
      tblBody.appendChild(tr)
    })
    renderPagination(total)
  }

  function renderPagination(total) {
    if (!pagination) return
    pagination.innerHTML = ''
    const pages = Math.max(1, Math.ceil(total / pageSize))
    
    const prev = document.createElement('button')
    prev.className='page-btn'
    prev.textContent='‹'
    prev.disabled = page <= 1
    prev.addEventListener('click', ()=> { page = Math.max(1, page-1); renderPage() })
    pagination.appendChild(prev)
    
    const visible = 7
    let start = Math.max(1, page - Math.floor(visible/2))
    let end = Math.min(pages, start + visible - 1)
    if (end - start + 1 < visible) start = Math.max(1, end - visible + 1)
    
    for (let i=start;i<=end;i++){ 
      const b = document.createElement('button')
      b.className='page-btn'
      b.textContent = i
      if (i===page) b.setAttribute('aria-current','true')
      b.addEventListener('click', ()=> { page = i; renderPage() })
      pagination.appendChild(b) 
    }
    
    const next = document.createElement('button')
    next.className='page-btn'
    next.textContent='›'
    next.disabled = page >= pages
    next.addEventListener('click', ()=> { page = Math.min(pages,page+1); renderPage() })
    pagination.appendChild(next)
  }

  loadPatients()
}

/* Global helpers */
window.APP = { 
  _brickData: [],
  _flexoData: [],
  _memoriaData: [],
  exportCSV: (rows, name) => { 
    try { 
      if(!rows||rows.length===0){ showToast('Nada para exportar'); return }
      const keys = Object.keys(rows[0])
      const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(','))).join('\n')
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url
      a.download=`${name||'export'}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showToast('CSV exportado com sucesso')
    } catch(e){ 
      console.error(e)
      showToast('Erro ao exportar CSV')
    } 
  },
  exportGameCSV: (game) => {
    let data = []
    let filename = ''
    
    if (game === 'brick' && window.APP._brickData) {
      data = window.APP._brickData
      filename = 'brick_break_historico'
    } else if (game === 'flexo' && window.APP._flexoData) {
      data = window.APP._flexoData
      filename = 'flexo_historico'
    } else if (game === 'memoria' && window.APP._memoriaData) {
      data = window.APP._memoriaData
      filename = 'memoria_historico'
    }
    
    if (data.length > 0) {
      window.APP.exportCSV(data, filename)
    } else {
      showToast('Nenhum dado para exportar')
    }
  }
}

$('#btnJogos')?.addEventListener('click', ()=> window.location.href = 'jogos.html')

/* End main.js */