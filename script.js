const CRM_CONFIG = {
  useSupabase: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  n8nWebhookUrl: ""
};

const STORAGE_KEY = "uplife_crm_leads_v1";

const stages = [
  { id: "entrada", name: "Leads de Entrada", color: "#2563eb" },
  { id: "primeiro-contato", name: "Primeiro Contato", color: "#0ea5e9" },
  { id: "interessado", name: "Interessado", color: "#facc15" },
  { id: "em-atendimento", name: "Em Atendimento", color: "#a855f7" },
  { id: "documentacao", name: "Documentação/Matrícula", color: "#f97316" },
  { id: "pagamento", name: "Aguardando Pagamento", color: "#ef4444" },
  { id: "matriculado", name: "Matriculado", color: "#22c55e" }
];

const automations = [
  { title: "Novo lead via WhatsApp", description: "Criar card automaticamente" },
  { title: "Primeiro contato", description: "Enviar mensagem de boas-vindas" },
  { title: "Documentação/Matrícula", description: "Avisar equipe responsável" },
  { title: "Aguardando Pagamento", description: "Criar lembrete de cobrança" },
  { title: "Matriculado", description: "Registrar conversão" },
  { title: "Sem resposta", description: "Criar tarefa de retorno" },
  { title: "Lead quente", description: "Destacar no funil" }
];

let leads = [];
let draggedLeadId = null;
let currentModalLeadId = null;

