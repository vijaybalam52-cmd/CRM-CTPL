"""Call Entry related routes."""
from flask import Blueprint, render_template, jsonify, request
from flask_login import current_user
from mysql.connector import Error
from datetime import date, datetime, time, timedelta
import traceback
from database import get_connection, dict_from_row
from config import DB_CONFIG

call_entry_bp = Blueprint('call_entry', __name__)


def _serialize_value(val):
    if isinstance(val, (datetime, date, time)):
        return val.isoformat()
    if isinstance(val, timedelta):
        total_seconds = int(val.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return val


def _serialize_row(row):
    if not isinstance(row, dict):
        return row
    return {k: _serialize_value(v) for k, v in row.items()}


def _fetch_option_rows():
    """Fetch security and status option rows for dropdowns."""
    cnx = cur = None
    security_options = []
    status_options = []
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)

        cur.execute("SELECT id, security_option FROM security_options ORDER BY security_option")
        security_options = cur.fetchall() or []

        cur.execute("SELECT id, status_option FROM status_options ORDER BY status_option")
        status_options = cur.fetchall() or []
    except Exception:
        security_options = []
        status_options = []
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception:
            pass
    return security_options, status_options


@call_entry_bp.route("/")
@call_entry_bp.route("/call-entry")
def index():
    security_options, status_options = _fetch_option_rows()
    return render_template(
        "call_entry.html",
        security_options=security_options,
        status_options=status_options,
    )


@call_entry_bp.route("/api/company-suggest")
def company_suggest():
    """Return company suggestions once user types at least 2 chars."""
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify({"companies": []})

    normalized_query = "".join(query.lower().split())

    sql = """
        SELECT id, name, address3
        FROM companies
        WHERE REPLACE(LOWER(name), ' ', '') LIKE %s
        ORDER BY CASE WHEN REPLACE(LOWER(name), ' ', '') LIKE %s THEN 0 ELSE 1 END, name
        LIMIT 10
    """
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor() 
        cur.execute(sql, (f"%{normalized_query}%", f"{normalized_query}%"))
        rows = cur.fetchall()
        companies = []
        for row in rows:
            companies.append({"id": row[0], "name": row[1], "address3": row[2]})
        return jsonify({"companies": companies})
    except Error as exc:
        error_msg = str(exc)
        error_trace = traceback.format_exc()
        print(f"Database Error in company_suggest: {error_msg}")
        print(f"Traceback: {error_trace}")
        return jsonify({"error": error_msg, "type": "database_error"}), 500
    except Exception as exc:
        error_msg = str(exc)
        error_trace = traceback.format_exc()
        print(f"General Error in company_suggest: {error_msg}")
        print(f"Traceback: {error_trace}")
        return jsonify({"error": error_msg, "type": "general_error", "traceback": error_trace}), 500
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception as e:
            print(f"Error closing connection: {e}")


@call_entry_bp.route("/api/company/<int:company_id>")
def company_details(company_id):
    """Get full company details plus related machines and contacts."""
    company_sql = """
        SELECT c.id, c.name, c.address1, c.address2, c.address3, c.city, c.state, c.pin, c.country,
               c.route, c.zone, c.area, c.cluster, c.gstin,
               c.weekly_off_start, c.weekly_off_end, c.working_hrs_start, c.working_hrs_end,
               c.security AS security_id, so.security_option AS security
        FROM companies c
        LEFT JOIN security_options so ON so.id = c.security
        WHERE c.id = %s
    """
    machines_sql = """
        SELECT m.id, m.company_id, m.ticket_no, m.mc_no, m.model,
               m.status AS status_id, st.status_option AS status,
               m.start_dt, m.end_dt,
               m.Inv_No AS inv_no, m.Inv_Dt AS inv_dt, m.Inv_Value AS inv_value
        FROM machines m
        LEFT JOIN status_options st ON st.id = m.status
        WHERE company_id = %s
        ORDER BY id DESC 
        LIMIT 20
    """
    contacts_sql = """
        SELECT id, name, phone, email, designation
        FROM contacts
        WHERE company_id = %s
        ORDER BY id DESC
        LIMIT 20
    """
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)

        # Company
        cur.execute(company_sql, (company_id,))
        company = cur.fetchone()
        if not company:
            return jsonify({"error": "Company not found"}), 404
        company = _serialize_row(company)

        # Machines
        cur.execute(machines_sql, (company_id,))
        machines = cur.fetchall() or []
        machines = [_serialize_row(m) for m in machines]

        # Contacts
        cur.execute(contacts_sql, (company_id,))
        contacts = cur.fetchall() or []
        contacts = [_serialize_row(c) for c in contacts]

        return jsonify({
            "company": company,
            "machines": machines,
            "contacts": contacts,
        })
    except Error as exc: 
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            cur.close()
            cnx.close()
        except Exception:   
            pass


