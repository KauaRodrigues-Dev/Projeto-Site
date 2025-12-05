// Funções de máscara de input
function aplicarMascaras() {
  document.querySelectorAll("input[data-mask]").forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (e.target.dataset.mask === "cpf") {
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
        value = value.replace(
          /(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
          "$1.$2.$3-$4"
        );
      } else if (e.target.dataset.mask === "tel") {
        value = value.replace(/(\d{2})(\d)/, "($1) $2");
        value = value.replace(/(\(\d{2}\) \d{5})(\d)/, "$1-$2");
      } else if (e.target.dataset.mask === "data") {
        value = value.replace(/(\d{2})(\d)/, "$1/$2");
        value = value.replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
      }
      e.target.value = value;
    });
  });
}

// Função de validação de CPF (mantida)
function validarCPF(cpf) {
  cpf = (cpf || "").replace(/[\.\-]/g, "");
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}

// Função para calcular Date a partir de "DD/MM/YYYY", retorna null se inválida
function parseDateDMY(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  const dt = new Date(y, m, d);
  if (
    dt &&
    dt.getFullYear() === y &&
    dt.getMonth() === m &&
    dt.getDate() === d
  ) {
    return dt;
  }
  return null;
}

// Popup global (cria elemento temporário no DOM)
function mostrarPopupGlobal(texto, tempo = 3000) {
  // se já existir um popup global, remove antes
  const existing = document.querySelector(".popup-msg.temp");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.className = "popup-msg temp";
  popup.textContent = texto;
  document.body.appendChild(popup);

  // força reflow para animação (se houver)
  window.getComputedStyle(popup).opacity;

  setTimeout(() => {
    popup.style.opacity = "0";
  }, tempo - 500);

  setTimeout(() => {
    popup.remove();
  }, tempo);
}

// Wrappers compatíveis com nomes antigos
function mostrarPopup(mensagem) {
  mostrarPopupGlobal(mensagem || "Ação concluída!");
}
function mostrarPopupMarcar(mensagem) {
  mostrarPopupGlobal(mensagem || "Agendamento realizado com sucesso!");
}
function mostrarPopupEdicao(mensagem) {
  mostrarPopupGlobal(mensagem || "Cadastro atualizado com sucesso!");
}
function mostrarPopupCodigo(mensagem) {
  mostrarPopupGlobal(mensagem || "Código gerado!");
}
function mostrarPopupPACNA(mensagem) {
  mostrarPopupGlobal(mensagem || "Paciente não encontrado!");
}
function mostrarPopupVFCS(mensagem) {
  mostrarPopupGlobal(mensagem || "Horário da consulta já está ocupado!");
}
function mostrarPopupDATA(mensagem) {
  mostrarPopupGlobal(mensagem || "Data inválida!");
}

// Função para mostrar alertas inline (mantida)
function mostrarAlerta(elementId, mensagem, tipo = "erro") {
  const alerta = document.getElementById(elementId);
  if (!alerta) {
    // fallback para popup
    mostrarPopupGlobal(mensagem);
    return;
  }
  alerta.textContent = mensagem;
  alerta.className = `alerta ${tipo}`;
  alerta.classList.remove("hidden");
  setTimeout(() => alerta.classList.add("hidden"), 4000);
}

// Valida se data de nascimento confere com a idade informada
function validarIdade(dataNascStr, idadeInformada) {
  if (!dataNascStr || !idadeInformada) return false;
  const hoje = new Date();
  const nasc = parseDateDMY(dataNascStr);
  if (!nasc) return false;

  let idadeCalculada = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idadeCalculada--;
  }
  return idadeCalculada === parseInt(idadeInformada, 10);
}

// Função para salvar paciente (com validação de idade)
function salvarPaciente() {
  const nome = document.getElementById("nome")?.value?.trim();
  const idade = document.getElementById("idade")?.value?.trim();
  const cpf = document.getElementById("cpf")?.value?.trim();
  const nascimento = document.getElementById("nascimento")?.value?.trim();
  const endereco = document.getElementById("endereco")?.value?.trim();
  const telefone = document.getElementById("telefone")?.value?.trim();

  if (!nome || !idade || !cpf || !nascimento) {
    mostrarPopupGlobal("Preencha os campos obrigatórios.");
    return;
  }

  if (!validarCPF(cpf)) {
    mostrarAlerta("alertaCadastro", "CPF inválido!");
    return;
  }

  if (!validarIdade(nascimento, idade)) {
    mostrarPopupGlobal("Idade não confere com a data de nascimento!");
    return;
  }

  let pacientes = JSON.parse(localStorage.getItem("pacientes") || "[]");
  const codigo = `PAC${String(pacientes.length + 1).padStart(4, "0")}`;

  pacientes.push({ codigo, nome, idade, cpf, nascimento, endereco, telefone });
  localStorage.setItem("pacientes", JSON.stringify(pacientes));

  mostrarPopupCodigo(`Paciente cadastrado! Código gerado: ${codigo}`);
  const form = document.getElementById("formCadastro");
  if (form) form.reset();
}

