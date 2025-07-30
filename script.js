const API_URL = 'http://localhost:5000';
const fetchOpts = {
  mode: 'cors',
  headers: { 'Content-Type': 'application/json' }
};

let currentUser = null;
let editingManutencaoId = null; // <— controla se estamos editando manutenção
let editingUsuarioId = null; // <— controla se estamos editando um usuário

// Ativa fundo com wallpaper ao carregar
document.body.classList.add('login-active');

// LOGIN
const loginBtn = document.getElementById('login-btn');
loginBtn.addEventListener('click', async () => {
  const usuario = document.getElementById('login-usuario').value;
  const senha = document.getElementById('login-senha').value;

  const res = await fetch(`${API_URL}/login`, {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify({ usuario, senha })
  });
  const result = await res.json();

  if (res.ok) {
    currentUser = result;

    // Remove wallpaper ao logar
    document.body.classList.remove('login-active');

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('user-welcome').innerText = `Olá, ${result.nome_completo}`;

    if (usuario === 'admin') {
      document.getElementById('admin-screen').classList.remove('hidden');
      loadUsuarios();
      bindUsuarioForm();
    } else {
      document.getElementById('user-screen').classList.remove('hidden');
      buildManutencaoForm();
      loadManutencoes();
    }
  } else {
    document.getElementById('login-erro').innerText = result.error || 'Erro no login';
  }
});

function bindUsuarioForm() {
  const form = document.getElementById('usuario-form');
  const submitBtn = document.querySelector('#usuario-form button[type="submit"]');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      nome_completo: document.getElementById('nome_completo').value,
      usuario: document.getElementById('usuario').value,
      senha: document.getElementById('senha').value
    };

    if (editingUsuarioId) {
      // Atualizar usuário existente
      await fetch(`${API_URL}/usuarios/${editingUsuarioId}`, {
        ...fetchOpts,
        method: 'PUT',
        body: JSON.stringify({
          nome_completo: payload.nome_completo,
          usuario: payload.usuario
        })
      });
      editingUsuarioId = null;
      submitBtn.textContent = 'Cadastrar'; // voltar para o texto padrão
      
      // Resetar estilo do botão para padrão
      submitBtn.style.backgroundColor = '';
      submitBtn.style.color = '';
      submitBtn.style.border = '';
    } else {
      // Criar novo usuário
      await fetch(`${API_URL}/register`, {
        ...fetchOpts,
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    loadUsuarios();
    form.reset();
  });
}