@call_entry_bp.route("/api/company/<int:company_id>", methods=["PUT"])
def update_company(company_id):
    """Update company details from the Call Entry form."""
    data = request.get_json(silent=True) or {}

    def clean_text(key):
        value = data.get(key)
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def to_int_or_none(value):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)

        security_id = to_int_or_none(data.get("company_security_id"))
        security_text = clean_text("company_security")
        if security_id is None and security_text:
            cur.execute(
                "SELECT id FROM security_options WHERE LOWER(security_option) = LOWER(%s) LIMIT 1",
                (security_text,),
            )
            security_row = cur.fetchone()
            security_id = security_row.get("id") if security_row else None

        update_sql = """
            UPDATE companies
            SET name = %s,
                address1 = %s,
                address2 = %s,
                address3 = %s,
                city = %s,
                state = %s,
                pin = %s,
                country = %s,
                route = %s,
                zone = %s,
                area = %s,
                cluster = %s,
                gstin = %s,
                weekly_off_start = %s,
                weekly_off_end = %s,
                working_hrs_start = %s,
                working_hrs_end = %s,
                security = %s
            WHERE id = %s
        """
        values = (
            clean_text("company_name"),
            clean_text("company_street"),
            clean_text("company_area"),
            clean_text("company_address3"),
            clean_text("company_city"),
            clean_text("company_state"),
            clean_text("company_pin"),
            clean_text("company_country"),
            clean_text("company_route"),
            clean_text("company_zone"),
            clean_text("company_area_zarc"),
            clean_text("company_cluster"),
            clean_text("company_gstin"),
            clean_text("company_weekly_off_start"),
            clean_text("company_weekly_off_end"),
            clean_text("company_working_hrs_start"),
            clean_text("company_working_hrs_end"),
            security_id,
            company_id,
        )
        cur.execute(update_sql, values)
        if cur.rowcount == 0:
            cur.execute("SELECT id FROM companies WHERE id = %s", (company_id,))
            if not cur.fetchone():
                cnx.rollback()
                return jsonify({"error": "Company not found"}), 404

        cnx.commit()
        return jsonify({"message": "Company updated successfully", "company_id": company_id})
    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception:
            pass


@call_entry_bp.route("/api/machine-suggest")    
def machine_suggest():
    """Return machine suggestions by mc_no once user types at least 2 chars."""
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify({"machines": []})

    sql = """
        SELECT m.id, m.mc_no, m.company_id, c.name AS company_name, c.address3
        FROM machines m
        JOIN companies c ON c.id = m.company_id
        WHERE m.mc_no LIKE %s
        ORDER BY m.mc_no
        LIMIT 10
    """
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        cur.execute(sql, (f"%{query}%",))
        rows = cur.fetchall()
        machines = []
        for row in rows:
            machines.append(
                {
                    "id": row[0],
                    "mc_no": row[1],
                    "company_id": row[2],
                    "company_name": row[3],
                    "address3": row[4],
                }
            )
        return jsonify({"machines": machines})
    except Error as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            cur.close()
            cnx.close()
        except Exception:
            pass