// Função para editar paciente
function editarPaciente() {
  const codigo = document.getElementById("codigoEditar")?.value?.trim();
  if (!codigo) {
    mostrarPopupGlobal("Digite o código do paciente.");
    return;
  }
  let pacientes = JSON.parse(localStorage.getItem("pacientes") || "[]");
  const paciente = pacientes.find((p) => p.codigo === codigo);
  if (!paciente) {
    mostrarPopupPACNA("Paciente não encontrado!");
    return;
  }

  paciente.nome = document.getElementById("nomeEditar")?.value?.trim();
  paciente.idade = document.getElementById("idadeEditar")?.value?.trim();
  paciente.cpf = document.getElementById("cpfEditar")?.value?.trim();
  paciente.nascimento = document
    .getElementById("nascimentoEditar")
    ?.value?.trim();
  paciente.endereco = document.getElementById("enderecoEditar")?.value?.trim();
  paciente.telefone = document.getElementById("telefoneEditar")?.value?.trim();

  if (!validarCPF(paciente.cpf)) {
    mostrarAlerta("alertaEdicao", "CPF inválido!");
    return;
  }

  if (!validarIdade(paciente.nascimento, paciente.idade)) {
    mostrarPopupGlobal("Idade não confere com a data de nascimento!");
    return;
  }

  localStorage.setItem("pacientes", JSON.stringify(pacientes));
  mostrarPopupEdicao("Cadastro atualizado com sucesso!");
}

// Função para agendar consulta/exame
function agendarConsulta() {
  const codigo = document.getElementById("codigo")?.value?.trim();
  const consulta = document.getElementById("consulta")?.value;
  const dataConsulta = document.getElementById("dataConsulta")?.value?.trim();
  const horaConsulta = document.getElementById("horaConsulta")?.value;
  const exameRaw = document.getElementById("exame")?.value?.trim();
  const exame =
    exameRaw && exameRaw.toLowerCase() !== "nenhum" ? exameRaw : "N/A";
  const dataExame = document.getElementById("dataExame")?.value?.trim();
  const horaExame = document.getElementById("horaExame")?.value;

  if (!codigo || !consulta || !dataConsulta || !horaConsulta) {
    mostrarPopupGlobal("Preencha Código, Tipo de Consulta, Data e Hora.");
    return;
  }

  // valida paciente existente
  let pacientes = JSON.parse(localStorage.getItem("pacientes") || "[]");
  const paciente = pacientes.find((p) => p.codigo === codigo);
  if (!paciente) {
    mostrarPopupPACNA("Código de paciente não encontrado!");
    return;
  }

  // valida data de consulta (não permitir passado)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataMarcada = parseDateDMY(dataConsulta);
  if (!dataMarcada) {
    mostrarPopupDATA("Data da consulta inválida (use DD/MM/AAAA).");
    return;
  }
  if (dataMarcada < hoje) {
    mostrarPopupPassado(
      "Quem disse que voce pode voltar no passado? (arruma essa data)"
    );
    return;
  }

  // Confere conflitos de consulta/exame
  let agendamentos = JSON.parse(localStorage.getItem("agendamentos") || "[]");

  if (
    agendamentos.some(
      (a) =>
        a.dataConsulta === dataConsulta &&
        a.horaConsulta === horaConsulta &&
        !a.cancelado
    )
  ) {
    mostrarPopupVFCS("Horário da consulta já está ocupado!");
    return;
  }

  if (exame !== "N/A" && dataExame) {
    const dataEx = parseDateDMY(dataExame);
    if (!dataEx) {
      mostrarPopupDATA("Data do exame inválida (use DD/MM/AAAA).");
      return;
    }
    if (
      agendamentos.some(
        (a) =>
          a.dataExame === dataExame && a.horaExame === horaExame && !a.cancelado
      )
    ) {
      mostrarPopupGlobal("Horário do exame já está ocupado!");
      return;
    }
  }

  // salva
  agendamentos.push({
    codigo,
    consulta,
    dataConsulta,
    horaConsulta,
    exame,
    dataExame: dataExame || "-",
    horaExame: horaExame || "-",
  });
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

  mostrarPopupMarcar("Agendamento realizado com sucesso!");
  const form = document.getElementById("formAgendamento");
  if (form) form.reset();

  listarAgendamentos(); // atualiza lista imediatamente

  mostrarCheck(); // mostra check animado
  document.getElementById("formAgendamento").reset();
}

