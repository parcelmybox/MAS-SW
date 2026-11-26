import { pool } from "./db.js";
import {
  AREAS,
  STATUSES,
  assertTransition,
  businessPrefix,
  formatPhone,
  todayInMuscat,
  validateCancel,
  validateFollowUp,
  validateNewLead,
} from "./leadWorkflow.js";

const FROM = `
  FROM leads l
  LEFT JOIN lead_sale_details s ON s.lead_id = l.id
  LEFT JOIN vehicles sv ON sv.id = s.vehicle_id
  LEFT JOIN lead_rental_details r ON r.lead_id = l.id
  LEFT JOIN vehicles rv ON rv.id = r.vehicle_id
  LEFT JOIN lead_service_details g ON g.lead_id = l.id
  LEFT JOIN vehicles gv ON gv.id = g.vehicle_id
  LEFT JOIN customers c ON c.id = l.customer_id
  LEFT JOIN businesses b ON b.lead_id = l.id
`;

function day(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function money(value) {
  if (value == null || value === "") return null;
  return Number(value);
}

function vehicle(prefix, row) {
  if (!row[`${prefix}_id`]) return null;
  return {
    id: row[`${prefix}_id`],
    plateNumber: row[`${prefix}_plate`],
    make: row[`${prefix}_make`],
    model: row[`${prefix}_model`],
    modelYear: row[`${prefix}_year`],
    colour: row[`${prefix}_colour`],
    salePriceOmr: money(row[`${prefix}_sale`]),
    dailyRateOmr: money(row[`${prefix}_daily`]),
  };
}

function summaryOf(row) {
  if (row.area === "CAR_SALE") {
    if (row.sv_id) return `${row.sv_make} ${row.sv_model} · ${row.sv_plate}`;
    const preference = [row.s_make, row.s_model].filter(Boolean).join(" ") || "Open preference";
    const budget = row.s_budget != null ? `up to OMR ${Number(row.s_budget).toFixed(3)}` : null;
    return [preference, budget].filter(Boolean).join(" · ");
  }
  if (row.area === "CAR_RENTAL") {
    const car = row.rv_id
      ? `${row.rv_make} ${row.rv_model}`
      : row.r_category || [row.r_make, row.r_model].filter(Boolean).join(" ") || "Any car";
    return `${car} · ${row.r_days} days from ${day(row.r_start)}`;
  }
  const plate = row.g_plate || row.gv_plate || "Car not specified";
  return `${row.g_type} · ${plate} · ${day(row.g_date)}`;
}

function mapLead(row, events) {
  const saleVehicle = vehicle("sv", row);
  const rentalVehicle = vehicle("rv", row);
  const serviceVehicle = vehicle("gv", row);
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    phone: row.phone,
    phoneDisplay: formatPhone(row.phone),
    country: row.country,
    city: row.city,
    currency: row.currency,
    area: row.area,
    status: row.status,
    followUpDate: day(row.follow_up_date),
    notes: row.notes,
    summary: summaryOf(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    convertedAt: row.converted_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    sale: row.s_lead_id
      ? {
          vehicle: saleVehicle,
          preferredMake: row.s_make,
          preferredModel: row.s_model,
          yearFrom: row.s_year_from,
          yearTo: row.s_year_to,
          budgetOmr: money(row.s_budget),
        }
      : null,
    rental: row.r_lead_id
      ? {
          vehicle: rentalVehicle,
          preferredMake: row.r_make,
          preferredModel: row.r_model,
          category: row.r_category,
          startDate: day(row.r_start),
          durationDays: row.r_days,
          pickupArea: row.r_pickup,
        }
      : null,
    service: row.g_lead_id
      ? {
          vehicle: serviceVehicle,
          plateNumber: row.g_plate || serviceVehicle?.plateNumber || null,
          make: row.g_make || serviceVehicle?.make || null,
          model: row.g_model || serviceVehicle?.model || null,
          serviceType: row.g_type,
          scheduledDate: day(row.g_date),
          complaint: row.g_complaint,
        }
      : null,
    customer: row.c_id
      ? { id: row.c_id, reference: row.c_reference, name: row.c_name, phone: formatPhone(row.c_phone) }
      : null,
    business: row.b_id
      ? {
          id: row.b_id,
          reference: row.b_reference,
          area: row.b_area,
          summary: row.b_summary,
          openedAt: row.b_opened,
        }
      : null,
    events: events || undefined,
  };
}

const SELECT = `
  SELECT
    l.*,
    s.lead_id AS s_lead_id, s.preferred_make AS s_make, s.preferred_model AS s_model,
    s.year_from AS s_year_from, s.year_to AS s_year_to, s.budget_omr AS s_budget,
    sv.id AS sv_id, sv.plate_number AS sv_plate, sv.make AS sv_make, sv.model AS sv_model,
    sv.model_year AS sv_year, sv.colour AS sv_colour, sv.sale_price_omr AS sv_sale, sv.daily_rate_omr AS sv_daily,
    r.lead_id AS r_lead_id, r.preferred_make AS r_make, r.preferred_model AS r_model, r.category AS r_category,
    r.start_date AS r_start, r.duration_days AS r_days, r.pickup_area AS r_pickup,
    rv.id AS rv_id, rv.plate_number AS rv_plate, rv.make AS rv_make, rv.model AS rv_model,
    rv.model_year AS rv_year, rv.colour AS rv_colour, rv.sale_price_omr AS rv_sale, rv.daily_rate_omr AS rv_daily,
    g.lead_id AS g_lead_id, g.plate_number AS g_plate, g.make AS g_make, g.model AS g_model,
    g.service_type AS g_type, g.scheduled_date AS g_date, g.complaint AS g_complaint,
    gv.id AS gv_id, gv.plate_number AS gv_plate, gv.make AS gv_make, gv.model AS gv_model,
    gv.model_year AS gv_year, gv.colour AS gv_colour, gv.sale_price_omr AS gv_sale, gv.daily_rate_omr AS gv_daily,
    c.id AS c_id, c.reference AS c_reference, c.name AS c_name, c.phone AS c_phone,
    b.id AS b_id, b.reference AS b_reference, b.area AS b_area, b.summary AS b_summary, b.opened_at AS b_opened
`;

function httpError(status, message, fields) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  return error;
}