@call_entry_bp.route("/api/machine/<int:machine_id>")
def machine_details(machine_id):
    """Return a machine, its company, contacts, latest ticket, and ticket list."""
    machine_sql = """
        SELECT m.id, m.company_id, m.ticket_no, m.mc_no, m.model,
               m.status AS status_id, st.status_option AS status,
               m.start_dt, m.end_dt, m.Inv_No AS inv_no,
               m.Inv_Dt AS inv_dt, m.Inv_Value AS inv_value,
               c.name AS company_name, c.address1, c.address2, c.address3, c.city, c.state, c.pin, c.country,
               c.route, c.zone, c.area, c.cluster, c.gstin, c.weekly_off_start,
               c.weekly_off_end, c.working_hrs_start, c.working_hrs_end,
               c.security AS security_id, so.security_option AS security
        FROM machines m
        JOIN companies c ON c.id = m.company_id
        LEFT JOIN status_options st ON st.id = m.status
        LEFT JOIN security_options so ON so.id = c.security
        WHERE m.id = %s
    """
    contacts_sql = """
        SELECT id, name, phone, email, designation
        FROM contacts
        WHERE machine_id = %s
        ORDER BY id DESC
        LIMIT 10
    """
    ticket_sql = """
         SELECT t.id AS ticket_id, t.ticket_no, t.company_id, t.machine_id, t.contact_id,
             ti.id AS issue_id, ti.date, ti.start_time, ti.end_time, ti.log_by, 
             cont.name AS customer_name,
             ti.fault, ti.priority, ti.status AS issue_status, t.status AS ticket_status
         FROM tickets t
         LEFT JOIN ticket_issues ti ON ti.ticket_id = t.id
         LEFT JOIN contacts cont ON ti.contact_id = cont.id
         WHERE t.machine_id = %s AND t.status = 'open' AND ti.status = 'open'
         ORDER BY ti.date DESC, ti.id DESC
         LIMIT 1
    """
    tickets_sql = """
         SELECT t.id AS ticket_id, t.ticket_no, t.company_id, t.machine_id,
             ti.id AS issue_id, ti.date, ti.start_time, ti.end_time, ti.log_by, cont.id AS contact_id,
             ti.fault, ti.priority, ti.status AS issue_status, t.status AS ticket_status, cont.name AS customer_name
         FROM tickets t
         LEFT JOIN ticket_issues ti ON ti.ticket_id = t.id
         LEFT JOIN contacts cont ON ti.contact_id = cont.id
         WHERE t.machine_id = %s AND t.status = 'open' AND ti.status = 'open'
         ORDER BY ti.date DESC, ti.id DESC
         LIMIT 50
    """
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)

        cur.execute(machine_sql, (machine_id,))
        machine = cur.fetchone()
        if not machine:
            return jsonify({"error": "Machine not found"}), 404
        machine = _serialize_row(machine)

        cur.execute(contacts_sql, (machine_id,))
        contacts = cur.fetchall() or []
        contacts = [_serialize_row(c) for c in contacts]

        cur.execute(ticket_sql, (machine_id,))
        ticket = cur.fetchone()
        ticket = _serialize_row(ticket) if ticket else None

        cur.execute(tickets_sql, (machine_id,))
        tickets = cur.fetchall() or []
        tickets = [_serialize_row(t) for t in tickets]

        # Normalize ticket dict keys for frontend compatibility:
        # Frontend expects each ticket to have a `status` field (used to filter open tickets).
        # Prefer the issue-level status (`issue_status`) if present, otherwise fall back to ticket-level status.
        def _normalize_ticket_row(tr):
            if not isinstance(tr, dict):
                return tr
            status = tr.get('issue_status') or tr.get('ticket_status') or tr.get('status')
            tr['status'] = status
            # Ensure ticket_no key exists (some queries alias differently)
            if 'ticket_no' not in tr and 'ticketno' in tr:
                tr['ticket_no'] = tr.get('ticketno')
            return tr

        ticket = _normalize_ticket_row(ticket) if ticket else None
        tickets = [_normalize_ticket_row(t) for t in tickets]

        # Attempt to resolve cluster zarc from company zone/area/route/cluster
        cluster_zarc = None
        try:
            z_val = machine.get('zone')
            a_val = machine.get('area')
            r_val = machine.get('route')
            c_val = machine.get('cluster')
            cur.execute(
                "SELECT zarc FROM cluster WHERE z=%s AND a=%s AND r=%s AND c=%s LIMIT 1",
                (z_val, a_val, r_val, c_val),
            )
            cz = cur.fetchone()
            if cz:
                cluster_zarc = cz.get('zarc') if isinstance(cz, dict) else (cz[0] if cz else None)
        except Exception:
            cluster_zarc = None

        # Load short_form entries (frontend can decide how to use them with cluster_zarc)
        short_forms = []
        try:
            cur.execute("SELECT id, short_form, f, prior, purpose, priority FROM short_form")
            sf_rows = cur.fetchall() or []
        except Error:
            # Fallback: inspect available columns and select compatible aliases
            try:
                cur.execute("SHOW COLUMNS FROM short_form")
                cols = [r[0] for r in cur.fetchall()]
                sf_col = next((c for c in cols if c.lower() in ('short_form', 'shortform', 'short', 'sf', 'name', 'code')), None)
                f_col = next((c for c in cols if c.lower() == 'f'), None)
                prior_col = next((c for c in cols if c.lower() in ('prior', 'prio', 'priority_code')), None)
                purpose_col = next((c for c in cols if c.lower() in ('purpose',)), None)
                priority_col = next((c for c in cols if c.lower() in ('priority',)), None)

                select_parts = ["id"]
                select_parts.append(sf_col if sf_col else "NULL AS short_form")
                select_parts.append(f_col if f_col else "NULL AS f")
                select_parts.append(prior_col if prior_col else "NULL AS prior")
                select_parts.append(purpose_col if purpose_col else "NULL AS purpose")
                select_parts.append(priority_col if priority_col else "NULL AS priority")

                select_sql = "SELECT " + ", ".join(select_parts) + " FROM short_form"
                cur.execute(select_sql)
                sf_rows = cur.fetchall() or []
            except Exception:
                sf_rows = []

        for r in sf_rows:
            if isinstance(r, dict):
                short_forms.append(r)
            else:
                # Expect tuple order: id, short_form, f, prior, purpose, priority
                try:
                    short_forms.append({
                        'id': r[0], 'short_form': r[1], 'f': r[2], 'prior': r[3], 'purpose': r[4], 'priority': r[5]
                    })
                except Exception:
                    # Skip malformed rows
                    continue

        return jsonify({
            "machine": machine,
            "company": {
                "id": machine.get("company_id"),
                "name": machine.get("company_name"),
                "address1": machine.get("address1"),
                "address2": machine.get("address2"),
                "address3": machine.get("address3"),
                "city": machine.get("city"),
                "state": machine.get("state"),
                "pin": machine.get("pin"),
                "route": machine.get("route"),
                "zone": machine.get("zone"),
                "area": machine.get("area"),
                "cluster": machine.get("cluster"),
                "gstin": machine.get("gstin"),
                "weekly_off_start": machine.get("weekly_off_start"),
                "weekly_off_end": machine.get("weekly_off_end"),
                "working_hrs_start": machine.get("working_hrs_start"),
                "working_hrs_end": machine.get("working_hrs_end"),
                "security_id": machine.get("security_id"),
                "security": machine.get("security"),
            },
            "contacts": contacts,
            "latest_ticket": ticket,
            "tickets": tickets,
            "cluster_zarc": cluster_zarc,
            "short_forms": short_forms,
        })
    except Error as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            cur.close()
            cnx.close()
        except Exception:
            pass