// Função para ver histórico (mantida)
function verHistorico() {
  const codigo = document.getElementById("codigoHist")?.value?.trim();
  if (codigo === "PAC45678") {
    window.location.href = "guerreiro.html";
    return;
  }
  const lista = document.getElementById("listaHistorico");
  const agendamentos = JSON.parse(localStorage.getItem("agendamentos") || "[]");
  const pacienteAgendamentos = agendamentos.filter((a) => a.codigo === codigo);
  if (pacienteAgendamentos.length === 0) {
    lista.innerHTML = "<p>Nenhum histórico encontrado.</p>";
    return;
  }
  let html =
    "<ul>" +
    pacienteAgendamentos
      .map(
        (a) =>
          `<li>Consulta: ${a.consulta} em ${a.dataConsulta} às ${
            a.horaConsulta
          }, Exame: ${a.exame} ${
            a.cancelado ? '<strong style="color:red"> — CANCELADA</strong>' : ""
          }</li>`
      )
      .join("") +
    "</ul>";
  lista.innerHTML = html;
}

// Função para listar agendamentos (render em cards)
function listarAgendamentos() {
  const lista = document.getElementById("listaAgendamentos");
  if (!lista) return;
  const agendamentos = JSON.parse(localStorage.getItem("agendamentos") || "[]");

  const ativos = agendamentos.filter((a) => !a.cancelado);
  if (ativos.length === 0) {
    lista.innerHTML = "<p>Nenhum agendamento.</p>";
    return;
  }

  let html = ativos
    .map((a) => {
      const exameTexto =
        !a.exame || a.exame === "Nenhum" || a.exame === "N/A" ? "N/A" : a.exame;

      return `
      <div class="card-agendamento">

        <div class="card-row">
          <strong>Paciente:</strong> ${a.codigo}
          <button class="btn small" style="margin-left:10px;"
            onclick="cancelarAgendamentoDirect('${a.codigo}','${
        a.dataConsulta
      }','${a.horaConsulta}')">
            Cancelar Consulta
          </button>
        </div>

        <div><strong>Consulta:</strong> ${a.consulta} — ${a.dataConsulta} às ${
        a.horaConsulta
      }</div>

        <div>
          <strong>Exame:</strong> ${exameTexto}
          ${
            a.dataExame && a.dataExame !== "-"
              ? ` — ${a.dataExame} às ${a.horaExame || "-"}`
              : ""
          }

          ${
            exameTexto !== "N/A"
              ? `
            <button class="btn small" style="margin-left:70px;"
    onclick="cancelarExame('${a.codigo}', '${a.dataExame}', '${a.horaExame}')">
  Cancelar Exame
</button>

          `
              : ""
          }
      </div>

      </div>
    `;
    })
    .join("");

  lista.innerHTML = html;
}
/* ===== Cancelamento direto (consulta e exame) ===== */
function cancelarAgendamentoDirect(
  codigo,
  dataConsulta,
  horaConsulta,
  dataExame = null,
  horaExame = null
) {
  let agendamentos = JSON.parse(localStorage.getItem("agendamentos") || "[]");

  const index = agendamentos.findIndex(
    (a) =>
      a.codigo === codigo &&
      ((a.dataConsulta === dataConsulta && a.horaConsulta === horaConsulta) ||
        (dataExame && a.dataExame === dataExame && a.horaExame === horaExame))
  );

  if (index === -1) {
    mostrarPopupGlobal("Agendamento não encontrado!");
    return;
  }

  agendamentos[index].cancelado = true;
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  mostrarPopupGlobal("Agendamento cancelado com sucesso!");
  listarAgendamentos();
}

/* ===== Inicialização ===== */
document.addEventListener("DOMContentLoaded", () => {
  aplicarMascaras();
  listarAgendamentos();

  const formAgendamento = document.getElementById("formAgendamento");
  if (formAgendamento) {
    formAgendamento.addEventListener("submit", function (e) {
      e.preventDefault();
      agendarConsulta();
    });
  }
});

// Função para salvar mensagens de contato (mantida)
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
    hora: new Date().toLocaleTimeString(),
  });
  localStorage.setItem("mensagensContato", JSON.stringify(mensagens));
  const msgSucesso = document.getElementById("msgContato");
  if (msgSucesso) {
    msgSucesso.classList.remove("hidden");
    setTimeout(() => msgSucesso.classList.add("hidden"), 4000);
  }
  const form = document.getElementById("contatoForm");
  form?.reset();
  mostrarAlerta("alertaMensagem", "Mensagem Enviada com sucesso.", "sucesso");
}