const dom = {
  kanbanBoard: document.getElementById("kanbanBoard"),
  automationGrid: document.getElementById("automationGrid"),
  searchInput: document.getElementById("searchInput"),
  sourceFilter: document.getElementById("sourceFilter"),
  responsibleFilter: document.getElementById("responsibleFilter"),
  statusFilter: document.getElementById("statusFilter"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  openAddLeadBtn: document.getElementById("openAddLeadBtn"),
  simulateWhatsAppBtn: document.getElementById("simulateWhatsAppBtn"),
  leadModal: document.getElementById("leadModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalTitle: document.getElementById("modalTitle"),
  modalSubtitle: document.getElementById("modalSubtitle"),
  leadForm: document.getElementById("leadForm"),
  leadId: document.getElementById("leadId"),
  leadName: document.getElementById("leadName"),
  leadPhone: document.getElementById("leadPhone"),
  leadCourse: document.getElementById("leadCourse"),
  leadSource: document.getElementById("leadSource"),
  leadResponsible: document.getElementById("leadResponsible"),
  leadStage: document.getElementById("leadStage"),
  leadStatus: document.getElementById("leadStatus"),
  leadPriority: document.getElementById("leadPriority"),
  leadNextAction: document.getElementById("leadNextAction"),
  leadNextContact: document.getElementById("leadNextContact"),
  leadTags: document.getElementById("leadTags"),
  leadLastMessage: document.getElementById("leadLastMessage"),
  leadNotes: document.getElementById("leadNotes"),
  copyPhoneBtn: document.getElementById("copyPhoneBtn"),
  openWhatsAppBtn: document.getElementById("openWhatsAppBtn"),
  detailsBlocks: document.getElementById("detailsBlocks"),
  newObservationInput: document.getElementById("newObservationInput"),
  addObservationBtn: document.getElementById("addObservationBtn"),
  messageHistory: document.getElementById("messageHistory"),
  movementHistory: document.getElementById("movementHistory"),
  totalLeadsMetric: document.getElementById("totalLeadsMetric"),
  todayLeadsMetric: document.getElementById("todayLeadsMetric"),
  inServiceMetric: document.getElementById("inServiceMetric"),
  waitingPaymentMetric: document.getElementById("waitingPaymentMetric"),
  enrolledMetric: document.getElementById("enrolledMetric"),
  conversionMetric: document.getElementById("conversionMetric"),
  noResponseMetric: document.getElementById("noResponseMetric")
};

const fakeLeads = [
  {
    name: "Camila Souza",
    phone: "41999887766",
    course_interest: "Técnico em Segurança do Trabalho",
    source: "WhatsApp",
    responsible: "Ana",
    stage: "entrada",
    status: "Novo",
    priority: "Alta",
    next_action: "Enviar mensagem",
    next_contact: getISODateOnly(new Date()),
    notes: "Lead pediu valores e formas de pagamento.",
    last_message: "Olá, tenho interesse no curso de Técnico em Segurança do Trabalho.",
    tags: ["WhatsApp", "Urgente"],
    messages: [],
    movements: []
  },
  {
    name: "João Pedro Martins",
    phone: "41988776655",
    course_interest: "Técnico em Enfermagem",
    source: "Instagram",
    responsible: "Lucas",
    stage: "primeiro-contato",
    status: "Em atendimento",
    priority: "Média",
    next_action: "Ligar",
    next_contact: getISODateOnly(addDays(new Date(), 1)),
    notes: "Mandar grade curricular.",
    last_message: "Pode me explicar a duração do curso?",
    tags: ["Retornar"],
    messages: [],
    movements: []
  },
  {
    name: "Bruna Almeida",
    phone: "41977665544",
    course_interest: "Auxiliar Administrativo",
    source: "Site",
    responsible: "Mariana",
    stage: "interessado",
    status: "Quente",
    priority: "Alta",
    next_action: "Enviar mensagem",
    next_contact: getISODateOnly(new Date()),
    notes: "Muito interessada em bolsa.",
    last_message: "Tem desconto para matrícula hoje?",
    tags: ["Bolsa", "Urgente"],
    messages: [],
    movements: []
  },
  {
    name: "Rafael Lima",
    phone: "41966554433",
    course_interest: "Técnico em Logística",
    source: "Facebook",
    responsible: "Rafael",
    stage: "em-atendimento",
    status: "Em atendimento",
    priority: "Média",
    next_action: "Aguardar retorno",
    next_contact: getISODateOnly(addDays(new Date(), 2)),
    notes: "Está comparando preço com outra instituição.",
    last_message: "Vou conversar com minha família e retorno.",
    tags: ["Retornar"],
    messages: [],
    movements: []
  },
  {
    name: "Patrícia Oliveira",
    phone: "41955443322",
    course_interest: "Técnico em Radiologia",
    source: "Indicação",
    responsible: "Ana",
    stage: "documentacao",
    status: "Quente",
    priority: "Alta",
    next_action: "Cobrar documento",
    next_contact: getISODateOnly(new Date()),
    notes: "Falta RG e comprovante de residência.",
    last_message: "Envio os documentos ainda hoje.",
    tags: ["Documentação", "WhatsApp"],
    messages: [],
    movements: []
  },
  {
    name: "Felipe Rocha",
    phone: "41944332211",
    course_interest: "Técnico em Administração",
    source: "WhatsApp",
    responsible: "Equipe Comercial",
    stage: "pagamento",
    status: "Em atendimento",
    priority: "Média",
    next_action: "Cobrar pagamento",
    next_contact: getISODateOnly(addDays(new Date(), 1)),
    notes: "Boleto enviado.",
    last_message: "Recebi o boleto, vou pagar amanhã.",
    tags: ["Pagamento", "WhatsApp"],
    messages: [],
    movements: []
  },
  {
    name: "Larissa Mendes",
    phone: "41933221100",
    course_interest: "Técnico em Estética",
    source: "Instagram",
    responsible: "Mariana",
    stage: "matriculado",
    status: "Convertido",
    priority: "Baixa",
    next_action: "Finalizar matrícula",
    next_contact: "",
    notes: "Matrícula concluída.",
    last_message: "Obrigada pelo atendimento!",
    tags: ["Pagamento", "Documentação"],
    messages: [],
    movements: []
  },
  {
    name: "Gustavo Henrique",
    phone: "41922110099",
    course_interest: "Inglês Profissionalizante",
    source: "Ligação",
    responsible: "Lucas",
    stage: "em-atendimento",
    status: "Sem resposta",
    priority: "Baixa",
    next_action: "Ligar",
    next_contact: getISODateOnly(addDays(new Date(), 1)),
    notes: "Não respondeu as últimas duas mensagens.",
    last_message: "Vou verificar minha disponibilidade.",
    tags: ["Retornar"],
    messages: [],
    movements: []
  },
  {
    name: "Eduarda Nunes",
    phone: "41911009988",
    course_interest: "Técnico em Recursos Humanos",
    source: "WhatsApp",
    responsible: "Rafael",
    stage: "interessado",
    status: "Novo",
    priority: "Média",
    next_action: "Enviar mensagem",
    next_contact: getISODateOnly(new Date()),
    notes: "Pediu horários noturnos.",
    last_message: "Tem turma à noite?",
    tags: ["WhatsApp", "Bolsa"],
    messages: [],
    movements: []
  },
  {
    name: "Marcelo Vieira",
    phone: "41900998877",
    course_interest: "Técnico em Informática",
    source: "Site",
    responsible: "Equipe Comercial",
    stage: "entrada",
    status: "Frio",
    priority: "Baixa",
    next_action: "Aguardar retorno",
    next_contact: getISODateOnly(addDays(new Date(), 4)),
    notes: "Preencheu formulário, mas não respondeu contato.",
    last_message: "Tenho interesse, me chamem depois.",
    tags: ["Retornar"],
    messages: [],
    movements: []
  }
];

function init() {
  populateStageOptions();
  loadFromLocalStorage();
  normalizeSeedData();
  renderAutomations();
  renderLeads();
  bindEvents();
}

function bindEvents() {
  dom.openAddLeadBtn.addEventListener("click", () => openLeadDetails(null, "create"));
  dom.simulateWhatsAppBtn.addEventListener("click", simulateWhatsAppLead);
  dom.closeModalBtn.addEventListener("click", closeModal);
  dom.leadModal.addEventListener("click", event => {
    if (event.target === dom.leadModal) closeModal();
  });

  [dom.searchInput, dom.sourceFilter, dom.responsibleFilter, dom.statusFilter].forEach(element => {
    element.addEventListener("input", () => renderLeads());
    element.addEventListener("change", () => renderLeads());
  });

  dom.clearFiltersBtn.addEventListener("click", () => {
    dom.searchInput.value = "";
    dom.sourceFilter.value = "all";
    dom.responsibleFilter.value = "all";
    dom.statusFilter.value = "all";
    renderLeads();
  });

  dom.leadForm.addEventListener("submit", event => {
    event.preventDefault();
    const formData = getLeadFromForm();

    if (formData.id) {
      editLead(formData.id, formData);
    } else {
      createLead(formData);
    }

    closeModal();
  });

  dom.copyPhoneBtn.addEventListener("click", copyCurrentPhone);
  dom.openWhatsAppBtn.addEventListener("click", openCurrentWhatsApp);
  dom.addObservationBtn.addEventListener("click", addObservationToCurrentLead);
}

function createLead(data) {
  const now = new Date().toISOString();
  const lead = {
    id: data.id || crypto.randomUUID(),
    name: data.name.trim(),
    phone: sanitizePhone(data.phone),
    course_interest: data.course_interest || "Não informado",
    source: data.source || "WhatsApp",
    responsible: data.responsible || "Equipe Comercial",
    stage: data.stage || "entrada",
    status: data.status || "Novo",
    priority: data.priority || "Média",
    next_action: data.next_action || "Enviar mensagem",
    next_contact: data.next_contact || "",
    notes: data.notes || "",
    last_message: data.last_message || "",
    last_interaction: data.last_interaction || now,
    created_at: data.created_at || now,
    updated_at: now,
    tags: normalizeTags(data.tags),
    messages: data.messages || [],
    movements: data.movements || []
  };

  if (lead.last_message && lead.messages.length === 0) {
    lead.messages.push({
      direction: "entrada",
      message: lead.last_message,
      channel: lead.source === "WhatsApp" ? "whatsapp" : "crm",
      received_at: lead.last_interaction
    });
  }

  lead.movements.push({
    from_stage: null,
    to_stage: lead.stage,
    moved_at: now
  });

  leads.unshift(lead);
  saveToLocalStorage();
  renderLeads();
  sendAutomationToN8n("lead_created", lead);
  return lead;
}

function renderLeads() {
  dom.kanbanBoard.innerHTML = "";
  updateFilterOptions();
  const visibleLeads = filterLeads(searchLeads(leads));

  stages.forEach(stage => {
    const stageLeads = visibleLeads.filter(lead => lead.stage === stage.id);
    const column = document.createElement("section");
    column.className = "kanban-column";
    column.style.setProperty("--column-color", stage.color);
    column.innerHTML = `
      <div class="column-header">
        <div class="column-title-row">
          <h2>${stage.name}</h2>
          <span class="column-count">${stageLeads.length}</span>
        </div>
        <p class="column-subtitle">${stageLeads.length} oportunidade(s) no funil</p>
      </div>
      <div class="lead-list" data-stage="${stage.id}"></div>
    `;

    const list = column.querySelector(".lead-list");
    bindDropZone(list);

    if (stageLeads.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "Nenhum lead nesta etapa";
      list.appendChild(emptyState);
    } else {
      stageLeads.forEach(lead => list.appendChild(createLeadCard(lead)));
    }

    dom.kanbanBoard.appendChild(column);
  });

  calculateMetrics();
}

function createLeadCard(lead) {
  const template = document.getElementById("leadCardTemplate");
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.leadId = lead.id;

  card.querySelector("h3").textContent = lead.name;
  card.querySelector(".lead-phone").textContent = formatPhone(lead.phone);
  card.querySelector(".lead-course").textContent = lead.course_interest;
  card.querySelector(".lead-message").textContent = lead.last_message || "Sem mensagem registrada.";
  card.querySelector(".lead-date").textContent = `Última interação: ${formatDateTime(lead.last_interaction)}`;

  const statusBadge = card.querySelector(".status-badge");
  statusBadge.textContent = lead.status;
  statusBadge.classList.add(`status-${slugify(lead.status)}`);

  const priorityBadge = card.querySelector(".priority-badge");
  priorityBadge.textContent = lead.priority || "Média";
  priorityBadge.classList.add(`priority-${slugify(lead.priority || "Média")}`);

  const meta = card.querySelector(".lead-meta");
  meta.innerHTML = `<span>${lead.source}</span><span>${lead.responsible}</span><span>${lead.next_action || "Sem próxima ação"}</span>`;

  const tagList = card.querySelector(".tag-list");
  normalizeTags(lead.tags).forEach(tag => {
    const tagElement = document.createElement("span");
    tagElement.className = `tag tag-${slugify(tag)}`;
    tagElement.textContent = tag;
    tagList.appendChild(tagElement);
  });

  card.addEventListener("dragstart", () => {
    draggedLeadId = lead.id;
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    draggedLeadId = null;
    card.classList.remove("dragging");
  });

  card.addEventListener("click", event => {
    const action = event.target.dataset.action;
    if (!action) {
      openLeadDetails(lead.id, "details");
      return;
    }

    event.stopPropagation();
    if (action === "details") openLeadDetails(lead.id, "details");
    if (action === "edit") openLeadDetails(lead.id, "edit");
    if (action === "whatsapp") openWhatsApp(lead.phone);
    if (action === "delete") deleteLead(lead.id);
  });

  return card;
}

function bindDropZone(list) {
  list.addEventListener("dragover", event => {
    event.preventDefault();
    list.classList.add("drag-over");
  });

  list.addEventListener("dragleave", () => {
    list.classList.remove("drag-over");
  });

  list.addEventListener("drop", event => {
    event.preventDefault();
    list.classList.remove("drag-over");
    const newStage = list.dataset.stage;
    if (draggedLeadId && newStage) {
      updateLeadStage(draggedLeadId, newStage);
    }
  });
}

function updateLeadStage(leadId, newStage) {
  const lead = findLead(leadId);
  if (!lead || lead.stage === newStage) return;

  const previousStage = lead.stage;
  lead.stage = newStage;
  lead.updated_at = new Date().toISOString();
  lead.last_interaction = lead.updated_at;

  if (newStage === "matriculado") {
    lead.status = "Convertido";
    if (!lead.tags.includes("Pagamento")) lead.tags.push("Pagamento");
  }

  registerLeadMovement(lead, previousStage, newStage);
  saveToLocalStorage();
  renderLeads();

  const eventName = getAutomationEventForStage(newStage);
  sendAutomationToN8n(eventName, lead);
}

function deleteLead(leadId) {
  const lead = findLead(leadId);
  if (!lead) return;

  const confirmed = window.confirm(`Deseja excluir o lead ${lead.name}?`);
  if (!confirmed) return;

  leads = leads.filter(item => item.id !== leadId);
  saveToLocalStorage();
  renderLeads();
}

function editLead(leadId, data) {
  const lead = findLead(leadId);
  if (!lead) return;

  const previousStage = lead.stage;
  Object.assign(lead, {
    name: data.name.trim(),
    phone: sanitizePhone(data.phone),
    course_interest: data.course_interest || "Não informado",
    source: data.source,
    responsible: data.responsible,
    stage: data.stage,
    status: data.status,
    priority: data.priority,
    next_action: data.next_action,
    next_contact: data.next_contact,
    notes: data.notes,
    last_message: data.last_message,
    tags: normalizeTags(data.tags),
    updated_at: new Date().toISOString(),
    last_interaction: new Date().toISOString()
  });

  if (previousStage !== lead.stage) {
    registerLeadMovement(lead, previousStage, lead.stage);
    sendAutomationToN8n(getAutomationEventForStage(lead.stage), lead);
  }

  saveToLocalStorage();
  renderLeads();
}

function openLeadDetails(leadId, mode = "details") {
  currentModalLeadId = leadId;
  const isCreate = !leadId;
  const lead = leadId ? findLead(leadId) : null;

  dom.modalTitle.textContent = isCreate ? "Adicionar lead" : `${mode === "edit" ? "Editar" : "Detalhes do"} lead`;
  dom.modalSubtitle.textContent = isCreate ? "Cadastre manualmente um novo lead no funil." : "Dados completos, histórico e ações rápidas.";
  dom.detailsBlocks.classList.toggle("active", Boolean(lead));

  dom.leadForm.reset();
  dom.leadId.value = lead?.id || "";
  dom.leadName.value = lead?.name || "";
  dom.leadPhone.value = lead?.phone || "";
  dom.leadCourse.value = lead?.course_interest || "";
  dom.leadSource.value = lead?.source || "WhatsApp";
  dom.leadResponsible.value = lead?.responsible || "Equipe Comercial";
  dom.leadStage.value = lead?.stage || "entrada";
  dom.leadStatus.value = lead?.status || "Novo";
  dom.leadPriority.value = lead?.priority || "Média";
  dom.leadNextAction.value = lead?.next_action || "Enviar mensagem";
  dom.leadNextContact.value = lead?.next_contact || "";
  dom.leadTags.value = normalizeTags(lead?.tags || []).join(", ");
  dom.leadLastMessage.value = lead?.last_message || "";
  dom.leadNotes.value = lead?.notes || "";

  renderHistories(lead);
  dom.leadModal.classList.add("active");
  dom.leadModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  dom.leadModal.classList.remove("active");
  dom.leadModal.setAttribute("aria-hidden", "true");
  currentModalLeadId = null;
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  leads = saved ? JSON.parse(saved) : [];

  if (leads.length === 0) {
    leads = fakeLeads.map((lead, index) => {
      const now = addMinutes(new Date(), -index * 45).toISOString();
      return {
        ...lead,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        last_interaction: now,
        messages: [
          {
            direction: "entrada",
            message: lead.last_message,
            channel: lead.source === "WhatsApp" ? "whatsapp" : "crm",
            received_at: now
          }
        ],
        movements: [
          {
            from_stage: null,
            to_stage: lead.stage,
            moved_at: now
          }
        ]
      };
    });
    saveToLocalStorage();
  }
}

function searchLeads(baseLeads) {
  const query = dom.searchInput.value.trim().toLowerCase();
  if (!query) return baseLeads;

  return baseLeads.filter(lead => {
    return [lead.name, lead.phone, lead.course_interest]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function filterLeads(baseLeads) {
  const source = dom.sourceFilter.value;
  const responsible = dom.responsibleFilter.value;
  const status = dom.statusFilter.value;

  return baseLeads.filter(lead => {
    const sourceMatch = source === "all" || lead.source === source;
    const responsibleMatch = responsible === "all" || lead.responsible === responsible;
    const statusMatch = status === "all" || lead.status === status;
    return sourceMatch && responsibleMatch && statusMatch;
  });
}

function calculateMetrics() {
  const total = leads.length;
  const today = getISODateOnly(new Date());
  const enrolled = leads.filter(lead => lead.stage === "matriculado" || lead.status === "Convertido").length;

  dom.totalLeadsMetric.textContent = total;
  dom.todayLeadsMetric.textContent = leads.filter(lead => getISODateOnly(new Date(lead.created_at)) === today).length;
  dom.inServiceMetric.textContent = leads.filter(lead => lead.stage === "em-atendimento" || lead.status === "Em atendimento").length;
  dom.waitingPaymentMetric.textContent = leads.filter(lead => lead.stage === "pagamento").length;
  dom.enrolledMetric.textContent = enrolled;
  dom.conversionMetric.textContent = `${total ? Math.round((enrolled / total) * 100) : 0}%`;
  dom.noResponseMetric.textContent = leads.filter(lead => lead.status === "Sem resposta").length;
}

function registerLeadMovement(lead, fromStage, toStage) {
  lead.movements = lead.movements || [];
  lead.movements.push({
    from_stage: fromStage,
    to_stage: toStage,
    moved_at: new Date().toISOString()
  });
}

function addLeadMessage(lead, message, direction = "entrada", channel = "whatsapp") {
  const now = new Date().toISOString();
  lead.messages = lead.messages || [];
  lead.messages.push({
    direction,
    message,
    channel,
    received_at: now
  });
  lead.last_message = message;
  lead.last_interaction = now;
  lead.updated_at = now;
}

function simulateWhatsAppLead() {
  const samples = [
    {
      name: "Lead WhatsApp",
      phone: `4199${Math.floor(1000000 + Math.random() * 8999999)}`,
      message: "Olá, tenho interesse no curso de Técnico em Segurança do Trabalho.",
      course_interest: "Técnico em Segurança do Trabalho",
      source: "WhatsApp",
      received_at: new Date().toISOString()
    },
    {
      name: "Contato WhatsApp",
      phone: `4198${Math.floor(1000000 + Math.random() * 8999999)}`,
      message: "Boa tarde, vocês têm curso técnico com turma à noite?",
      course_interest: "Curso técnico noturno",
      source: "WhatsApp",
      received_at: new Date().toISOString()
    }
  ];

  const payload = samples[Math.floor(Math.random() * samples.length)];
  receiveLeadFromN8n(payload);
}

function prepareSupabasePayload(lead) {
  return {
    name: lead.name,
    phone: lead.phone,
    course_interest: lead.course_interest,
    source: lead.source,
    stage: lead.stage,
    status: lead.status,
    responsible: lead.responsible,
    notes: lead.notes,
    last_message: lead.last_message,
    last_interaction: lead.last_interaction,
    updated_at: new Date().toISOString()
  };
}

function prepareN8nPayload(eventName, lead) {
  return {
    event: eventName,
    lead: {
      ...prepareSupabasePayload(lead),
      id: lead.id,
      tags: lead.tags,
      priority: lead.priority,
      next_action: lead.next_action,
      next_contact: lead.next_contact
    },
    triggered_at: new Date().toISOString()
  };
}

function triggerAutomation(eventName, lead) {
  console.info("Automação simulada:", prepareN8nPayload(eventName, lead));
}

function receiveLeadFromN8n(payload) {
  const phone = sanitizePhone(payload.phone);
  const existingLead = leads.find(lead => lead.phone === phone);

  if (existingLead) {
    existingLead.status = "Novo";
    existingLead.source = "WhatsApp";
    existingLead.course_interest = payload.course_interest || existingLead.course_interest;
    existingLead.name = existingLead.name || payload.name || "Lead WhatsApp";
    if (!existingLead.tags.includes("WhatsApp")) existingLead.tags.push("WhatsApp");
    addLeadMessage(existingLead, payload.message, "entrada", "whatsapp");
    saveToLocalStorage();
    renderLeads();
    sendAutomationToN8n("lead_created", existingLead);
    return existingLead;
  }

  const newLead = createLead({
    name: payload.name || "Lead WhatsApp",
    phone,
    course_interest: payload.course_interest || "Não informado",
    source: "WhatsApp",
    responsible: "Equipe Comercial",
    stage: "entrada",
    status: "Novo",
    priority: "Média",
    next_action: "Enviar mensagem",
    next_contact: getISODateOnly(new Date()),
    notes: "Lead criado automaticamente a partir de uma simulação do WhatsApp/n8n.",
    last_message: payload.message,
    last_interaction: payload.received_at || new Date().toISOString(),
    tags: ["WhatsApp"],
    messages: [
      {
        direction: "entrada",
        message: payload.message,
        channel: "whatsapp",
        received_at: payload.received_at || new Date().toISOString()
      }
    ],
    movements: []
  });

  return newLead;
}

function sendAutomationToN8n(eventName, lead) {
  triggerAutomation(eventName, lead);

  /*
  fetch("https://SEU-N8N/webhook/up-life-crm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: eventName,
      lead: lead
    })
  });
  */
}

// FUTURA INTEGRAÇÃO COM SUPABASE
// Ideia: quando CRM_CONFIG.useSupabase for true, substituir localStorage por chamadas reais ao Supabase.
// Tabelas previstas: leads, lead_messages, lead_movements, automation_logs e lead_tags.

async function insertLeadIntoSupabase(lead) {
  // const payload = prepareSupabasePayload(lead);
  // await supabase.from("leads").insert(payload);
}

async function updateLeadIntoSupabase(lead) {
  // const payload = prepareSupabasePayload(lead);
  // await supabase.from("leads").update(payload).eq("id", lead.id);
}

async function updateLeadStageIntoSupabase(leadId, stage) {
  // await supabase.from("leads").update({ stage, updated_at: new Date().toISOString() }).eq("id", leadId);
}

async function fetchLeadsFromSupabase() {
  // const { data } = await supabase.from("leads").select("*, lead_messages(*), lead_movements(*), lead_tags(*)");
  // return data;
}

async function registerMessageIntoSupabase(leadId, messagePayload) {
  // await supabase.from("lead_messages").insert({ lead_id: leadId, ...messagePayload });
}

async function registerMovementIntoSupabase(leadId, movementPayload) {
  // await supabase.from("lead_movements").insert({ lead_id: leadId, ...movementPayload });
}

async function registerAutomationLogIntoSupabase(leadId, automationPayload) {
  // await supabase.from("automation_logs").insert({ lead_id: leadId, ...automationPayload });
}

// SQL sugerido para o Supabase:
// create table leads (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   phone text not null unique,
//   course_interest text,
//   source text,
//   stage text not null,
//   status text default 'Novo',
//   responsible text,
//   notes text,
//   last_message text,
//   last_interaction timestamp with time zone,
//   created_at timestamp with time zone default now(),
//   updated_at timestamp with time zone default now()
// );
// create table lead_messages (
//   id uuid primary key default gen_random_uuid(),
//   lead_id uuid references leads(id) on delete cascade,
//   phone text not null,
//   direction text,
//   message text not null,
//   channel text default 'whatsapp',
//   received_at timestamp with time zone default now()
// );
// create table lead_movements (
//   id uuid primary key default gen_random_uuid(),
//   lead_id uuid references leads(id) on delete cascade,
//   from_stage text,
//   to_stage text,
//   moved_at timestamp with time zone default now()
// );
// create table automation_logs (
//   id uuid primary key default gen_random_uuid(),
//   lead_id uuid references leads(id),
//   automation_name text,
//   trigger_event text,
//   payload jsonb,
//   status text,
//   created_at timestamp with time zone default now()
// );
// create table lead_tags (
//   id uuid primary key default gen_random_uuid(),
//   lead_id uuid references leads(id) on delete cascade,
//   tag text not null
// );

// FUTURA INTEGRAÇÃO COM N8N + WHATSAPP
// Fluxo previsto:
// 1. Cliente envia mensagem no WhatsApp.
// 2. WhatsApp Business Cloud API dispara um webhook.
// 3. n8n recebe o webhook pelo WhatsApp Trigger ou Webhook Node.
// 4. n8n trata os dados recebidos.
// 5. n8n verifica se o número já existe no Supabase.
// 6. Se não existir, cria um novo lead.
// 7. Se existir, atualiza o lead existente.
// 8. n8n salva a mensagem na tabela lead_messages.
// 9. O CRM exibe o novo lead automaticamente.
// 10. Futuramente, com Supabase Realtime, o lead pode aparecer na tela sem precisar atualizar a página.

function getLeadFromForm() {
  return {
    id: dom.leadId.value,
    name: dom.leadName.value,
    phone: dom.leadPhone.value,
    course_interest: dom.leadCourse.value,
    source: dom.leadSource.value,
    responsible: dom.leadResponsible.value,
    stage: dom.leadStage.value,
    status: dom.leadStatus.value,
    priority: dom.leadPriority.value,
    next_action: dom.leadNextAction.value,
    next_contact: dom.leadNextContact.value,
    tags: dom.leadTags.value,
    last_message: dom.leadLastMessage.value,
    notes: dom.leadNotes.value
  };
}

function renderHistories(lead) {
  dom.messageHistory.innerHTML = "";
  dom.movementHistory.innerHTML = "";

  if (!lead) return;

  const messages = [...(lead.messages || [])].reverse();
  const movements = [...(lead.movements || [])].reverse();

  if (messages.length === 0) {
    dom.messageHistory.innerHTML = `<li>Nenhuma mensagem registrada.</li>`;
  } else {
    messages.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.channel || "crm"} • ${item.direction || "entrada"}</strong><br>${escapeHTML(item.message)}<br><small>${formatDateTime(item.received_at)}</small>`;
      dom.messageHistory.appendChild(li);
    });
  }

  if (movements.length === 0) {
    dom.movementHistory.innerHTML = `<li>Nenhuma movimentação registrada.</li>`;
  } else {
    movements.forEach(item => {
      const from = item.from_stage ? getStageName(item.from_stage) : "Criação";
      const to = getStageName(item.to_stage);
      const li = document.createElement("li");
      li.innerHTML = `<strong>${from} → ${to}</strong><br><small>${formatDateTime(item.moved_at)}</small>`;
      dom.movementHistory.appendChild(li);
    });
  }
}

function addObservationToCurrentLead() {
  const lead = findLead(currentModalLeadId);
  const observation = dom.newObservationInput.value.trim();
  if (!lead || !observation) return;

  const timestamp = formatDateTime(new Date().toISOString());
  lead.notes = `${lead.notes || ""}\n[${timestamp}] ${observation}`.trim();
  lead.updated_at = new Date().toISOString();
  dom.leadNotes.value = lead.notes;
  dom.newObservationInput.value = "";
  saveToLocalStorage();
  renderLeads();
}

function copyCurrentPhone() {
  const phone = sanitizePhone(dom.leadPhone.value);
  if (!phone) return;
  navigator.clipboard?.writeText(phone);
  dom.copyPhoneBtn.textContent = "Copiado!";
  setTimeout(() => (dom.copyPhoneBtn.textContent = "Copiar telefone"), 1200);
}

function openCurrentWhatsApp() {
  openWhatsApp(dom.leadPhone.value);
}

function openWhatsApp(phone) {
  const sanitized = sanitizePhone(phone);
  if (!sanitized) return;
  window.open(`https://wa.me/55${sanitized}`, "_blank", "noopener,noreferrer");
}

function updateFilterOptions() {
  const currentSource = dom.sourceFilter.value;
  const currentResponsible = dom.responsibleFilter.value;
  const currentStatus = dom.statusFilter.value;

  fillSelect(dom.sourceFilter, ["all", ...unique(leads.map(lead => lead.source))], "Todas as origens");
  fillSelect(dom.responsibleFilter, ["all", ...unique(leads.map(lead => lead.responsible))], "Todos os responsáveis");
  fillSelect(dom.statusFilter, ["all", ...unique(leads.map(lead => lead.status))], "Todos os status");

  dom.sourceFilter.value = [...dom.sourceFilter.options].some(option => option.value === currentSource) ? currentSource : "all";
  dom.responsibleFilter.value = [...dom.responsibleFilter.options].some(option => option.value === currentResponsible) ? currentResponsible : "all";
  dom.statusFilter.value = [...dom.statusFilter.options].some(option => option.value === currentStatus) ? currentStatus : "all";
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = "";
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === "all" ? allLabel : value;
    select.appendChild(option);
  });
}

function populateStageOptions() {
  dom.leadStage.innerHTML = "";
  stages.forEach(stage => {
    const option = document.createElement("option");
    option.value = stage.id;
    option.textContent = stage.name;
    dom.leadStage.appendChild(option);
  });
}

function renderAutomations() {
  dom.automationGrid.innerHTML = "";
  automations.forEach(item => {
    const card = document.createElement("article");
    card.className = "automation-card";
    card.innerHTML = `${item.title}<span>${item.description}</span>`;
    dom.automationGrid.appendChild(card);
  });
}

function normalizeSeedData() {
  leads = leads.map(lead => ({
    id: lead.id || crypto.randomUUID(),
    name: lead.name || "Lead sem nome",
    phone: sanitizePhone(lead.phone || ""),
    course_interest: lead.course_interest || "Não informado",
    source: lead.source || "WhatsApp",
    responsible: lead.responsible || "Equipe Comercial",
    stage: lead.stage || "entrada",
    status: lead.status || "Novo",
    priority: lead.priority || "Média",
    next_action: lead.next_action || "Enviar mensagem",
    next_contact: lead.next_contact || "",
    notes: lead.notes || "",
    last_message: lead.last_message || "",
    last_interaction: lead.last_interaction || new Date().toISOString(),
    created_at: lead.created_at || new Date().toISOString(),
    updated_at: lead.updated_at || new Date().toISOString(),
    tags: normalizeTags(lead.tags || []),
    messages: lead.messages || [],
    movements: lead.movements || []
  }));
  saveToLocalStorage();
}

function getAutomationEventForStage(stage) {
  const map = {
    entrada: "lead_created",
    "primeiro-contato": "lead_stage_changed",
    interessado: "lead_stage_changed",
    "em-atendimento": "lead_stage_changed",
    documentacao: "lead_moved_to_documentation",
    pagamento: "lead_waiting_payment",
    matriculado: "lead_converted"
  };
  return map[stage] || "lead_stage_changed";
}

function findLead(leadId) {
  return leads.find(lead => lead.id === leadId);
}

function getStageName(stageId) {
  return stages.find(stage => stage.id === stageId)?.name || stageId;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return unique(tags.map(tag => String(tag).trim()).filter(Boolean));
  return unique(String(tags).split(",").map(tag => tag.trim()).filter(Boolean));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function formatPhone(phone) {
  const clean = sanitizePhone(phone);
  if (clean.length < 10) return clean;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
}

function formatDateTime(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getISODateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init();