@call_entry_bp.route("/api/add-new-entry", methods=["POST"])
def add_new_entry():
    """Save company, machines, and contacts from Add New Entry form."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        def to_int_or_none(val):
            if val is None or val == '':
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        # 1. Insert Company
        company_sql = """
            INSERT INTO companies (name, address1, address2, address3, city, state, pin, country, route, zone, area, cluster, gstin,
                                   weekly_off_start, weekly_off_end, working_hrs_start, working_hrs_end, security)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        company_values = (
            data.get("company_name", "").strip() or None,
            data.get("company_street", "").strip() or None,  # address1
            data.get("company_area", "").strip() or None,  # address2
            data.get("company_address3", "").strip() or None,  # address3
            data.get("company_city", "").strip() or None,
            data.get("company_state", "").strip() or None,
            data.get("company_pin", "").strip() or None,
            data.get("company_country", "").strip() or None,
            data.get("company_route", "").strip() or None,
            data.get("company_zone", "").strip() or None,
            data.get("company_area_zarc", "").strip() or None,  # area (ZARC)
            data.get("company_cluster", "").strip() or None,
            data.get("company_gstin", "").strip() or None,
            data.get("company_weekly_off_start", "").strip() or None,
            data.get("company_weekly_off_end", "").strip() or None,
            data.get("company_working_hrs_start") or None,
            data.get("company_working_hrs_end") or None,
            to_int_or_none(data.get("company_security")),
        )
        cur.execute(company_sql, company_values)
        company_id = cur.lastrowid
        cnx.commit()

        # 2. Insert Machines
        machines = data.get("machines", [])
        machine_ids = []
        if machines:
            # Check for unique MC No
            for m in machines:
                mc_no = m.get("mc_no", "").strip()
                if mc_no:
                    cur.execute("SELECT id FROM machines WHERE mc_no = %s", (mc_no,))
                    if cur.fetchone():
                        cur.close()
                        cnx.close()
                        return jsonify({"error": f"Machine number '{mc_no}' already exists"}), 409
            
            machine_sql = """
                INSERT INTO machines (company_id, mc_no, model, status, start_dt, end_dt,
                                      Inv_No, Inv_Dt, Inv_Value)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            for m in machines:
                machine_values = (
                    company_id,
                    m.get("mc_no", "").strip() or None,
                    m.get("model", "").strip() or None,
                    to_int_or_none(m.get("status")),
                    m.get("start_dt") or None,
                    m.get("end_dt") or None,
                    m.get("inv_no", "").strip() or None,
                    m.get("inv_dt") or None,
                    m.get("inv_value", "").strip() or None,
                )
                cur.execute(machine_sql, machine_values)
                machine_ids.append(cur.lastrowid)
            cnx.commit()

        # 3. Insert Contacts (link to first machine if available, else company only)
        contacts = data.get("contacts", [])
        contact_ids = []
        if contacts:
            contact_sql = """
                INSERT INTO contacts (company_id, machine_id, name, phone, email, designation)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            for c in contacts:
                contact_values = (
                    company_id,
                    machine_ids[0] if machine_ids else None,  # Link to first machine if available
                    c.get("name", "").strip() or None,
                    c.get("phone", "").strip() or None,
                    c.get("email", "").strip() or None,
                    c.get("designation", "").strip() or None,
                )
                cur.execute(contact_sql, contact_values)
                contact_ids.append(cur.lastrowid)
            cnx.commit()

        cur.close()
        cnx.close()

        return jsonify({
            "success": True,
            "company_id": company_id,
            "machine_ids": machine_ids,
            "contact_ids": contact_ids,
            "message": "Entry saved successfully"
        })

    except Error as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@call_entry_bp.route("/api/add-contact", methods=["POST"])
