const loginView = document.getElementById('loginView');
const panelView = document.getElementById('panelView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const panelError = document.getElementById('panelError');
const emptyState = document.getElementById('emptyState');
const leadsTable = document.getElementById('leadsTable');
const filters = [...document.querySelectorAll('.filter')];

let currentStatus = '';

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

function renderLeads(leads) {
    leadsTable.innerHTML = '';
    emptyState.classList.toggle('hidden', leads.length > 0);

    for (const lead of leads) {
        const phone = cleanPhone(lead.telefono);
        const whatsappUrl = phone ? `https://wa.me/54${phone}` : '#';
        const row = document.createElement('tr');

        row.innerHTML = `
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
                <strong>${lead.en_blanco === 'si' ? 'En blanco' : 'En negro'}</strong>
                <div class="muted">${lead.tiempo === 'menos18' ? 'Menos de 18 meses' : 'Mas de 18 meses'}</div>
            </td>
            <td>
                ${escapeHtml(lead.source || '')}
                <div class="muted">${escapeHtml(lead.user_agent || '')}</div>
            </td>
            <td>
                <select class="status-select" data-id="${lead.id}">
                    <option value="new"${lead.status === 'new' ? ' selected' : ''}>Nuevo</option>
                    <option value="contacted"${lead.status === 'contacted' ? ' selected' : ''}>Contactado</option>
                    <option value="closed"${lead.status === 'closed' ? ' selected' : ''}>Cerrado</option>
                </select>
            </td>
            <td><a class="whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">WhatsApp</a></td>
        `;

        leadsTable.appendChild(row);
    }
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

loadLeads();