// função para listar mensagens na caixa de entrada (mantida)
function listarMensagens() {
  const lista = document.getElementById("listaMensagens");
  if (!lista) return;
  const mensagens = JSON.parse(
    localStorage.getItem("mensagensContato") || "[]"
  );

  if (mensagens.length === 0) {
    lista.innerHTML = "<p>Nenhuma mensagem recebida.</p>";
    return;
  }

  lista.innerHTML = mensagens
    .map(
      (m) => `
      <div class="mensagem-card">
        <h3>${m.assunto}</h3>
        <p><strong>Nome:</strong> ${m.nome}</p>
        <p><strong>Email:</strong> ${m.email}</p>
        <p><strong>Mensagem:</strong> ${m.mensagem}</p>
        <p class="data-msg">Enviado em ${m.data} às ${m.hora}</p>
      </div>
    `
    )
    .join("");
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
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

  // manter compatibilidade com ids antigos
  const formAgendamento = document.getElementById("formAgendamento");
  if (formAgendamento) {
    formAgendamento.addEventListener("submit", function (e) {
      e.preventDefault();
      agendarConsulta();
    });
  }
});

function mostrarCheck() {
  const popup = document.getElementById("popupCheck");
  popup.style.display = "block";

  // Reinicia animação
  const circle = popup.querySelector(".check-circle");
  const mark = popup.querySelector(".check-mark");
  circle.style.animation = "none";
  mark.style.animation = "none";
  void circle.offsetWidth; // força reflow
  circle.style.animation = "";
  mark.style.animation = "";

  // Esconde após 2 segundos
  setTimeout(() => {
    popup.style.display = "none";
  }, 2000);
}

function limparFormulario() {
  // Limpa todos os campos do formulário
  document.getElementById("formEditar").reset();
}

function mostrarPopupCodigo(mensagem) {
  document.getElementById("popupMensagem").textContent = mensagem;
  document.getElementById("popupCodigo").classList.remove("hidden");
}

function fecharPopup() {
  document.getElementById("popupCodigo").classList.add("hidden");
}

function mostrarPopupEdicao(mensagem) {
  const popup = document.getElementById("popupEditar");
  document.getElementById("popupMsgEditar").textContent = mensagem;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    document.getElementById("formEditar").reset();
  }, 2500);
}

function mostrarPopupPACNA(mensagem) {
  const popup = document.getElementById("popupPACNA");
  document.getElementById("popupMsgPACNA").textContent = mensagem;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    document.getElementById("formEditar").reset();
  }, 2500);
}

function mostrarPopupMarcar(mensagem) {
  const popup = document.getElementById("popupMarcar");
  document.getElementById("popupMsgMarcar").textContent = mensagem;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    document.getElementById("formMarcar").reset();
  }, 2500);
}

function mostrarPopupVFCS(mensagem) {
  const popup = document.getElementById("popupVFCS");
  document.getElementById("popupMsgVFCS").textContent = mensagem;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    document.getElementById("formMarcar").reset();
  }, 2500);
}

function mostrarPopupDATA(mensagem) {
  const popup = document.getElementById("popupDATA");
  document.getElementById("popupMsgDATA").textContent = mensagem;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    document.getElementById("formMarcar").reset();
  }, 2500);
}

function mostrarPopupPassado(mensagem) {
  const popup = document.getElementById("popupPassado");
  document.getElementById("popupMsgPassado").textContent = mensagem;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    document.getElementById("formMarcar").reset();
  }, 2500);
}

// Função para buscar paciente e preencher os campos automaticamente
function buscarPaciente() {
  const codigo = document.getElementById("codigoEditar").value.trim();
  let pacientes = JSON.parse(localStorage.getItem("pacientes") || "[]");

  const paciente = pacientes.find((p) => p.codigo === codigo);

  if (!paciente) {
    mostrarAlerta("alertaEdicao", "Paciente não encontrado!");
    return;
  }

  // Preencher os campos
  document.getElementById("nomeEditar").value = paciente.nome;
  document.getElementById("idadeEditar").value = paciente.idade;
  document.getElementById("cpfEditar").value = paciente.cpf;
  document.getElementById("nascimentoEditar").value = paciente.nascimento;
  document.getElementById("enderecoEditar").value = paciente.endereco;
  document.getElementById("telefoneEditar").value = paciente.telefone;

  mostrarAlerta(
    "alertaEdicao",
    "Dados carregados! Pode editar agora.",
    "sucesso"
  );
}

function cancelarExame(codigo, dataExame, horaExame) {
  let agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');

  const index = agendamentos.findIndex(a =>
    a.codigo === codigo &&
    a.dataExame === dataExame &&
    a.horaExame === horaExame &&
    !a.cancelado
  );

  if (index === -1) {
    mostrarPopupGlobal('Exame não encontrado!');
    return;
  }

  // Marca somente o EXAME como cancelado (não a consulta)
  agendamentos[index].exame = 'N/A';
  agendamentos[index].dataExame = '-';
  agendamentos[index].horaExame = '-';

  localStorage.setItem('agendamentos', JSON.stringify(agendamentos));

  mostrarPopupGlobal('Exame cancelado com sucesso!');
  listarAgendamentos();
}