def add_contact():
    """Add a new contact for an existing company and machine."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Convert to int or None, handling string values
        def to_int_or_none(val):
            if val is None or val == '':
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        company_id = to_int_or_none(data.get("company_id"))
        machine_id = to_int_or_none(data.get("machine_id"))
        name = data.get("name", "").strip()
        phone = data.get("phone", "").strip()
        email = data.get("email", "").strip()
        designation = data.get("designation", "").strip()

        if not company_id:
            return jsonify({"error": "company_id is required"}), 400
        if not machine_id:
            return jsonify({"error": "machine_id is required"}), 400
        if not name:
            return jsonify({"error": "name is required"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        contact_sql = """
            INSERT INTO contacts (company_id, machine_id, name, phone, email, designation)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        contact_values = (
            company_id,
            machine_id,
            name or None,
            phone or None,
            email or None,
            designation or None,
        )
        cur.execute(contact_sql, contact_values)
        contact_id = cur.lastrowid
        cnx.commit()

        cur.close()
        cnx.close()

        return jsonify({
            "success": True,
            "contact_id": contact_id,
            "message": "Contact added successfully"
        })

    except Error as exc:
        return jsonify({"error": f"Database error: {str(exc)}"}), 500
    except Exception as exc:
        return jsonify({"error": f"Server error: {str(exc)}"}), 500


