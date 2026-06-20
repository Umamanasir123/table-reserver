// ============================================================
// APP.JS — Main Application Logic
// ============================================================

let reservations = [...RESERVATIONS];
let selectedTable = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('filter-date').value = todayStr;
  document.getElementById('res-date').value = todayStr;

  renderFloorPlan();
  renderReservationsTable();

  // Form submit
  document.getElementById('reservation-form').addEventListener('submit', handleFormSubmit);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);

  // Search & filter
  document.getElementById('search-res').addEventListener('input', renderReservationsTable);
  document.getElementById('filter-zone').addEventListener('change', renderReservationsTable);
});

// ============================================================
// SHOW RESERVATION FORM
// ============================================================
function showReservationForm(table) {
  selectedTable = table;

  const infoEl = document.getElementById('selected-table-info');
  const formEl = document.getElementById('reservation-form');

  infoEl.innerHTML = '';
  formEl.style.display = 'block';

  // Badge
  const badge = document.getElementById('table-badge');
  const zoneEmoji = { 'Wine Cellar': '🍷', 'Main Dining': '🕯️', 'Terrace': '🌿' };
  badge.innerHTML = `
    ${zoneEmoji[table.zone] || '🍽️'}
    Table ${table.number} &nbsp;·&nbsp; ${table.zone} &nbsp;·&nbsp; Up to ${table.seats} guests
  `;

  // Sync filter date/time if set
  const filterDate = document.getElementById('filter-date').value;
  const filterTime = document.getElementById('filter-time').value;
  if (filterDate) document.getElementById('res-date').value = filterDate;
  if (filterTime) {
    const timeSelect = document.getElementById('res-time');
    for (let opt of timeSelect.options) {
      if (opt.value === filterTime) { timeSelect.value = filterTime; break; }
    }
  }

  // Scroll form into view on mobile
  document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================
// FORM SUBMIT
// ============================================================
function handleFormSubmit(e) {
  e.preventDefault();

  if (!selectedTable) return;

  const name    = document.getElementById('guest-name').value.trim();
  const email   = document.getElementById('guest-email').value.trim();
  const phone   = document.getElementById('guest-phone').value.trim();
  const date    = document.getElementById('res-date').value;
  const time    = document.getElementById('res-time').value;
  const guests  = document.getElementById('res-guests').value;
  const occasion = document.getElementById('res-occasion').value;
  const notes   = document.getElementById('res-notes').value.trim();

  if (!name || !email || !date || !time || !guests) {
    alert('Please fill in all required fields.');
    return;
  }

  if (parseInt(guests) > selectedTable.seats) {
    alert(`Table ${selectedTable.number} only fits ${selectedTable.seats} guests. Please choose fewer guests or a different table.`);
    return;
  }

  // Create reservation
  const newRes = {
    id: 'R' + String(reservations.length + 1).padStart(3, '0'),
    tableId: selectedTable.id,
    tableNumber: selectedTable.number,
    zone: selectedTable.zone,
    guestName: name,
    email,
    phone,
    date,
    time,
    guests: parseInt(guests),
    occasion: occasion || 'None',
    notes,
    status: 'confirmed',
  };

  reservations.push(newRes);

  // Mark table as reserved
  selectedTable.status = 'reserved';

  // Reset form
  document.getElementById('reservation-form').reset();
  document.getElementById('reservation-form').style.display = 'none';
  document.getElementById('selected-table-info').innerHTML = `
    <div class="no-selection">
      <div class="no-selection-icon">✦</div>
      <p>Select a table from the floor plan to begin your reservation</p>
    </div>
  `;
  selectedTable = null;

  // Re-render floor plan and table
  renderFloorPlan();
  renderReservationsTable();

  // Show confirmation modal
  showModal(newRes);
}

// ============================================================
// RESERVATIONS TABLE
// ============================================================
function renderReservationsTable() {
  const searchVal = (document.getElementById('search-res').value || '').toLowerCase();
  const zoneFilter = document.getElementById('filter-zone').value;

  const filtered = reservations.filter(r => {
    const matchSearch = r.guestName.toLowerCase().includes(searchVal)
      || r.email.toLowerCase().includes(searchVal)
      || String(r.tableNumber).includes(searchVal);
    const matchZone = !zoneFilter || r.zone === zoneFilter;
    return matchSearch && matchZone;
  });

  const tbody = document.getElementById('res-tbody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--muted);font-style:italic;">No reservations found</td></tr>`;
    document.getElementById('list-footer').textContent = '';
    return;
  }

  filtered.forEach(r => {
    const badgeMap = {
      confirmed: 'badge-confirmed',
      pending:   'badge-pending',
      seated:    'badge-seated',
      cancelled: 'badge-cancelled',
      completed: 'badge-completed',
    };
    const badgeClass = badgeMap[r.status] || 'badge-confirmed';
    const label = r.status.charAt(0).toUpperCase() + r.status.slice(1);

    const zoneEmoji = { 'Wine Cellar': '🍷', 'Main Dining': '🕯️', 'Terrace': '🌿' };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;color:var(--charcoal)">${escHtml(r.guestName)}</div>
        <div style="font-size:12px;color:var(--muted)">${escHtml(r.email)}</div>
      </td>
      <td style="font-weight:600">T${r.tableNumber}</td>
      <td>${zoneEmoji[r.zone] || ''} ${escHtml(r.zone)}</td>
      <td>${formatDate(r.date)}</td>
      <td>${escHtml(r.time)}</td>
      <td style="text-align:center">${r.guests}</td>
      <td>${r.occasion !== 'None' ? escHtml(r.occasion) : '<span style="color:var(--muted)">—</span>'}</td>
      <td><span class="badge ${badgeClass}">${label}</span></td>
      <td>
        ${r.status !== 'cancelled' && r.status !== 'completed' ? `
          <button class="btn-action" onclick="changeStatus('${r.id}', 'seated')" title="Mark seated">Seat</button>
          <button class="btn-action danger" onclick="changeStatus('${r.id}', 'cancelled')" title="Cancel">Cancel</button>
        ` : `<span style="color:var(--muted);font-size:12px">—</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('list-footer').textContent =
    `Showing ${filtered.length} of ${reservations.length} reservation${reservations.length !== 1 ? 's' : ''}`;
}

// ============================================================
// STATUS CHANGE
// ============================================================
function changeStatus(resId, newStatus) {
  const res = reservations.find(r => r.id === resId);
  if (!res) return;

  if (newStatus === 'cancelled') {
    const ok = confirm(`Cancel reservation for ${res.guestName}?`);
    if (!ok) return;
    // Free the table if the only active reservation on it
    const otherActive = reservations.filter(r =>
      r.tableId === res.tableId && r.id !== res.id &&
      !['cancelled', 'completed'].includes(r.status)
    );
    if (otherActive.length === 0) {
      const table = TABLES.find(t => t.id === res.tableId);
      if (table) table.status = 'available';
      renderFloorPlan();
    }
  }

  res.status = newStatus;
  renderReservationsTable();
}

// ============================================================
// MODAL
// ============================================================
function showModal(res) {
  document.getElementById('modal-message').innerHTML =
    `<strong>${escHtml(res.guestName)}</strong> — Table ${res.tableNumber} (${escHtml(res.zone)})<br/>
     ${formatDate(res.date)} at ${escHtml(res.time)} &nbsp;·&nbsp; ${res.guests} guest${res.guests > 1 ? 's' : ''}<br/>
     A confirmation has been sent to <strong>${escHtml(res.email)}</strong>.`;

  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// ============================================================
// UTILS
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