async function nextReference(client, docType, prefix) {
  const { rows } = await client.query(
    `INSERT INTO doc_counters (doc_type, last_number) VALUES ($1, 1)
     ON CONFLICT (doc_type) DO UPDATE SET last_number = doc_counters.last_number + 1
     RETURNING last_number`,
    [docType]
  );
  return `${prefix}-${String(rows[0].last_number).padStart(4, "0")}`;
}

async function fetchLead(client, id) {
  const { rows } = await client.query(`${SELECT} ${FROM} WHERE l.id = $1`, [id]);
  return rows[0] || null;
}

export async function listLeads({ status, area, q }) {
  if (status && !STATUSES.includes(status)) throw httpError(400, "Unknown lead status.");
  if (area && !AREAS.includes(area)) throw httpError(400, "Unknown area of interest.");
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`l.status = $${params.length}`);
  }
  if (area) {
    params.push(area);
    where.push(`l.area = $${params.length}`);
  }
  if (q && String(q).trim()) {
    params.push(`%${String(q).trim()}%`);
    where.push(`(l.name ILIKE $${params.length} OR l.phone ILIKE $${params.length} OR l.reference ILIKE $${params.length})`);
  }
  const sql = `${SELECT} ${FROM} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY l.created_at DESC`;
  const { rows } = await pool.query(sql, params);
  return rows.map((row) => mapLead(row));
}

export async function listFollowUps() {
  const { rows } = await pool.query(
    `${SELECT} ${FROM}
     WHERE l.status = 'FOLLOW_UP' AND l.follow_up_date IS NOT NULL
     ORDER BY l.follow_up_date ASC, l.id ASC`
  );
  const today = todayInMuscat();
  return rows.map((row) => {
    const lead = mapLead(row);
    return {
      ...lead,
      dueState: lead.followUpDate < today ? "overdue" : lead.followUpDate === today ? "today" : "upcoming",
    };
  });
}

export async function getLead(id) {
  const client = await pool.connect();
  try {
    const row = await fetchLead(client, id);
    if (!row) return null;
    const events = await client.query(
      `SELECT id, event_type, from_status, to_status, note, follow_up_date, created_at
       FROM lead_events WHERE lead_id = $1 ORDER BY created_at ASC, id ASC`,
      [id]
    );
    return mapLead(
      row,
      events.rows.map((event) => ({
        id: event.id,
        type: event.event_type,
        fromStatus: event.from_status,
        toStatus: event.to_status,
        note: event.note,
        followUpDate: day(event.follow_up_date),
        createdAt: event.created_at,
      }))
    );
  } finally {
    client.release();
  }
}

async function requireVehicle(client, vehicleId, purposes) {
  if (!vehicleId) return null;
  const { rows } = await client.query("SELECT * FROM vehicles WHERE id = $1", [vehicleId]);
  const vehicleRow = rows[0];
  if (!vehicleRow) throw httpError(400, "That car is not on the Muscat list.", { vehicleId: "Choose a car from the list." });
  if (purposes && !purposes.includes(vehicleRow.purpose)) {
    throw httpError(400, "That car is not offered for this kind of enquiry.", { vehicleId: "Choose a car offered for this enquiry." });
  }
  return vehicleRow;
}