@call_entry_bp.route("/api/add-machine", methods=["POST"])
def add_machine():
    """Add a new machine for an existing company."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Convert to int or None, handling string values
        def to_int_or_none(val):
            if val is None or val == '':
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        company_id = to_int_or_none(data.get("company_id"))
        mc_no = data.get("mc_no", "").strip()
        model = data.get("model", "").strip()
        status = to_int_or_none(data.get("status"))
        start_dt = data.get("start_dt") or None
        end_dt = data.get("end_dt") or None
        Inv_No = data.get("Inv_No", "").strip()
        Inv_Dt = data.get("Inv_Dt") or None
        Inv_Value = data.get("Inv_Value", "").strip()
        start_dt = data.get("start_dt") or None
        end_dt = data.get("end_dt") or None
        Inv_No = data.get("Inv_No", "").strip()
        Inv_Dt = data.get("Inv_Dt") or None
        Inv_Value = data.get("Inv_Value", "").strip()

        if not company_id:
            return jsonify({"error": "company_id is required"}), 400
        if not mc_no:
            return jsonify({"error": "mc_no is required"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        # Check if mc_no already exists
        cur.execute("SELECT id FROM machines WHERE mc_no = %s", (mc_no,))
        existing = cur.fetchone()
        if existing:
            cur.close()
            cnx.close()
            return jsonify({"error": "Machine number must be unique"}), 409

        machine_sql = """
            INSERT INTO machines (company_id, mc_no, model, status, start_dt, end_dt, Inv_No, Inv_Dt, Inv_Value)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        machine_values = (
            company_id,
            mc_no or None,
            model or None,
            status,
            start_dt,
            end_dt,
            Inv_No or None,
            Inv_Dt,
            Inv_Value or None,
        )
        cur.execute(machine_sql, machine_values)
        machine_id = cur.lastrowid
        cnx.commit()

        cur.close()
        cnx.close()

        return jsonify({
            "success": True,
            "machine_id": machine_id,
            "message": "Machine added successfully"
        })

    except Error as exc:
        return jsonify({"error": f"Database error: {str(exc)}"}), 500
    except Exception as exc:
        return jsonify({"error": f"Server error: {str(exc)}"}), 500


