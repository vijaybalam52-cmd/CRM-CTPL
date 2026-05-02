"""Workfront related routes."""
from flask import Blueprint, render_template, jsonify, request
from mysql.connector import Error
from datetime import date
import re
from database import get_connection
from config import DB_CONFIG

workfront_bp = Blueprint('workfront', __name__)


@workfront_bp.route("/workfront")
def workfront():
    return render_template("workfront.html")


@workfront_bp.route("/api/workfront", methods=["GET"])
def get_workfront():
    """Fetch all work_front records using normalized schema: join with ticket_issues, tickets,
    short_form, cluster, machines, companies, and contacts to present the same frontend shape."""
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        query = """
            SELECT wf.id AS wf_id,
                   ti.date AS issue_date,
                   m.mc_no AS mc_no,
                   comp.name AS company_name,
                   sf.prior AS prior,
                   sf.s, sf.a, sf.i, sf.d, sf.e, sf.f, sf.p,
                   sf.purpose AS purpose,
                   ti.fault AS remarks,
                   cl.zarc AS zarc,
                   cl.cluster AS cluster_name,
                   cont.name AS person,
                   ti.log_by AS log_by,
                   cont.phone AS contact_no,
                   cl.rg AS rg,
                   wf.status AS status,
                   t.ticket_no AS ticket_no
            FROM work_front wf
            JOIN ticket_issues ti ON wf.issue_id = ti.id
            JOIN tickets t ON ti.ticket_id = t.id
            LEFT JOIN machines m ON t.machine_id = m.id
            LEFT JOIN companies comp ON t.company_id = comp.id
            LEFT JOIN short_form sf ON wf.short_form_id = sf.id
            LEFT JOIN cluster cl ON wf.cluster_id = cl.id
            LEFT JOIN contacts cont ON wf.contact_id = cont.id
            WHERE wf.status = 'open'
            ORDER BY wf.id ASC
        """
        cur.execute(query)
        rows = cur.fetchall()
        data = []
        for row in rows:
            d = row.get('issue_date')
            date_str = d.strftime('%d-%b-%y') if d and hasattr(d, 'strftime') else (str(d) if d else '')
            data.append({
                'id': row.get('wf_id'),
                'sl': str(row.get('wf_id')) if row.get('wf_id') else '',
                'date': date_str,
                'mc': str(row.get('mc_no')) if row.get('mc_no') else '',
                'company': str(row.get('company_name')) if row.get('company_name') else '',
                'prior': str(row.get('prior')) if row.get('prior') else '',
                's': str(row.get('s')) if row.get('s') is not None else '0',
                'a': str(row.get('a')) if row.get('a') is not None else '0',
                'i': str(row.get('i')) if row.get('i') is not None else '0',
                'd': str(row.get('d')) if row.get('d') is not None else '0',
                'e': str(row.get('e')) if row.get('e') is not None else '0',
                'f': str(row.get('f')) if row.get('f') is not None else '0',
                'p': str(row.get('p')) if row.get('p') is not None else '0',
                'purpose': str(row.get('purpose')) if row.get('purpose') else '',
                'remarks': str(row.get('remarks')) if row.get('remarks') else '',
                'zarc': str(row.get('zarc')) if row.get('zarc') is not None else '',
                'cluster': str(row.get('cluster_name')) if row.get('cluster_name') else '',
                'person': str(row.get('person')) if row.get('person') else '',
                'contact': str(row.get('contact_no')) if row.get('contact_no') else '',
                'rg': str(row.get('rg')) if row.get('rg') else '',
                'spr': '-',
                'pr': '',
                'done': str(row.get('status')) == 'done' if row.get('status') is not None else False,
                'status': str(row.get('status')) if row.get('status') else 'open',
                'logby': str(row.get('log_by')) if row.get('log_by') else '',
                'ticket_no': str(row.get('ticket_no')) if row.get('ticket_no') else '',
            })
        return jsonify(data)
    except Error as exc:
        print(f"Database error in get_workfront: {str(exc)}")
        return jsonify({'error': str(exc)}), 500
    except Exception as exc:
        print(f"Unexpected error in get_workfront: {str(exc)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(exc)}), 500
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception:
            pass


@workfront_bp.route("/api/workfront/<int:record_id>", methods=["PUT"])
def update_workfront(record_id):
    """Update spr, pr, or done status for a work_front record."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if 'spr' in data:
            update_fields.append("spr = %s")
            update_values.append(data.get('spr') or '-')
        
        # PR is temporary (not stored in database) - ignore if sent
        # if 'pr' in data:
        #     update_fields.append("pr = %s")
        #     update_values.append(data.get('pr') or '')
        
        if 'done' in data:
            update_fields.append("status = %s")
            update_values.append('done' if data.get('done') else 'open')
        
        if 'status' in data:
            update_fields.append("status = %s")
            update_values.append(data.get('status'))
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_values.append(record_id)
        query = f"UPDATE work_front SET {', '.join(update_fields)} WHERE id = %s"
        
        cur.execute(query, update_values)
        cnx.commit()
        if cur.rowcount == 0:
            return jsonify({'error': 'Record not found'}), 404
        return jsonify({'success': True})
    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({'error': str(exc)}), 500
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception:
            pass


@workfront_bp.route("/api/transfer-to-workfront", methods=["POST"])
def transfer_to_workfront():
    """Transfer tickets with Priority starting with 'F' or 'T' to workfront table."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        company_id = data.get("company_id")
        machine_id = data.get("machine_id")
        contact_id = data.get("contact_id")

        if not company_id:
            return jsonify({"error": "company_id is required"}), 400
        if not machine_id:
            return jsonify({"error": "Please select a machine (MC) first by clicking on it in the machine table"}), 400
        if not contact_id:
            return jsonify({"error": "Please select a contact with WF checkbox checked"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        # Load short_form mapping from database using call_entryv7 schema when available
        try:
            # Inspect columns first to choose the appropriate SELECT
            cur.execute("SHOW COLUMNS FROM short_form")
            cols = [r[0].lower() for r in cur.fetchall()]
            priority_mapping = {}

            # If new schema with s,a,i,d,e,f,p,prior exists, select full row and derive short_form
            if set(('s','a','i','d','e','f','p','prior','purpose','priority')).issubset(cols):
                cur.execute("SELECT id, s, a, i, d, e, f, p, prior, purpose, priority FROM short_form")
                sf_rows = cur.fetchall() or []
                for row in sf_rows:
                    try:
                        sf_id, s_v, a_v, i_v, d_v, e_v, f_v, p_v, prior_v, purpose_v, priority_format = row
                    except Exception:
                        continue
                    if not priority_format:
                        continue
                    priority_key = str(priority_format).strip()
                    # Determine short_form letter from s/a/i/d/e/p flags
                    short_letter = ''
                    try:
                        if int(s_v or 0) == 1:
                            short_letter = 'S'
                        elif int(a_v or 0) == 1:
                            short_letter = 'A'
                        elif int(i_v or 0) == 1:
                            short_letter = 'I'
                        elif int(d_v or 0) == 1:
                            short_letter = 'D'
                        elif int(e_v or 0) == 1:
                            short_letter = 'E'
                        elif int(p_v or 0) == 1:
                            short_letter = 'P'
                    except Exception:
                        short_letter = ''
                    # Store raw flags (s,a,i,d,e,p) and F value so we can map by flags
                    priority_mapping[priority_key] = {
                        'id': sf_id,
                        'prior': prior_v,
                        'short_form': short_letter,
                        'purpose': str(purpose_v).strip() if purpose_v else '',
                        'F': str(int(f_v)) if f_v is not None else '0',
                        's': str(int(s_v)) if s_v is not None else '0',
                        'a': str(int(a_v)) if a_v is not None else '0',
                        'i': str(int(i_v)) if i_v is not None else '0',
                        'd': str(int(d_v)) if d_v is not None else '0',
                        'e': str(int(e_v)) if e_v is not None else '0',
                        'p': str(int(p_v)) if p_v is not None else '0'
                    }
            else:
                # Fallback to legacy columns if present
                # Try to locate short_form-like column names
                if 'short_form' in cols or 'shortform' in cols or 'sf' in cols:
                    # Use legacy layout
                    cur.execute("SELECT id, short_form, f, prior, purpose, priority FROM short_form")
                    sf_rows = cur.fetchall() or []
                    for row in sf_rows:
                        try:
                            sf_id, short_form_value, f_value, prior_value, purpose_value, priority_format = row
                        except Exception:
                            continue
                        if not priority_format:
                            continue
                        # Legacy layout: derive flag columns from the short_form string when possible
                        short_val = str(short_form_value).strip() if short_form_value else ''
                        s_flag = a_flag = i_flag = d_flag = e_flag = p_flag = '0'
                        if short_val:
                            first = short_val[:1].upper()
                            if first == 'S':
                                s_flag = '1'
                            elif first == 'A':
                                a_flag = '1'
                            elif first == 'I':
                                i_flag = '1'
                            elif first == 'D':
                                d_flag = '1'
                            elif first == 'E':
                                e_flag = '1'
                            elif first == 'P':
                                p_flag = '1'
                        priority_mapping[str(priority_format).strip()] = {
                            'id': sf_id,
                            'prior': prior_value,
                            'short_form': short_val,
                            'purpose': str(purpose_value).strip() if purpose_value else '',
                            'F': str(f_value) if f_value is not None else '0',
                            's': s_flag,
                            'a': a_flag,
                            'i': i_flag,
                            'd': d_flag,
                            'e': e_flag,
                            'p': p_flag
                        }
                else:
                    # As a last resort, try a generic select with common aliases
                    try:
                        cur.execute("SELECT id, COALESCE(short_form, '') AS short_form, COALESCE(f,0) AS f, COALESCE(prior,0) AS prior, COALESCE(purpose,'') AS purpose, COALESCE(priority,'') AS priority FROM short_form")
                        sf_rows = cur.fetchall() or []
                        for row in sf_rows:
                            try:
                                sf_id, short_form_value, f_value, prior_value, purpose_value, priority_format = row
                            except Exception:
                                continue
                            if not priority_format:
                                continue
                            # Generic select: include flags if available (fallback to short_form first-letter)
                            short_val = str(short_form_value).strip() if short_form_value else ''
                            s_flag = a_flag = i_flag = d_flag = e_flag = p_flag = '0'
                            if short_val:
                                first = short_val[:1].upper()
                                if first == 'S':
                                    s_flag = '1'
                                elif first == 'A':
                                    a_flag = '1'
                                elif first == 'I':
                                    i_flag = '1'
                                elif first == 'D':
                                    d_flag = '1'
                                elif first == 'E':
                                    e_flag = '1'
                                elif first == 'P':
                                    p_flag = '1'
                            priority_mapping[str(priority_format).strip()] = {
                                'id': sf_id,
                                'prior': prior_value,
                                'short_form': short_val,
                                'purpose': str(purpose_value).strip() if purpose_value else '',
                                'F': str(f_value) if f_value is not None else '0',
                                's': s_flag,
                                'a': a_flag,
                                'i': i_flag,
                                'd': d_flag,
                                'e': e_flag,
                                'p': p_flag
                            }
                    except Exception as e:
                        cur.close()
                        cnx.close()
                        return jsonify({"error": f"Failed to load short_form mapping from database: {str(e)}"}), 500
        except Exception as e:
            cur.close()
            cnx.close()
            return jsonify({"error": f"Failed to load short_form mapping from database: {str(e)}"}), 500

        # Get contact details
        cur.execute("SELECT id, name, phone FROM contacts WHERE id = %s AND company_id = %s", (contact_id, company_id))
        contact_row = cur.fetchone()
        if not contact_row:
            cur.close()
            cnx.close()
            return jsonify({"error": "Contact not found or does not belong to this company"}), 400

        contact_name = contact_row[1] or ''
        contact_phone = contact_row[2] or ''

        # Get company details (for ZARC and company name)
        cur.execute("SELECT name, zone, area, route, cluster FROM companies WHERE id = %s", (company_id,))
        company_row = cur.fetchone()
        if not company_row:
            cur.close()
            cnx.close()
            return jsonify({"error": "Company not found"}), 400

        company_name = company_row[0] or ''
        zone = company_row[1] or ''
        area = company_row[2] or ''
        route = company_row[3] or ''
        cluster_code = company_row[4] or ''

        # Build ZARC code (combine zone, area, route, cluster) and convert to integer
        zarc_code_str = f"{zone}{area}{route}{cluster_code}" if all([zone, area, route, cluster_code]) else None

        if not zarc_code_str:
            cur.close()
            cnx.close()
            return jsonify({"error": "ZARC number not found in database"}), 400

        # Convert ZARC code to integer for lookup in cluster table
        try:
            zarc = int(zarc_code_str)
        except ValueError:
            cur.close()
            cnx.close()
            return jsonify({"error": f"Invalid ZARC code format: {zarc_code_str}"}), 400

        # Get cluster id, name and rg from cluster table using ZARC code (integer)
        cur.execute("SELECT id, cluster, rg FROM cluster WHERE zarc = %s", (zarc,))
        mapping_row = cur.fetchone()
        if not mapping_row:
            cur.close()
            cnx.close()
            return jsonify({"error": f"ZARC number {zarc} not found in database"}), 400

        cluster_id = mapping_row[0]
        cluster_name = mapping_row[1] or ''
        rg_value = (mapping_row[2] or '')[:10] if mapping_row[2] else ''

        # Get all tickets with priority starting with 'F' or 'T' for this specific machine only
        # Only tickets for the currently selected/displayed MC will be transferred
        #  Select all ID fields from ticket table
        cur.execute("""
            SELECT t.id, t.ticket_no, t.company_id, t.machine_id, t.contact_id,
                   ti.id AS issue_id, ti.date, ti.start_time, ti.end_time, ti.log_by, ti.customer_name, ti.priority, ti.fault, m.mc_no
            FROM tickets t
            INNER JOIN machines m ON t.machine_id = m.id
            LEFT JOIN ticket_issues ti ON ti.ticket_id = t.id AND (ti.status IS NULL OR ti.status != 'WF')
            WHERE t.company_id = %s
            AND t.machine_id = %s
            AND t.status = 'open'
            AND (ti.priority LIKE 'F%' OR ti.priority LIKE 'T%')
            ORDER BY t.id
        """, (company_id, machine_id))

        tickets = cur.fetchall()

        if not tickets:
            cur.close()
            cnx.close()
            return jsonify({"error": f"No tickets with Priority starting with 'F' or 'T' found for the selected machine (MC ID: {machine_id})"}), 400

        # Debug: Log what tickets/issues were found
        print(f"DEBUG: Found {len(tickets)} ticket-issue rows with Priority starting with 'F' or 'T' for machine_id={machine_id}")
        for t in tickets[:5]:  # Print first 5 for debugging
            # columns: 0=t.id, ... 5=ti.id(issue_id), 6=ti.date, 11=ti.priority, 13=m.mc_no
            print(f"DEBUG: Ticket ID={t[0]}, Issue ID={t[5]}, Priority='{t[11]}', Date={t[6]}, MC={t[13]}")

        # Process each ticket: create ticket_issues row, then insert work_front referencing short_form_id and cluster_id
        inserted_count = 0
        skipped_count = 0
        skip_reasons = []
        transferred_ticket_ids = []  # Track successfully transferred ticket IDs

        for ticket in tickets:
            ticket_id, ticket_no, ticket_company_id, ticket_machine_id, ticket_contact_id, \
            issue_id, ticket_date, ticket_start_time, ticket_end_time, ticket_log_by, ticket_customer_name, priority, fault, mc_no = ticket

            if not priority:
                skipped_count += 1
                skip_reasons.append(f"Ticket {ticket_id}: Priority is empty")
                continue

            priority_str = priority.strip()

            # Match priority string against short_form table mapping
            # Try exact match first (e.g., "F1 Service")
            priority_info = priority_mapping.get(priority_str)

            # If exact match not found, try to normalize and match
            # Handle variations like "F1Service" (no space), "F 1 Service" (space after F), etc.
            if not priority_info:
                # Normalize: remove extra spaces, ensure format like "F1 Service"
                normalized = re.sub(r'\s+', ' ', priority_str.strip())
                priority_info = priority_mapping.get(normalized)

                # If still not found, try removing space between letter and number (e.g., "F 3" -> "F3")
                if not priority_info:
                    normalized_no_space = re.sub(r'^([A-Z])\s+(\d+)', r'\1\2', normalized)
                    priority_info = priority_mapping.get(normalized_no_space)

                # If still not found, try to extract F+number+word pattern and match by number only
                # This handles typos in the word part (e.g., "Extand" vs "Extend")
                if not priority_info:
                    match = re.match(r'^([A-Z])\s*(\d+)\s*(.+)?$', normalized, re.IGNORECASE)
                    if match:
                        letter = match.group(1).upper()
                        number = match.group(2)
                                        
                        # Try pattern without space between letter and number: "F3 Train/Upg"
                        word = match.group(3).strip() if match.group(3) else ''
                        search_pattern = f"{letter}{number} {word}".strip()
                        priority_info = priority_mapping.get(search_pattern)
                        
                        # If still not found, match by letter + number only (ignore word typos)
                        if not priority_info:
                            for key, value in priority_mapping.items():
                                # Extract letter and number from JSON key
                                key_match = re.match(r'^([A-Z])\s*(\d+)\s*(.+)?$', key, re.IGNORECASE)
                                if key_match:
                                    key_letter = key_match.group(1).upper()
                                    key_number = key_match.group(2)
                                    # Match if letter and number match (ignore word differences/typos)
                                    if key_letter == letter and key_number == number:
                                        priority_info = value
                                        break

            if not priority_info:
                skipped_count += 1
                skip_reasons.append(f"Ticket {ticket_id}: Priority '{priority_str}' not found in short_form table mapping")
                continue

            # Extract values from matched entry and use flag columns directly
            prior_value = priority_info.get('prior')
            purpose_value = priority_info.get('purpose', '')
            # Flags may be present as strings '1'/'0'
            try:
                s = int(priority_info.get('s') or 0)
            except Exception:
                s = 0
            try:
                a = int(priority_info.get('a') or 0)
            except Exception:
                a = 0
            try:
                i = int(priority_info.get('i') or 0)
            except Exception:
                i = 0
            try:
                d = int(priority_info.get('d') or 0)
            except Exception:
                d = 0
            try:
                e = int(priority_info.get('e') or 0)
            except Exception:
                e = 0
            try:
                p = int(priority_info.get('p') or 0)
            except Exception:
                p = 0
            f = 1 if str(priority_info.get('F') or '0') == '1' else 0

            

            # Format date
            if ticket_date:
                if isinstance(ticket_date, date):
                    date_str = ticket_date.strftime('%d-%b-%y')
                else:
                    date_str = str(ticket_date)
            else:
                date_str = date.today().strftime('%d-%b-%y')

            # Truncate remarks to 100 characters (VARCHAR(100) limit)
            remarks_to_insert = (fault or '')[:100]

            # For status change we must NOT INSERT into ticket_issues; update existing row only
            # Use the ticket_issues id returned by the SELECT; skip if missing
            if not issue_id:
                skipped_count += 1
                skip_reasons.append(f"Ticket {ticket_id}: No ticket_issues found for this ticket to transfer")
                continue
            try:
                # Update status only - do NOT update contact_id in ticket_issues
                # contact_id should only be used for work_front table, not ticket_issues
                cur.execute("UPDATE ticket_issues SET status = %s WHERE id = %s", ('WF', issue_id))
            except Exception as ti_err:
                skipped_count += 1
                skip_reasons.append(f"Ticket {ticket_id}, Issue {issue_id}: Failed to update ticket_issues to WF - {str(ti_err)}")
                continue

            # Determine short_form_id from priority_mapping
            sf_entry = priority_info
            short_form_id = sf_entry.get('id') if sf_entry else None
            if not short_form_id:
                # Fallback: try to find short_form id by searching table
                try:
                    cur.execute("SELECT id FROM short_form WHERE priority = %s LIMIT 1", (priority_str,))
                    sf_row = cur.fetchone()
                    short_form_id = sf_row[0] if sf_row else None
                except Exception:
                    short_form_id = None

            # Insert into work_front referencing issue_id, short_form_id, cluster_id
            try:
                wf_insert = """
                    INSERT INTO work_front (issue_id, short_form_id, cluster_id, contact_id, status)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cur.execute(wf_insert, (issue_id, short_form_id, cluster_id, contact_id, 'open'))
                inserted_count += 1
                transferred_ticket_ids.append(ticket_id)
            except Exception as wf_err:
                skipped_count += 1
                skip_reasons.append(f"Ticket {ticket_id}, Issue {issue_id}: Failed to insert work_front - {str(wf_err)}")
                # Do not delete existing ticket_issues; just continue
                continue

            # Update tickets' contact to the selected contact for all successfully transferred tickets
            if transferred_ticket_ids and contact_id:
                try:
                    unique_ticket_ids = list(set(transferred_ticket_ids))
                    ticket_placeholders = ','.join(['%s'] * len(unique_ticket_ids))
                    update_ticket_contact_sql = f"UPDATE tickets SET contact_id = %s WHERE id IN ({ticket_placeholders})"
                    # Build params: first contact_id, then the ticket ids
                    params = tuple([contact_id] + unique_ticket_ids)
                    cur.execute(update_ticket_contact_sql, params)
                except Exception as e:
                    # Log but don't fail the whole operation
                    print(f"WARNING: Failed to update tickets.contact_id: {str(e)}")

        cnx.commit()
        cur.close()
        cnx.close()

        # Build response message
        if inserted_count > 0:
            message = f"Successfully transferred {inserted_count} ticket(s) to workfront"
            if skipped_count > 0:
                message += f". {skipped_count} ticket(s) were skipped."
        else:
            message = f"No tickets were transferred. {skipped_count} ticket(s) were skipped."
            if skip_reasons:
                message += " Reasons: " + "; ".join(skip_reasons[:5])  # Show first 5 reasons

        return jsonify({
            "success": inserted_count > 0,
            "message": message,
            "count": inserted_count,
            "skipped": skipped_count,
            "skip_reasons": skip_reasons[:10] if skip_reasons else [],  # Return first 10 reasons for debugging
            "transferred_ticket_ids": transferred_ticket_ids,  # Return list of transferred ticket IDs
            "machine_id": machine_id  # Return machine_id for frontend to refresh ticket table
        })

    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        if cnx:
            cnx.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            if 'cur' in locals() and cur:
                cur.close()
            if 'cnx' in locals() and cnx:
                cnx.close()
        except Exception:
            pass


@workfront_bp.route("/api/workfront/transfer-to-workdone", methods=["POST"])
def transfer_to_workdone():
    """Transfer done rows from work_front to work_done table."""
    cnx = cur = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        work_front_ids = data.get("work_front_ids", [])
        if not work_front_ids:
            return jsonify({"error": "No work_front_ids provided"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)

        # Get all work_front records with matching IDs (include issue_id for later use)
        placeholders = ','.join(['%s'] * len(work_front_ids))
        query = f"""
            SELECT wf.id, wf.issue_id, wf.short_form_id, wf.cluster_id, wf.status
            FROM work_front wf
            WHERE wf.id IN ({placeholders})
        """
        cur.execute(query, tuple(work_front_ids))
        work_front_rows = cur.fetchall()

        transferred_issue_ids = list(set([row.get('issue_id') for row in work_front_rows if row.get('issue_id')]))
        print(f"DEBUG: Transferring work_front_ids: {work_front_ids}")
        print(f"DEBUG: Associated issue_ids from work_front rows: {transferred_issue_ids}")

        if not work_front_rows:
            cur.close()
            cnx.close()
            return jsonify({"error": "No rows found to transfer"}), 400

        # Insert into work_done table using normalized columns
        from datetime import date as date_class
        today = date_class.today()
        inserted_count = 0


        # Mark ticket_issues rows as 'close' for the associated issues and insert/update work_done
        if transferred_issue_ids:
            try:
                issue_placeholders = ','.join(['%s'] * len(transferred_issue_ids))
                update_issues_sql = f"UPDATE ticket_issues SET status = 'close' WHERE id IN ({issue_placeholders})"
                cur.execute(update_issues_sql, tuple(transferred_issue_ids))
            except Exception as e:
                print(f"WARNING: Failed to update ticket_issues status to 'close': {str(e)}")

        for row in work_front_rows:
            wf_id = row.get('id')
            # Check if record already exists in work_done (by work_front_id)
            cur.execute("SELECT id FROM work_done WHERE work_front_id = %s", (wf_id,))
            existing = cur.fetchone()
            if existing:
                # Update existing record
                cur.execute("UPDATE work_done SET done_date = %s, status = %s WHERE work_front_id = %s", (today, 'closed', wf_id))
            else:
                # Insert new work_done row
                cur.execute("INSERT INTO work_done (work_front_id, done_date, done_by, status) VALUES (%s, %s, %s, %s)",
                            (wf_id, today, data.get('done_by', '') if data else '', 'closed'))
            inserted_count += 1

        # Update status to 'done' for all transferred rows AFTER inserting to work_done
        update_status_query = f"""
            UPDATE work_front 
            SET status = 'done' 
            WHERE id IN ({placeholders})
        """
        cur.execute(update_status_query, tuple(work_front_ids))
        workfront_rows_updated = cur.rowcount
        print(f"DEBUG: Updated {workfront_rows_updated} workfront row(s) status to 'done'")

        # Determine tickets to close: get issue -> ticket mapping and check if all work_front rows for that ticket's issues are done
        try:
            # Get ticket ids for the affected issues
            issue_placeholders = ','.join(['%s'] * len(transferred_issue_ids)) if transferred_issue_ids else None
            ticket_info_rows = []
            if transferred_issue_ids:
                get_ticket_info_query = f"""
                    SELECT DISTINCT ti.ticket_id, t.machine_id, t.status as ticket_status
                    FROM ticket_issues ti
                    INNER JOIN tickets t ON ti.ticket_id = t.id
                    WHERE ti.id IN ({issue_placeholders})
                """
                cur.execute(get_ticket_info_query, tuple(transferred_issue_ids))
                ticket_info_rows = cur.fetchall()

            if ticket_info_rows:
                ticket_ids_to_close = []
                machine_ids_to_clear = set()
                for info in ticket_info_rows:
                    ticket_id = info.get('ticket_id')
                    machine_id = info.get('machine_id')
                    if not ticket_id:
                        continue
                    # Check ticket_issues rows for this ticket: close ticket only when all issues are closed
                    cur.execute("SELECT COUNT(*) as total_issues, SUM(CASE WHEN status = 'close' THEN 1 ELSE 0 END) as closed_issues FROM ticket_issues WHERE ticket_id = %s", (ticket_id,))
                    res = cur.fetchone()
                    total_issues = res.get('total_issues', 0) if res else 0
                    closed_issues = res.get('closed_issues', 0) if res else 0
                    if total_issues > 0 and closed_issues == total_issues:
                        ticket_ids_to_close.append(ticket_id)
                        if machine_id:
                            machine_ids_to_clear.add(machine_id)

                if ticket_ids_to_close:
                    ticket_placeholders = ','.join(['%s'] * len(ticket_ids_to_close))
                    update_ticket_query = f"UPDATE tickets SET status = 'closed' WHERE id IN ({ticket_placeholders})"
                    cur.execute(update_ticket_query, tuple(ticket_ids_to_close))
                if machine_ids_to_clear:
                    machine_list = list(machine_ids_to_clear)
                    machine_placeholders = ','.join(['%s'] * len(machine_list))
                    update_machine_query = f"UPDATE machines SET ticket_no = NULL WHERE id IN ({machine_placeholders})"
                    cur.execute(update_machine_query, tuple(machine_list))
        except Exception as ticket_update_error:
            print(f"ERROR: Failed to update tickets/machines: {str(ticket_update_error)}")
            import traceback
            traceback.print_exc()
        except Exception as ticket_update_error:
            # Log the error but don't fail the whole operation
            print(f"ERROR: Failed to update tickets/machines: {str(ticket_update_error)}")
            import traceback
            traceback.print_exc()

        cnx.commit()
        cur.close()
        cnx.close()

        return jsonify({
            "success": True,
            "message": f"Successfully transferred {inserted_count} row(s) to work done",
            "count": inserted_count,
            "work_front_ids": [row.get('id') for row in work_front_rows if row.get('id')]
        })

    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        if cnx:
            cnx.rollback()
        print(f"Unexpected error in transfer_to_workdone: {str(exc)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception:
            pass


@workfront_bp.route("/api/workfront/undo-transfer-to-workdone", methods=["POST"])
def undo_transfer_to_workdone():
    """Restore recently moved work_front rows from work_done back to Workfront."""
    cnx = cur = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        raw_work_front_ids = data.get("work_front_ids", [])
        work_front_ids = []
        for raw_id in raw_work_front_ids:
            try:
                work_front_id = int(raw_id)
            except (TypeError, ValueError):
                continue
            if work_front_id > 0 and work_front_id not in work_front_ids:
                work_front_ids.append(work_front_id)

        if not work_front_ids:
            return jsonify({"error": "No valid work_front_ids provided"}), 400

        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)

        placeholders = ','.join(['%s'] * len(work_front_ids))
        cur.execute(
            f"""
            SELECT wf.id, wf.issue_id, ti.ticket_id, t.machine_id, t.ticket_no
            FROM work_front wf
            LEFT JOIN ticket_issues ti ON wf.issue_id = ti.id
            LEFT JOIN tickets t ON ti.ticket_id = t.id
            WHERE wf.id IN ({placeholders})
            """,
            tuple(work_front_ids)
        )
        work_front_rows = cur.fetchall()

        if not work_front_rows:
            return jsonify({"error": "No rows found to restore"}), 400

        found_work_front_ids = [row.get('id') for row in work_front_rows if row.get('id')]
        found_placeholders = ','.join(['%s'] * len(found_work_front_ids))

        cur.execute(
            f"DELETE FROM work_done WHERE work_front_id IN ({found_placeholders})",
            tuple(found_work_front_ids)
        )
        cur.execute(
            f"UPDATE work_front SET status = 'open' WHERE id IN ({found_placeholders})",
            tuple(found_work_front_ids)
        )

        issue_ids = list({row.get('issue_id') for row in work_front_rows if row.get('issue_id')})
        if issue_ids:
            issue_placeholders = ','.join(['%s'] * len(issue_ids))
            cur.execute(
                f"UPDATE ticket_issues SET status = 'open' WHERE id IN ({issue_placeholders})",
                tuple(issue_ids)
            )

        ticket_ids = list({row.get('ticket_id') for row in work_front_rows if row.get('ticket_id')})
        if ticket_ids:
            ticket_placeholders = ','.join(['%s'] * len(ticket_ids))
            cur.execute(
                f"UPDATE tickets SET status = 'open' WHERE id IN ({ticket_placeholders})",
                tuple(ticket_ids)
            )
            try:
                cur.execute(
                    f"""
                    UPDATE machines m
                    INNER JOIN tickets t ON t.machine_id = m.id
                    SET m.ticket_no = t.ticket_no
                    WHERE t.id IN ({ticket_placeholders})
                    """,
                    tuple(ticket_ids)
                )
            except Exception as machine_error:
                print(f"WARNING: Failed to restore machine ticket_no: {str(machine_error)}")

        cnx.commit()

        return jsonify({
            "success": True,
            "message": f"Restored {len(found_work_front_ids)} row(s) to workfront",
            "count": len(found_work_front_ids),
            "work_front_ids": found_work_front_ids
        })

    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        if cnx:
            cnx.rollback()
        print(f"Unexpected error in undo_transfer_to_workdone: {str(exc)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            if cur:
                cur.close()
            if cnx:
                cnx.close()
        except Exception:
            pass