async function loadUsuarios() {
  const res = await fetch(`${API_URL}/usuarios`, fetchOpts);
  const data = await res.json();
  const ul = document.getElementById('usuarios-list');
  ul.innerHTML = '';
  data.forEach(user => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button onclick="editUsuario(${user.id}, '${user.nome_completo}', '${user.usuario}')">✏️</button>
      ID ${user.id} - ${user.nome_completo} (${user.usuario})
      <button onclick="viewManutencoesPorUsuario(${user.id}, this)">Ver</button>
      <div id="manutencoes-user-${user.id}" class="hidden" style="margin-top: 10px;"></div>
    `;
    ul.appendChild(li);
  });
}

function editUsuario(id, nome, usuario) {
  document.getElementById('nome_completo').value = nome;
  document.getElementById('usuario').value = usuario;
  document.getElementById('senha').value = '*****';
  editingUsuarioId = id;
  const submitBtn = document.querySelector('#usuario-form button[type="submit"]');
  submitBtn.textContent = 'Atualizar';

  // Aplica estilo verde no botão Atualizar
  submitBtn.style.backgroundColor = '#28a745';
  submitBtn.style.color = '#fff';
  submitBtn.style.border = '1px solid #28a745';
}

function buildManutencaoForm() {
  const form = document.getElementById('manutencao-form');
  form.innerHTML = `
    <select id="tipo">
      <option disabled selected value="">Selecione o tipo de Manutenção</option>
      <option>Troca de Óleo</option>
      <option>Troca de Filtro de Óleo</option>
      <option>Troca de Filtro de Ar</option>
      <option>Troca de Filtro de Combustível</option>
      <option>Troca de Velas</option>
      <option>Troca de Bateria</option>
      <option>Alinhamento e Balanceamento</option>
      <option>Verificação dos Freios</option>
      <option>Substituição de Correia Dentada</option>
      <option>Troca de Fluido de Freio</option>
      <option>Troca de Fluido de Arrefecimento</option>
      <option>Inspeção Geral</option>
      <option>Outro (especificar)</option>
    </select>
    <div id="tipo-custom" class="hidden">
      <input type="text" id="tipo_manual" placeholder="Descreva o tipo de Manutenção"/>
    </div>
    <input type="number" id="km_atual" placeholder="KM atual" required/>
    <input type="date" id="data" required/>
    <input type="text" id="observacoes" placeholder="Observações"/>
    <input type="number" id="proxima_km" placeholder="Próxima troca (KM)" required/>
    <button type="submit">Salvar</button>
  `;

  document.getElementById('tipo').addEventListener('change', () => {
    document.getElementById('tipo-custom').classList.toggle(
      'hidden',
      document.getElementById('tipo').value !== 'Outro (especificar)'
    );
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const tipo = document.getElementById('tipo').value === 'Outro (especificar)'
      ? document.getElementById('tipo_manual').value
      : document.getElementById('tipo').value;

    const payload = {
      usuario_id: currentUser.usuario_id,
      tipo,
      km_atual: parseInt(document.getElementById('km_atual').value),
      data: document.getElementById('data').value,
      observacoes: document.getElementById('observacoes').value,
      proxima_km: parseInt(document.getElementById('proxima_km').value)
    };

    const submitBtn = document.querySelector('#manutencao-form button[type="submit"]');

    if (editingManutencaoId) {
      await fetch(`${API_URL}/manutencao/${editingManutencaoId}`, {
        ...fetchOpts,
        method: 'PUT',
        body: JSON.stringify({ ...payload, usuario_id: currentUser.usuario_id })
      });
      editingManutencaoId = null;

      // Resetar texto e estilo do botão para padrão após atualizar
      submitBtn.textContent = 'Salvar';
      submitBtn.style.backgroundColor = '';
      submitBtn.style.color = '';
      submitBtn.style.border = '';
    } else {
      await fetch(`${API_URL}/manutencao`, {
        ...fetchOpts,
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    loadManutencoes();
    form.reset();
    document.getElementById('tipo-custom').classList.add('hidden');
  });
}

async function loadManutencoes() {
  const res = await fetch(`${API_URL}/manutencoes`, fetchOpts);
  const data = await res.json();
  const container = document.getElementById('manutencoes');
  container.innerHTML = '';

  data
    .filter(m => m.usuario_id === currentUser.usuario_id)
    .forEach(m => {
      const div = document.createElement('div');
      div.innerHTML = `
        <strong>
          <i class="fa-solid ${getIconClass(m.tipo)}" style="font-size: 1.5rem; margin-right: 5px;"></i>
          ${m.data}
        </strong> - ${m.tipo} - ${m.km_atual} km<br/>
        <small>${m.observacoes || ''}</small><br/>
        <button onclick="editManutencao(${m.id})">Editar</button>
        <button onclick="deleteManutencao(${m.id})">Excluir</button>
        ${currentUser.usuario === 'admin' ? `<button onclick="viewHistorico(${m.id}, this)">Ver Histórico</button>` : ''}
        <div class="historico hidden" id="historico-${m.id}"></div>
      `;
      container.appendChild(div);
    });
}

async function editManutencao(id) {
  const res = await fetch(`${API_URL}/manutencao/${id}`, fetchOpts);
  const m = await res.json();
  document.getElementById('km_atual').value = m.km_atual;
  document.getElementById('data').value = m.data;
  document.getElementById('observacoes').value = m.observacoes;
  document.getElementById('proxima_km').value = m.proxima_km;
  const tipoSelect = document.getElementById('tipo');
  if ([...tipoSelect.options].some(opt => opt.value === m.tipo)) {
    tipoSelect.value = m.tipo;
  } else {
    tipoSelect.value = 'Outro (especificar)';
    document.getElementById('tipo-custom').classList.remove('hidden');
    document.getElementById('tipo_manual').value = m.tipo;
  }
  editingManutencaoId = id;

  const submitBtn = document.querySelector('#manutencao-form button[type="submit"]');
  submitBtn.textContent = 'Atualizar';

  // Aplica estilo verde no botão Atualizar
  submitBtn.style.backgroundColor = '#28a745';
  submitBtn.style.color = '#fff';
  submitBtn.style.border = '1px solid #28a745';
}

async function deleteManutencao(id) {
  if (confirm('Deseja realmente excluir esta manutenção?')) {
    await fetch(`${API_URL}/manutencao/${id}`, {
      ...fetchOpts,
      method: 'DELETE',
      body: JSON.stringify({ usuario_id: currentUser.usuario_id })
    });
    loadManutencoes();
  }
}

function getIconClass(tipo) {
  const icons = {
    "Troca de Óleo": "fa-oil-can",
    "Troca de Filtro de Óleo": "fa-filter",
    "Troca de Filtro de Ar": "fa-wind",
    "Troca de Filtro de Combustível": "fa-gas-pump",
    "Troca de Velas": "fa-bolt",
    "Troca de Bateria": "fa-car-battery",
    "Alinhamento e Balanceamento": "fa-ruler-combined",
    "Verificação dos Freios": "fa-warning",
    "Substituição de Correia Dentada": "fa-gear",
    "Troca de Fluido de Freio": "fa-droplet",
    "Troca de Fluido de Arrefecimento": "fa-temperature-full",
    "Inspeção Geral": "fa-list-check"
  };
  return icons[tipo] || "fa-toolbox";
}

// Função adicionada para funcionar o botão "Ver" nas manutenções do usuário:
async function viewManutencoesPorUsuario(userId, btn) {
  const container = document.getElementById(`manutencoes-user-${userId}`);

  if (!container) return;

  // Toggle: se está visível, esconde e reseta
  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    btn.innerText = 'Ver';
    container.innerHTML = '';
    return;
  }

  btn.innerText = 'Ocultar';

  const res = await fetch(`${API_URL}/manutencoes`, fetchOpts);
  const data = await res.json();

  // Filtra manutenções daquele usuário
  const manutencoesUsuario = data.filter(m => m.usuario_id === userId);

  if (manutencoesUsuario.length === 0) {
    container.innerHTML = '<em>Nenhuma manutenção encontrada.</em>';
  } else {
    container.innerHTML = '';
    manutencoesUsuario.forEach(m => {
      const div = document.createElement('div');
      div.innerHTML = `
        <strong>
          <i class="fa-solid ${getIconClass(m.tipo)}" style="font-size: 1.2rem; margin-right: 5px;"></i>
          ${m.data}
        </strong> - ${m.tipo} - ${m.km_atual} km<br/>
        <small>${m.observacoes || ''}</small>
      `;
      container.appendChild(div);
    });
  }

  container.classList.remove('hidden');
}
