"""Work Done related routes."""
from flask import Blueprint, render_template, jsonify, request
from mysql.connector import Error
from datetime import date
from database import get_connection
from config import DB_CONFIG

workdone_bp = Blueprint('workdone', __name__)


@workdone_bp.route("/workdone")
def workdone():
    return render_template("workdone.html")


@workdone_bp.route("/api/workdone", methods=["GET"])
def get_workdone():
    """Fetch all work_done records from MySQL."""
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        # Use normalized schema: join work_done -> work_front -> ticket_issues -> tickets -> machines -> companies -> short_form -> cluster -> contacts
        query = """
                 SELECT wd.id AS id,
                     wd.done_date AS date,
                     wd.done_by AS done_by,
                   m.mc_no AS mc_no,
                   comp.name AS company,
                   sf.prior AS priority,
                   sf.s, sf.a, sf.i, sf.d, sf.e, sf.f, sf.p,
                   sf.purpose AS purpose,
                   ti.fault AS remarks,
                   cl.zarc AS zarc,
                   cl.cluster AS cluster,
                   ti.log_by AS person,
                   cont.phone AS contact_no,
                   cl.rg AS rg,
                   wd.work_front_id AS work_front_id
            FROM work_done wd
            LEFT JOIN work_front wf ON wd.work_front_id = wf.id
            LEFT JOIN ticket_issues ti ON wf.issue_id = ti.id
            LEFT JOIN tickets t ON ti.ticket_id = t.id
            LEFT JOIN machines m ON t.machine_id = m.id
            LEFT JOIN companies comp ON t.company_id = comp.id
            LEFT JOIN short_form sf ON wf.short_form_id = sf.id
            LEFT JOIN cluster cl ON wf.cluster_id = cl.id
            LEFT JOIN contacts cont ON t.contact_id = cont.id
            ORDER BY wd.id ASC
        """
        cur.execute(query)
        rows = cur.fetchall()
        data = []

        # Fetch all spares for all work_done records in one query using spare_used and spare_option
        work_done_ids = [row.get('id') for row in rows if row.get('id')]
        spares_map = {}
        if work_done_ids:
            try:
                placeholders = ','.join(['%s'] * len(work_done_ids))
                spares_query = f"""
                    SELECT su.work_done_id, so.spare_name
                    FROM spare_used su
                    JOIN spare_option so ON su.spare_option_id = so.id
                    WHERE su.work_done_id IN ({placeholders})
                    ORDER BY su.work_done_id, su.id
                """
                cur.execute(spares_query, tuple(work_done_ids))
                spares_rows = cur.fetchall()
                for spare_row in spares_rows:
                    wd_id = spare_row.get('work_done_id')
                    spare_value = spare_row.get('spare_name') or ''
                    if wd_id not in spares_map:
                        spares_map[wd_id] = []
                    spares_map[wd_id].append(str(spare_value))
            except Error as e:
                print(f"Error fetching spare_used/spare_option: {e}")
                spares_map = {}

        for row in rows:
            d = row.get('date')
            date_str = d.strftime('%d-%b-%y') if d and hasattr(d, 'strftime') else (str(d) if d else '')

            # Get spares for this work_done record (up to 5)
            work_done_id = row.get('id')
            spares_list = spares_map.get(work_done_id, [])
            # Pad to 5 spares, fill empty strings if less than 5
            spares_array = (spares_list + [''] * 5)[:5]

            data.append({
                'id': row.get('id'),
                'sl': str(row.get('id')) if row.get('id') else '',
                'date': date_str,
                'mc': str(row.get('mc_no')) if row.get('mc_no') else '',
                'company': str(row.get('company')) if row.get('company') else '',
                'prior': str(row.get('priority')) if row.get('priority') else '',
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
                'cluster': str(row.get('cluster')) if row.get('cluster') else '',
                'person': str(row.get('person')) if row.get('person') else '',
                'contact': str(row.get('contact_no')) if row.get('contact_no') else '',
                'rg': str(row.get('rg')) if row.get('rg') else '',
                'done_date': date_str,
                'done_by': str(row.get('done_by')) if row.get('done_by') else '',
                'spares': spares_array  # Array of up to 5 spares
            })
        return jsonify(data)
    except Error as exc:
        print(f"Database error in get_workdone: {str(exc)}")
        return jsonify({'error': str(exc)}), 500
    except Exception as exc:
        print(f"Unexpected error in get_workdone: {str(exc)}")
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