export async function createLead(body) {
  const parsed = validateNewLead(body || {});
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.fields);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { lead } = parsed;
    if (lead.sale?.vehicleId) await requireVehicle(client, lead.sale.vehicleId, ["SALE", "BOTH"]);
    if (lead.rental?.vehicleId) await requireVehicle(client, lead.rental.vehicleId, ["RENTAL", "BOTH"]);
    const serviceVehicle = lead.service?.vehicleId ? await requireVehicle(client, lead.service.vehicleId) : null;

    const reference = await nextReference(client, "LEAD", "MAS-LD");
    const inserted = await client.query(
      `INSERT INTO leads (reference, name, phone, country, city, currency, area, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'NEW_ENQUIRY', $8)
       RETURNING id`,
      [reference, lead.name, lead.phone, lead.country, lead.city, lead.currency, lead.area, lead.notes]
    );
    const id = inserted.rows[0].id;

    if (lead.sale) {
      const sale = lead.sale;
      await client.query(
        `INSERT INTO lead_sale_details (lead_id, vehicle_id, preferred_make, preferred_model, year_from, year_to, budget_omr)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, sale.vehicleId, sale.preferredMake, sale.preferredModel, sale.yearFrom, sale.yearTo, sale.budgetOmr]
      );
    }
    if (lead.rental) {
      const rental = lead.rental;
      await client.query(
        `INSERT INTO lead_rental_details
          (lead_id, vehicle_id, preferred_make, preferred_model, category, start_date, duration_days, pickup_area)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, rental.vehicleId, rental.preferredMake, rental.preferredModel, rental.category, rental.startDate, rental.durationDays, rental.pickupArea]
      );
    }
    if (lead.service) {
      const service = lead.service;
      await client.query(
        `INSERT INTO lead_service_details
          (lead_id, vehicle_id, plate_number, make, model, service_type, scheduled_date, complaint)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          service.vehicleId,
          service.plateNumber || serviceVehicle?.plate_number || null,
          service.make || serviceVehicle?.make || null,
          service.model || serviceVehicle?.model || null,
          service.serviceType,
          service.scheduledDate,
          service.complaint,
        ]
      );
    }

    await client.query(
      `INSERT INTO lead_events (lead_id, event_type, to_status, note) VALUES ($1, 'CREATED', 'NEW_ENQUIRY', $2)`,
      [id, lead.notes || "Enquiry received in Muscat."]
    );
    await client.query("COMMIT");
    return getLead(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function lockLead(client, id) {
  const { rows } = await client.query("SELECT id, status, area, name, phone FROM leads WHERE id = $1 FOR UPDATE", [id]);
  if (!rows[0]) throw httpError(404, "Lead not found.");
  return rows[0];
}

export async function scheduleFollowUp(id, body) {
  const parsed = validateFollowUp(body || {});
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.fields);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await lockLead(client, id);
    assertTransition(current.status, "FOLLOW_UP");
    await client.query(
      `UPDATE leads
       SET status = 'FOLLOW_UP', follow_up_date = $2, updated_at = now()
       WHERE id = $1`,
      [id, parsed.followUpDate]
    );
    await client.query(
      `INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, follow_up_date)
       VALUES ($1, 'FOLLOW_UP_SET', $2, 'FOLLOW_UP', $3, $4)`,
      [id, current.status, parsed.note, parsed.followUpDate]
    );
    await client.query("COMMIT");
    return getLead(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelLead(id, body) {
  const parsed = validateCancel(body || {});
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.fields);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await lockLead(client, id);
    assertTransition(current.status, "CANCELLED");
    await client.query(
      `UPDATE leads
       SET status = 'CANCELLED', follow_up_date = NULL, cancel_reason = $2, cancelled_at = now(), updated_at = now()
       WHERE id = $1`,
      [id, parsed.reason]
    );
    await client.query(
      `INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note)
       VALUES ($1, 'CANCELLED', $2, 'CANCELLED', $3)`,
      [id, current.status, parsed.reason]
    );
    await client.query("COMMIT");
    return getLead(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function describeBusiness(row) {
  if (row.area === "CAR_SALE") {
    if (row.sv_id) return `Sale of ${row.sv_make} ${row.sv_model} ${row.sv_plate}.`;
    const preference = [row.s_make, row.s_model].filter(Boolean).join(" ") || "open preference";
    const budget = row.s_budget != null ? ` Budget OMR ${Number(row.s_budget).toFixed(3)}.` : "";
    return `Car sale enquiry for ${preference}.${budget}`;
  }
  if (row.area === "CAR_RENTAL") {
    const car = row.rv_id ? `${row.rv_make} ${row.rv_model} ${row.rv_plate}` : row.r_category || [row.r_make, row.r_model].filter(Boolean).join(" ") || "preferred car";
    return `Rental of ${car} for ${row.r_days} days from ${day(row.r_start)}, pickup ${row.r_pickup}.`;
  }
  const plate = row.g_plate || row.gv_plate || "customer car";
  return `${row.g_type} for ${plate}, scheduled ${day(row.g_date)}.`;
}

export async function convertLead(id, body) {
  const note = String(body?.note || "").trim() || "Lead became a customer and a business file was opened.";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await lockLead(client, id);
    assertTransition(current.status, "CONVERTED");
    const row = await fetchLead(client, id);
    const summary = describeBusiness(row);

    const existing = await client.query("SELECT id, reference FROM customers WHERE phone = $1", [current.phone]);
    let customerId;
    let customerReference;
    if (existing.rows[0]) {
      customerId = existing.rows[0].id;
      customerReference = existing.rows[0].reference;
    } else {
      customerReference = await nextReference(client, "CUSTOMER", "MAS-CU");
      const created = await client.query(
        `INSERT INTO customers (reference, name, phone, created_from_lead_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [customerReference, current.name, current.phone, id]
      );
      customerId = created.rows[0].id;
    }

    const prefix = businessPrefix(current.area);
    const businessReference = await nextReference(client, prefix.docType, prefix.prefix);
    await client.query(
      `INSERT INTO businesses (reference, lead_id, customer_id, area, summary)
       VALUES ($1, $2, $3, $4, $5)`,
      [businessReference, id, customerId, current.area, summary]
    );
    await client.query(
      `UPDATE leads
       SET status = 'CONVERTED', customer_id = $2, follow_up_date = NULL,
           converted_at = now(), updated_at = now()
       WHERE id = $1`,
      [id, customerId]
    );
    await client.query(
      `INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note)
       VALUES ($1, 'CONVERTED', $2, 'CONVERTED', $3)`,
      [id, current.status, `${note} Customer ${customerReference}. Business ${businessReference}.`]
    );
    await client.query("COMMIT");
    return getLead(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function dashboard() {
  const countsResult = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'NEW_ENQUIRY')::int AS new_enquiry,
      COUNT(*) FILTER (WHERE status = 'FOLLOW_UP')::int AS follow_up,
      COUNT(*) FILTER (WHERE status = 'CONVERTED')::int AS converted,
      COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
      COUNT(*) FILTER (WHERE status = 'FOLLOW_UP' AND follow_up_date < CURRENT_DATE)::int AS overdue,
      COUNT(*) FILTER (WHERE status = 'FOLLOW_UP' AND follow_up_date = CURRENT_DATE)::int AS due_today
    FROM leads
  `);
  const areaResult = await pool.query(`
    SELECT area,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'CONVERTED')::int AS converted
    FROM leads
    GROUP BY area
  `);
  const recent = await pool.query(`${SELECT} ${FROM} ORDER BY l.created_at DESC LIMIT 6`);
  const counts = countsResult.rows[0];
  const byArea = AREAS.map((area) => {
    const row = areaResult.rows.find((item) => item.area === area);
    const total = row?.total || 0;
    const converted = row?.converted || 0;
    return {
      area,
      total,
      converted,
      rate: total ? Math.round((converted / total) * 1000) / 10 : 0,
    };
  });
  return {
    country: "Oman",
    city: "Muscat",
    currency: "OMR",
    counts: {
      total: counts.total,
      newEnquiry: counts.new_enquiry,
      followUp: counts.follow_up,
      converted: counts.converted,
      cancelled: counts.cancelled,
      overdue: counts.overdue,
      dueToday: counts.due_today,
    },
    conversionRate: counts.total ? Math.round((counts.converted / counts.total) * 1000) / 10 : 0,
    byArea,
    recent: recent.rows.map((row) => mapLead(row)),
  };
}

export async function listVehicles(purpose) {
  const params = [];
  let where = "";
  if (purpose === "SALE") where = "WHERE purpose IN ('SALE', 'BOTH')";
  else if (purpose === "RENTAL") where = "WHERE purpose IN ('RENTAL', 'BOTH')";
  else if (purpose) throw httpError(400, "Purpose must be SALE or RENTAL.");
  const { rows } = await pool.query(
    `SELECT id, plate_number, make, model, model_year, colour, purpose, sale_price_omr, daily_rate_omr, status, branch
     FROM vehicles ${where} ORDER BY make, model`,
    params
  );
  return rows.map((row) => ({
    id: row.id,
    plateNumber: row.plate_number,
    make: row.make,
    model: row.model,
    modelYear: row.model_year,
    colour: row.colour,
    purpose: row.purpose,
    salePriceOmr: money(row.sale_price_omr),
    dailyRateOmr: money(row.daily_rate_omr),
    status: row.status,
    branch: row.branch,
    label: `${row.make} ${row.model} · ${row.plate_number}`,
  }));
}
