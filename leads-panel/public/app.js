const loginView = document.getElementById('loginView');
const panelView = document.getElementById('panelView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const panelError = document.getElementById('panelError');
const emptyState = document.getElementById('emptyState');
const leadsTable = document.getElementById('leadsTable');
const selectAllLeads = document.getElementById('selectAllLeads');
const copySelectedBtn = document.getElementById('copySelectedBtn');
const filters = [...document.querySelectorAll('.filter')];

let currentStatus = '';
let currentLeads = [];
const selectedLeadIds = new Set();

function showPanel() {
    loginView.classList.add('hidden');
    panelView.classList.remove('hidden');
}

function showLogin() {
    panelView.classList.add('hidden');
    loginView.classList.remove('hidden');
}

function formatDate(value) {
    return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(value));
}

function statusLabel(status) {
    return {
        new: 'Nuevo',
        contacted: 'Contactado',
        closed: 'Cerrado'
    }[status] || status;
}

function cleanPhone(phone) {
    return String(phone || '').replace(/\D/g, '');
}

function periodLabel(tiempo) {
    return tiempo === 'menos18' ? 'Menos de 18 meses' : 'Mas de 18 meses';
}

function laboralLabel(enBlanco) {
    return enBlanco === 'si' ? 'En blanco' : 'En negro';
}

function formatLeadForWhatsapp(lead) {
    return [
        `Nombre: ${lead.nombre || ''}`,
        `Telefono: ${lead.telefono || ''}`,
        `Lesion: ${lead.lesion || ''}`,
        `Periodo: ${periodLabel(lead.tiempo)}`,
        `Situacion laboral: ${laboralLabel(lead.en_blanco)}`
    ].join('\n');
}

function getLeadById(id) {
    return currentLeads.find((lead) => String(lead.id) === String(id));
}

function updateSelectionControls() {
    const visibleLeadIds = currentLeads.map((lead) => String(lead.id));
    const selectedVisibleCount = visibleLeadIds.filter((id) => selectedLeadIds.has(id)).length;

    copySelectedBtn.disabled = selectedVisibleCount === 0;
    copySelectedBtn.textContent = selectedVisibleCount > 0
        ? `Copiar seleccionados (${selectedVisibleCount})`
        : 'Copiar seleccionados';

    selectAllLeads.checked = visibleLeadIds.length > 0 && selectedVisibleCount === visibleLeadIds.length;
    selectAllLeads.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleLeadIds.length;
    selectAllLeads.disabled = visibleLeadIds.length === 0;
}

async function copyText(text, successMessage = 'Texto copiado.') {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }

        panelError.textContent = successMessage;
        panelError.classList.remove('error');
        panelError.classList.add('notice');
        panelError.classList.remove('hidden');
    } catch (error) {
        panelError.textContent = 'No se pudo copiar el texto.';
        panelError.classList.remove('notice');
        panelError.classList.add('error');
        panelError.classList.remove('hidden');
    }
}

