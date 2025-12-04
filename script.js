
// Funções de máscara de input
function aplicarMascaras() {
  document.querySelectorAll('input[data-mask]').forEach(input => {
    input.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if(e.target.dataset.mask === 'cpf') {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if(e.target.dataset.mask === 'tel') {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\(\d{2}\) \d{5})(\d)/, '$1-$2');
      } else if(e.target.dataset.mask === 'data') {
        value = value.replace(/(\d{2})(\d)/, '$1/$2');
        value = value.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
      }
      e.target.value = value;
    });
  });
}

// Função de validação de CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/[\.\-]/g, '');
  if(cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for(let i=0;i<9;i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if(rev === 10 || rev === 11) rev = 0;
  if(rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for(let i=0;i<10;i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if(rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}

// Função para mostrar alertas
function mostrarAlerta(elementId, mensagem, tipo='erro') {
  const alerta = document.getElementById(elementId);
  alerta.textContent = mensagem;
  alerta.className = `alerta ${tipo}`;
  alerta.classList.remove('hidden');
  setTimeout(() => alerta.classList.add('hidden'), 4000);
}

// Função para salvar paciente
function salvarPaciente() {
  const nome = document.getElementById('nome').value;
  const idade = document.getElementById('idade').value;
  const cpf = document.getElementById('cpf').value;
  const nascimento = document.getElementById('nascimento').value;
  const endereco = document.getElementById('endereco').value;
  const telefone = document.getElementById('telefone').value;

  if(!validarCPF(cpf)) {
    mostrarAlerta('alertaCadastro', 'CPF inválido!');
    return;
  }

  let pacientes = JSON.parse(localStorage.getItem('pacientes') || '[]');
  const codigo = `PAC${String(pacientes.length + 1).padStart(4, '0')}`;

  pacientes.push({codigo, nome, idade, cpf, nascimento, endereco, telefone});
  localStorage.setItem('pacientes', JSON.stringify(pacientes));

  mostrarAlerta('alertaCadastro', `Paciente cadastrado com sucesso! Código: ${codigo}`, 'sucesso');
  setTimeout (()=>{
    document.getElementById('formCadastro').reset();
  },5000)
}

// Função para editar paciente
function editarPaciente() {
  const codigo = document.getElementById('codigoEditar').value;
  let pacientes = JSON.parse(localStorage.getItem('pacientes') || '[]');
  const paciente = pacientes.find(p => p.codigo === codigo);
  if(!paciente) {
    mostrarAlerta('alertaEdicao', 'Paciente não encontrado!');
    return;
  }
  paciente.nome = document.getElementById('nomeEditar').value;
  paciente.idade = document.getElementById('idadeEditar').value;
  paciente.cpf = document.getElementById('cpfEditar').value;
  paciente.nascimento = document.getElementById('nascimentoEditar').value;
  paciente.endereco = document.getElementById('enderecoEditar').value;
  paciente.telefone = document.getElementById('telefoneEditar').value;

  /* if(!validarCPF(paciente.cpf)) {
    mostrarAlerta('alertaEdicao', 'CPF inválido!');
    return;
  }*/

  localStorage.setItem('pacientes', JSON.stringify(pacientes));
  mostrarAlerta('alertaEdicao', 'Cadastro atualizado com sucesso!', 'sucesso');
}

// Função para agendar consulta/exame
function agendarConsulta() {
  const codigo = document.getElementById('codigo').value;
  const consulta = document.getElementById('consulta').value;
  const dataConsulta = document.getElementById('dataConsulta').value;
  const horaConsulta = document.getElementById('horaConsulta').value;
  const exame = document.getElementById('exame').value || 'Nenhum';
  const dataExame = document.getElementById('dataExame').value;
  const horaExame = document.getElementById('horaExame').value;

  let pacientes = JSON.parse(localStorage.getItem('pacientes') || '[]');
  if(!pacientes.find(p => p.codigo === codigo)) {
    mostrarAlerta('alertaAgendamento', 'Código de paciente não encontrado!');
    return;
  }

  let agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
  // Verifica conflito de consulta
  if(agendamentos.some(a => a.dataConsulta === dataConsulta && a.horaConsulta === horaConsulta)) {
    mostrarAlerta('alertaAgendamento', 'Horário da consulta já está ocupado!');
    return;
  }
  // Verifica conflito de exame
  if(exame !== 'Nenhum' && agendamentos.some(a => a.dataExame === dataExame && a.horaExame === horaExame)) {
    mostrarAlerta('alertaAgendamento', 'Horário do exame já está ocupado!');
    return;
  }

  agendamentos.push({codigo, consulta, dataConsulta, horaConsulta, exame, dataExame, horaExame});
  localStorage.setItem('agendamentos', JSON.stringify(agendamentos));

  mostrarAlerta('alertaAgendamento', 'Agendamento realizado com sucesso!', 'sucesso');
  document.getElementById('formAgendamento').reset();
}

// Função para ver histórico
function verHistorico() {
  const codigo = document.getElementById('codigoHist').value;
  if(codigo === "PAC45678") {
    window.location.href = "guerreiro.html";
  }
  const lista = document.getElementById('listaHistorico');
  const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
  const pacienteAgendamentos = agendamentos.filter(a => a.codigo === codigo);
  if(pacienteAgendamentos.length === 0) {
    lista.innerHTML = '<p>Nenhum histórico encontrado.</p>';
    return;
  }
  let html = '<ul>' + pacienteAgendamentos.map(a => `<li>Consulta: ${a.consulta} em ${a.dataConsulta} às ${a.horaConsulta}, Exame: ${a.exame} em ${a.dataExame || '-'} às ${a.horaExame || '-'} ${a.cancelado ? '<strong style="color:red"> — CANCELADA</strong>' : ''}</li>`).join('') + '</ul>';
  lista.innerHTML = html;
}


function listarAgendamentos() {
  const lista = document.getElementById('listaAgendamentos');
  if (!lista) return;
  const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
  
  const ativos = agendamentos.filter(a => !a.cancelado);
  if (ativos.length === 0) {
    lista.innerHTML = '<p>Nenhum agendamento.</p>';
    return;
  }
  let html = '<ul>' + ativos.map(a => `
      <li>
        Paciente: ${a.codigo} |
        Consulta: ${a.consulta} em ${a.dataConsulta} às ${a.horaConsulta} |
        Exame: ${a.exame} em ${a.dataExame || '-'} às ${a.horaExame || '-'}
      </li>
    `).join('') + '</ul>';
  lista.innerHTML = html;
}

// Função para cancelar agendamento
function cancelarAgendamento() {
  const codigo = document.getElementById('codigoCancel').value;
  const dataConsulta = document.getElementById('dataCancel').value;
  const horaConsulta = document.getElementById('horaCancel').value;
  let agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
  const index = agendamentos.findIndex(a =>
    a.codigo === codigo &&
    a.dataConsulta === dataConsulta &&
    a.horaConsulta === horaConsulta
  );
  if (index === -1) {
    mostrarAlerta("alertaCancelamento", "Agendamento não encontrado!");
    return;
  }
  // Marca agendamento como cancelado
  agendamentos[index].cancelado = true;
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  mostrarAlerta("alertaCancelamento", "Agendamento cancelado com sucesso!", "sucesso");
  listarAgendamentos();
}

//função para salvar mensagens de contato
function salvarMensagemContato() {
  const nome = document.getElementById("nome")?.value;
  const email = document.getElementById("email")?.value;
  const assunto = document.getElementById("assunto")?.value;
  const mensagem = document.getElementById("mensagem")?.value;
  if (!nome || !email || !assunto || !mensagem) return;
  let mensagens = JSON.parse(localStorage.getItem("mensagensContato") || "[]");
  mensagens.push({
    nome,
    email,
    assunto,
    mensagem,
    data: new Date().toLocaleDateString(),
    hora: new Date().toLocaleTimeString()
  });
  localStorage.setItem("mensagensContato", JSON.stringify(mensagens));
  const msgSucesso = document.getElementById("msgContato");
  if (msgSucesso) {
    msgSucesso.classList.remove("hidden");
    setTimeout(() => msgSucesso.classList.add("hidden"), 4000);
  }
  const form = document.getElementById("contatoForm");
  form?.reset();
  mostrarAlerta('alertaMensagem', 'Mensagem Enviada com sucesso.', 'sucesso');
}

// função para listar mensagens na caixa de entrada
function listarMensagens() {
const lista = document.getElementById("listaMensagens");
if (!lista) return;
const mensagens = JSON.parse(localStorage.getItem("mensagensContato") || "[]");

if (mensagens.length === 0) {
    lista.innerHTML = "<p>Nenhuma mensagem recebida.</p>";
    return;
}

lista.innerHTML = mensagens
    .map(m => `
    <div class="mensagem-card">
        <h3>${m.assunto}</h3>
        <p><strong>Nome:</strong> ${m.nome}</p>
        <p><strong>Email:</strong> ${m.email}</p>
        <p><strong>Mensagem:</strong> ${m.mensagem}</p>
        <p class="data-msg">Enviado em ${m.data} às ${m.hora}</p>
    </div>
    `)
    .join("");
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  aplicarMascaras();
  listarAgendamentos();
  listarMensagens();

  const formContato = document.getElementById("contatoForm");
  if (formContato) {
    formContato.addEventListener("submit", function (e) {
      e.preventDefault();
      salvarMensagemContato();
    });
  }
});