@workdone_bp.route("/api/spares", methods=["GET"])
def get_spares():
    """Fetch all spares options from spares_option table for dropdown."""
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        
        try:
            # Fetch all spare options from spare_option table
            query = "SELECT id, spare_name FROM spare_option ORDER BY spare_name ASC"
            cur.execute(query)
            rows = cur.fetchall()
            
            spares = []
            for row in rows:
                spares.append({
                    'id': row.get('id'),
                    'name': str(row.get('spare_name')) if row.get('spare_name') else ''
                })
            
            return jsonify(spares)
        except Error as e:
            # If table doesn't exist, return empty array
            print(f"Error fetching spares_option: {e}")
            return jsonify([])
    except Exception as exc:
        print(f"Unexpected error in get_spares: {str(exc)}")
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


@workdone_bp.route("/api/workdone/<int:record_id>", methods=["PUT"])
def update_workdone(record_id):
    """Update work_done record."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if 'done_date' in data:
            update_fields.append("done_date = %s")
            # Parse date string if provided
            done_date = data.get('done_date')
            if done_date:
                try:
                    # Handle DD-MMM-YY format
                    from datetime import datetime
                    if isinstance(done_date, str):
                        date_obj = datetime.strptime(done_date, '%d-%b-%y').date()
                    else:
                        date_obj = done_date
                    update_values.append(date_obj)
                except:
                    update_values.append(None)
            else:
                update_values.append(None)
        
        if 'done_by' in data:
            update_fields.append("done_by = %s")
            update_values.append(data.get('done_by') or None)
        
        # 'spraces' is not part of the normalized schema; ignore if provided
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_values.append(record_id)
        query = f"UPDATE work_done SET {', '.join(update_fields)} WHERE id = %s"
        
        cur.execute(query, update_values)
        cnx.commit()
        if cur.rowcount == 0:
            return jsonify({'error': 'Record not found'}), 404
        return jsonify({'success': True})
    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({'error': str(exc)}), 500
    except Exception as exc:
        if cnx:
            cnx.rollback()
        print(f"Unexpected error in update_workdone: {str(exc)}")
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


@workdone_bp.route("/api/workdone/<int:record_id>/spares", methods=["PUT"])
def update_workdone_spares(record_id):
    """Update spares for a work_done record."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    spares_list = data.get('spares', [])
    if not isinstance(spares_list, list):
        return jsonify({'error': 'Spares must be an array'}), 400
    
    # Limit to 5 spares
    spares_list = spares_list[:5]
    
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()

        # Delete existing spare_used entries for this work_done_id
        cur.execute("DELETE FROM spare_used WHERE work_done_id = %s", (record_id,))

        inserted = 0
        # For each spare name, find or create spare_option, then insert spare_used
        for spare in spares_list:
            if not spare or not str(spare).strip():
                continue
            spare_name = str(spare).strip()
            # Find existing spare_option
            cur.execute("SELECT id FROM spare_option WHERE spare_name = %s LIMIT 1", (spare_name,))
            row = cur.fetchone()
            if row:
                spare_option_id = row[0]
            else:
                # Insert new spare_option
                cur.execute("INSERT INTO spare_option (spare_name) VALUES (%s)", (spare_name,))
                spare_option_id = cur.lastrowid

            # Insert into spare_used
            cur.execute("INSERT INTO spare_used (work_done_id, spare_option_id) VALUES (%s, %s)", (record_id, spare_option_id))
            inserted += 1

        cnx.commit()
        return jsonify({'success': True, 'message': f'Updated {inserted} spares'})
    except Error as exc:
        if cnx:
            cnx.rollback()
        return jsonify({'error': str(exc)}), 500
    except Exception as exc:
        if cnx:
            cnx.rollback()
        print(f"Unexpected error in update_workdone_spares: {str(exc)}")
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