@call_entry_bp.route("/api/check-mc-no", methods=["POST"])
def check_mc_no():
    """Check if MC No already exists."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"exists": False}), 200

        mc_no = data.get("mc_no", "").strip()

        if not mc_no:
            return jsonify({"exists": False}), 200

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        cur.execute("SELECT id FROM machines WHERE mc_no = %s", (mc_no,))
        existing = cur.fetchone()

        cur.close()
        cnx.close()

        return jsonify({"exists": existing is not None})

    except Error as exc:
        return jsonify({"error": f"Database error: {str(exc)}"}), 500
    except Exception as exc:
        return jsonify({"error": f"Server error: {str(exc)}"}), 500


@call_entry_bp.route("/api/generate-ticket-no", methods=["GET"])
def generate_ticket_no():
    """Generate next ticket number."""
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        # If machine_id provided, try to reuse existing open ticket for that machine
        machine_id = request.args.get('machine_id')
        if machine_id:
            try:
                cur.execute("SELECT id, ticket_no FROM tickets WHERE machine_id = %s AND status != 'closed' ORDER BY id DESC LIMIT 1", (machine_id,))
                row = cur.fetchone()
                if row and row[1]:
                    cur.close()
                    cnx.close()
                    return jsonify({"ticket_no": row[1], "ticket_id": row[0]})
            except Exception:
                # fall back to global generation if query fails
                pass

        cur.execute("SELECT MAX(ticket_no) FROM tickets")
        max_ticket = cur.fetchone()[0]
        # Ensure ticket numbers start at 1000
        if not max_ticket or max_ticket < 1000:
            new_ticket_no = 1000
        else:
            new_ticket_no = max_ticket + 1
        cur.close()
        cnx.close()
        return jsonify({"ticket_no": new_ticket_no})
    except Error as exc:
        return jsonify({"error": str(exc)}), 500


@call_entry_bp.route("/api/save-ticket", methods=["POST"])
def save_ticket():
    """Save a ticket entry."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        # Check if ticket_no exists, if not generate new one.
        # Ticket numbers must start at 1000 and be unique. We'll compute
        # next value and retry on duplicate-key to avoid races.
        ticket_no = data.get("ticket_no")
        if not ticket_no:
            cur.execute("SELECT MAX(ticket_no) FROM tickets")
            max_ticket = cur.fetchone()[0]
            if not max_ticket or max_ticket < 1000:
                ticket_no = 1000
            else:
                ticket_no = max_ticket + 1

        # Convert empty strings to None for integer fields
        def to_int_or_none(val):
            if val is None or val == '':
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        company_id = to_int_or_none(data.get("company_id"))
        machine_id = to_int_or_none(data.get("machine_id"))
        contact_id = to_int_or_none(data.get("contact_id"))

        if not company_id:
            return jsonify({"error": "company_id is required"}), 400
        if not machine_id:
            return jsonify({"error": "machine_id is required"}), 400

        # Check for an existing open ticket for this machine. If present,
        # reuse it (do NOT create a new ticket). An open ticket is any ticket
        # whose status is not 'closed'.
        ticket_id = None
        try:
            cur.execute("SELECT id, ticket_no FROM tickets WHERE machine_id = %s AND status != 'closed' ORDER BY id DESC LIMIT 1", (machine_id,))
            existing = cur.fetchone()
            if existing:
                ticket_id = existing[0]
                ticket_no = existing[1] or ticket_no
            else:
                # No open ticket found — create a new one (handle race with retries)
                ticket_sql = """
                    INSERT INTO tickets (ticket_no, company_id, machine_id, contact_id, status)
                    VALUES (%s, %s, %s, %s, %s)
                """
                max_retries = 5
                for attempt in range(max_retries):
                    try:
                        ticket_values = (
                            ticket_no,
                            company_id,
                            machine_id,
                            contact_id,
                            data.get("status", "open"),
                        )
                        cur.execute(ticket_sql, ticket_values)
                        ticket_id = cur.lastrowid
                        break
                    except Error as exc:
                        # Duplicate key error (ticket_no collision) -> recompute and retry
                        try:
                            if getattr(exc, 'errno', None) == 1062:
                                cur.execute("SELECT MAX(ticket_no) FROM tickets")
                                max_ticket = cur.fetchone()[0]
                                ticket_no = 1000 if not max_ticket or max_ticket < 1000 else max_ticket + 1
                                continue
                        except Exception:
                            pass
                        raise
                if ticket_id is None:
                    raise Exception("Failed to create ticket after retries")
        except Exception:
            # Re-raise unexpected exceptions so outer handler can respond
            raise

        # Insert a new issue row into ticket_issues for the determined ticket_id.
        # Per rules, we must NOT create a new ticket here if an open ticket exists.
        try:
            # Parse date string if provided, otherwise use today
            date_value = data.get("date")
            if date_value:
                try:
                    # If it's a string, try to parse it
                    if isinstance(date_value, str):
                        date_value = datetime.strptime(date_value, "%Y-%m-%d").date()
                    elif not isinstance(date_value, date):
                        date_value = date.today()
                except (ValueError, TypeError):
                    date_value = date.today()
            else:
                date_value = date.today()
            
            # Get contact_id - it's required for ticket_issues table
            issue_contact_id = contact_id
            if not issue_contact_id:
                raise Exception("contact_id is required for ticket_issues")
            
            # Fetch customer_name from contacts table based on contact_id
            customer_name_from_contact = None
            try:
                cur.execute("SELECT name FROM contacts WHERE id = %s", (issue_contact_id,))
                contact_row = cur.fetchone()
                if contact_row:
                    customer_name_from_contact = contact_row[0]
            except Exception as contact_err:
                print(f"WARNING: Failed to fetch contact name for contact_id {issue_contact_id}: {str(contact_err)}")
                # Fallback to provided customer_name if contact lookup fails
                customer_name_from_contact = data.get("customer_name") or None
            
            ti_sql = """
                INSERT INTO ticket_issues (ticket_id, date, start_time, end_time, log_by, customer_name, fault, priority, status, contact_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            log_by_name = None
            if current_user.is_authenticated:
                log_by_name = current_user.tag_name
            if not log_by_name:
                log_by_name = data.get("log_by") or None

            ti_values = (
                ticket_id,
                date_value,
                data.get("start_time") or None,
                data.get("end_time") or None,
                log_by_name,
                customer_name_from_contact,  # Use customer_name from contacts table
                data.get("fault") or None,
                data.get("priority") or None,
                data.get("status", "open"),
                issue_contact_id,
            )
            cur.execute(ti_sql, ti_values)
            issue_id = cur.lastrowid
            print(f"Successfully inserted ticket_issues row with id {issue_id} for ticket_id {ticket_id}")
        except Exception as ti_exc:
            # Log the error properly so we can debug
            error_msg = str(ti_exc)
            error_trace = traceback.format_exc()
            print(f"ERROR: Failed to insert into ticket_issues: {error_msg}")
            print(f"Traceback: {error_trace}")
            print(f"Data being inserted: ticket_id={ticket_id}, date={data.get('date')}, start_time={data.get('start_time')}, end_time={data.get('end_time')}, customer_name={data.get('customer_name')}, contact_id={contact_id}")
            # Re-raise the exception so the outer handler can return an error to the client
            raise Exception(f"Failed to insert ticket issue: {error_msg}")

        # Update machine table with ticket_no
        try:
            update_machine_sql = """
                UPDATE machines
                SET ticket_no = %s
                WHERE id = %s
            """
            cur.execute(update_machine_sql, (ticket_no, machine_id))
        except Exception as machine_exc:
            print(f"WARNING: Failed to update machine ticket_no: {str(machine_exc)}")
            # Continue even if machine update fails

        cnx.commit()

        # Get the created ticket along with latest issue (if any)
        # Use contacts table to fetch customer_name based on ticket_issues.contact_id
        cur.execute("""
            SELECT t.id AS ticket_id, t.ticket_no, t.company_id, t.machine_id, t.contact_id,
                   ti.id AS issue_id, ti.date, ti.start_time, ti.end_time, ti.log_by AS log_by, 
                   cont.name AS customer_name,
                   ti.fault, ti.priority, ti.status AS issue_status, t.status AS ticket_status
            FROM tickets t
            LEFT JOIN ticket_issues ti ON ti.ticket_id = t.id
            LEFT JOIN contacts cont ON ti.contact_id = cont.id
            WHERE t.id = %s
            ORDER BY ti.date DESC, ti.id DESC
            LIMIT 1
        """, (ticket_id,))
        ticket_row = cur.fetchone()
        ticket = dict_from_row(cur, ticket_row) if ticket_row else None

        return jsonify({
            "success": True,
            "ticket_id": ticket_id,
            "ticket": ticket,
            "message": "Ticket saved successfully"
        })

    except Error as exc:
        # Rollback transaction on error
        try:
            if 'cnx' in locals() and cnx:
                cnx.rollback()
        except Exception:
            pass
        error_msg = str(exc)
        error_trace = traceback.format_exc()
        print(f"Database Error in save_ticket: {error_msg}")
        print(f"Traceback: {error_trace}")
        return jsonify({"error": error_msg}), 500
    except Exception as exc:
        # Rollback transaction on error
        try:
            if 'cnx' in locals() and cnx:
                cnx.rollback()
        except Exception:
            pass
        error_msg = str(exc)
        error_trace = traceback.format_exc()
        print(f"General Error in save_ticket: {error_msg}")
        print(f"Traceback: {error_trace}")
        return jsonify({"error": error_msg}), 500
    finally:
        # Ensure connections are closed
        try:
            if 'cur' in locals() and cur:
                cur.close()
            if 'cnx' in locals() and cnx:
                cnx.close()
        except Exception:
            pass


@call_entry_bp.route("/api/close-ticket", methods=["POST"])
def close_ticket():
    """Close a ticket: update status to 'closed' and set machine ticket_no to NULL."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        ticket_no = data.get("ticket_no")
        machine_id = data.get("machine_id")

        if not ticket_no:
            return jsonify({"error": "ticket_no is required"}), 400
        if not machine_id:
            return jsonify({"error": "machine_id is required"}), 400

        # Convert to int
        def to_int_or_none(val):
            if val is None or val == '':
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        ticket_no = to_int_or_none(ticket_no)
        machine_id = to_int_or_none(machine_id)

        if not ticket_no or not machine_id:
            return jsonify({"error": "Invalid ticket_no or machine_id"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        # Update all tickets with this ticket_no to status = 'closed'
        update_ticket_sql = """   
            UPDATE tickets
            SET status = 'closed'
            WHERE ticket_no = %s AND machine_id = %s
        """
        cur.execute(update_ticket_sql, (ticket_no, machine_id))
        tickets_updated = cur.rowcount

        # Update machine table: set ticket_no to NULL
        update_machine_sql = """
            UPDATE machines
            SET ticket_no = NULL
            WHERE id = %s
        """
        cur.execute(update_machine_sql, (machine_id,))

        cnx.commit()
        cur.close()
        cnx.close()

        return jsonify({
            "success": True,
            "tickets_updated": tickets_updated,
            "message": f"Ticket {ticket_no} closed successfully"
        })

    except Error as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