function renderLeads(leads) {
    currentLeads = leads;
    selectedLeadIds.clear();
    leadsTable.innerHTML = '';
    emptyState.classList.toggle('hidden', leads.length > 0);

    for (const lead of leads) {
        const phone = cleanPhone(lead.telefono);
        const whatsappUrl = phone ? `https://wa.me/54${phone}` : '#';
        const row = document.createElement('tr');
        const leadId = escapeHtml(lead.id);

        row.innerHTML = `
            <td class="select-col">
                <input class="lead-checkbox" type="checkbox" data-id="${leadId}" aria-label="Seleccionar lead de ${escapeHtml(lead.nombre)}">
            </td>
            <td>
                <strong>${formatDate(lead.created_at)}</strong>
                <div class="muted">${lead.ip || ''}</div>
            </td>
            <td>
                <div class="contact">
                    <strong>${escapeHtml(lead.nombre)}</strong>
                    <a class="whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">${escapeHtml(lead.telefono)}</a>
                </div>
            </td>
            <td>${escapeHtml(lead.lesion)}</td>
            <td>
                <strong>${laboralLabel(lead.en_blanco)}</strong>
                <div class="muted">${periodLabel(lead.tiempo)}</div>
            </td>
            <td>
                ${escapeHtml(lead.source || '')}
                <div class="muted">${escapeHtml(lead.user_agent || '')}</div>
            </td>
            <td>
                <select class="status-select" data-id="${leadId}">
                    <option value="new"${lead.status === 'new' ? ' selected' : ''}>Nuevo</option>
                    <option value="contacted"${lead.status === 'contacted' ? ' selected' : ''}>Contactado</option>
                    <option value="closed"${lead.status === 'closed' ? ' selected' : ''}>Cerrado</option>
                </select>
            </td>
            <td>
                <div class="row-actions">
                    <a class="whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">WhatsApp</a>
                    <button class="copy-lead-btn secondary compact" type="button" data-id="${leadId}">Copiar datos</button>
                </div>
            </td>
        `;

        leadsTable.appendChild(row);
    }

    updateSelectionControls();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

async function loadLeads() {
    panelError.classList.add('hidden');
    panelError.classList.remove('notice');
    panelError.classList.add('error');
    const query = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : '';

    try {
        const data = await fetchJson(`/api/leads${query}`);
        renderLeads(data.leads || []);
        showPanel();
    } catch (error) {
        if (error.message === 'Unauthorized') {
            showLogin();
            return;
        }

        panelError.textContent = 'No se pudieron cargar los leads.';
        panelError.classList.remove('hidden');
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.classList.add('hidden');

    try {
        await fetchJson('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            })
        });
        await loadLeads();
    } catch (error) {
        loginError.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', async () => {
    await fetchJson('/api/logout', { method: 'POST' }).catch(() => {});
    showLogin();
});

refreshBtn.addEventListener('click', loadLeads);

filters.forEach((button) => {
    button.addEventListener('click', () => {
        filters.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        currentStatus = button.dataset.status || '';
        loadLeads();
    });
});

leadsTable.addEventListener('change', async (event) => {
    if (event.target.matches('.lead-checkbox')) {
        const leadId = String(event.target.dataset.id);

        if (event.target.checked) {
            selectedLeadIds.add(leadId);
        } else {
            selectedLeadIds.delete(leadId);
        }

        updateSelectionControls();
        return;
    }

    if (!event.target.matches('.status-select')) return;

    const select = event.target;
    select.disabled = true;

    try {
        await fetchJson(`/api/leads/${select.dataset.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: select.value })
        });
    } catch (error) {
        panelError.textContent = 'No se pudo actualizar el estado.';
        panelError.classList.remove('hidden');
    } finally {
        select.disabled = false;
    }
});

leadsTable.addEventListener('click', async (event) => {
    const button = event.target.closest('.copy-lead-btn');
    if (!button) return;

    const lead = getLeadById(button.dataset.id);
    if (!lead) return;

    await copyText(formatLeadForWhatsapp(lead), 'Lead copiado.');
});

selectAllLeads.addEventListener('change', () => {
    const visibleLeadIds = currentLeads.map((lead) => String(lead.id));

    for (const id of visibleLeadIds) {
        if (selectAllLeads.checked) {
            selectedLeadIds.add(id);
        } else {
            selectedLeadIds.delete(id);
        }
    }

    leadsTable.querySelectorAll('.lead-checkbox').forEach((checkbox) => {
        checkbox.checked = selectAllLeads.checked;
    });

    updateSelectionControls();
});

copySelectedBtn.addEventListener('click', async () => {
    const selectedLeads = currentLeads.filter((lead) => selectedLeadIds.has(String(lead.id)));
    if (selectedLeads.length === 0) return;

    const text = selectedLeads.map(formatLeadForWhatsapp).join('\n\n------\n\n');
    await copyText(text, `${selectedLeads.length} leads copiados.`);
});

loadLeads();
