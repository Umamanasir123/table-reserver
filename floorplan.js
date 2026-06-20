// ============================================================
// FLOORPLAN RENDERER
// ============================================================

function renderFloorPlan(selectedId = null) {
  const container = document.getElementById('floorplan-map');
  const SVG_W = 840;
  const SVG_H = 310;

  let svg = `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" 
    style="width:100%;height:auto;display:block;">`;

  // Background zones
  svg += `
    <!-- Wine Cellar zone bg -->
    <rect x="40" y="30" width="230" height="250" rx="12" fill="#F0EDE6" stroke="#DDD5C4" stroke-width="1"/>
    <text x="155" y="22" class="floor-zone-label" text-anchor="middle" 
      font-family="Inter,sans-serif" font-size="10" font-weight="700" letter-spacing="0.08em" 
      text-transform="uppercase" fill="#7A7168">🍷 WINE CELLAR</text>

    <!-- Main Dining zone bg -->
    <rect x="288" y="30" width="330" height="250" rx="12" fill="#F4F2EE" stroke="#DDD5C4" stroke-width="1"/>
    <text x="453" y="22" class="floor-zone-label" text-anchor="middle"
      font-family="Inter,sans-serif" font-size="10" font-weight="700" letter-spacing="0.08em"
      fill="#7A7168">🕯️ MAIN DINING</text>

    <!-- Terrace zone bg -->
    <rect x="628" y="30" width="196" height="250" rx="12" fill="#EDF2EC" stroke="#DDD5C4" stroke-width="1"/>
    <text x="726" y="22" class="floor-zone-label" text-anchor="middle"
      font-family="Inter,sans-serif" font-size="10" font-weight="700" letter-spacing="0.08em"
      fill="#7A7168">🌿 TERRACE</text>
  `;

  // Entrance/bar hint
  svg += `
    <rect x="350" y="265" width="120" height="8" rx="4" fill="#C9A84C" opacity="0.3"/>
    <text x="410" y="280" text-anchor="middle" font-family="Inter,sans-serif" 
      font-size="9" fill="#7A7168" letter-spacing="0.06em">ENTRANCE / BAR</text>
  `;

  // Draw each table
  TABLES.forEach(table => {
    const status = selectedId === table.id ? 'selected' : table.status;
    const cx = table.x + table.w / 2;
    const cy = table.y + table.h / 2;
    const radius = Math.min(table.w, table.h) / 2 + 12;

    // Chair positions (evenly around table)
    const chairCount = Math.min(table.seats, 8);
    const chairAngles = [];
    for (let i = 0; i < chairCount; i++) {
      chairAngles.push((2 * Math.PI * i) / chairCount - Math.PI / 2);
    }

    svg += `<g class="table-group ${status}" data-id="${table.id}" 
      onclick="handleTableClick('${table.id}')">`;

    // Draw chairs
    chairAngles.forEach(angle => {
      const cx2 = cx + Math.cos(angle) * radius;
      const cy2 = cy + Math.sin(angle) * radius;
      svg += `<circle class="chair-circle" cx="${cx2.toFixed(1)}" cy="${cy2.toFixed(1)}" r="5"/>`;
    });

    // Table rectangle
    svg += `<rect class="table-rect" x="${table.x}" y="${table.y}" 
      width="${table.w}" height="${table.h}" rx="8" ry="8"/>`;

    // Table number
    svg += `<text class="table-number" x="${cx}" y="${cy - 7}">T${table.number}</text>`;

    // Seat count
    svg += `<text class="table-seats" x="${cx}" y="${cy + 8}">${table.seats} seats</text>`;

    svg += `</g>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

function handleTableClick(tableId) {
  const table = TABLES.find(t => t.id === tableId);
  if (!table || table.status === 'reserved') return;

  // Re-render with new selection
  renderFloorPlan(tableId);

  // Populate form panel
  showReservationForm(table);
}
