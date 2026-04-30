"""Customer List related routes."""
from datetime import date, datetime, time

from flask import Blueprint, jsonify, render_template
from mysql.connector import Error

from config import DB_CONFIG
from database import get_connection

customer_list_bp = Blueprint("customer_list", __name__)


def _format_date(value):
    """Format date/datetime values for the frontend table."""
    if not value:
        return ""
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.strftime("%d-%b-%y")
    return str(value)


def _format_time(value):
    """Format time values as HH:MM."""
    if not value:
        return ""
    if isinstance(value, time):
        return value.strftime("%H:%M")
    return str(value)


def _unique_customer_key(row):
    """Build a normalized dedupe key for customer list rows."""
    return (
        str(row.get("customer_name") or "").strip().casefold(),
        str(row.get("zone") or "").strip().casefold(),
        str(row.get("area") or "").strip().casefold(),
        str(row.get("route") or "").strip().casefold(),
        str(row.get("mc_no") or "").strip().casefold(),
    )


@customer_list_bp.route("/customer-list")
def customer_list():
    return render_template("customer_list.html")


@customer_list_bp.route("/api/customer-list", methods=["GET"])
def get_customer_list():
    """Fetch customer list rows by joining companies, machines, contacts, and cluster."""
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        query = """
            SELECT
                c.id AS company_id,
                m.id AS machine_id,
                cont.id AS contact_id,
                c.name AS customer_name,
                m.mc_no AS mc_no,
                m.model AS model,
                COALESCE(st.status_option, CAST(m.status AS CHAR), '') AS machine_status,
                c.gstin AS gstin,
                m.Inv_Dt AS invoice_date,
                m.Inv_Value AS invoice_value,
                m.Inv_No AS invoice_no,
                m.start_dt AS start_date,
                m.end_dt AS end_date,
                cont.name AS contact_person,
                cont.designation AS designation,
                cont.phone AS contact_number,
                c.address1 AS address1,
                c.address2 AS address2,
                c.address3 AS address3,
                c.city AS city,
                c.pin AS pin,
                c.state AS state,
                c.country AS country,
                cl.rg AS rg,
                cl.cluster AS cluster_name,
                COALESCE(sec.security_option, CAST(c.security AS CHAR), '') AS security,
                c.weekly_off_start AS weekly_off_start,
                c.weekly_off_end AS weekly_off_end,
                c.working_hrs_start AS working_hours_start,
                c.working_hrs_end AS working_hours_end,
                c.zone AS zone,
                c.area AS area,
                c.route AS route,
                c.cluster AS company_cluster
            FROM companies c
            LEFT JOIN machines m ON m.company_id = c.id
            LEFT JOIN contacts cont ON cont.company_id = c.id
                                AND (m.id IS NULL OR cont.machine_id = m.id)
            LEFT JOIN status_options st ON st.id = m.status
            LEFT JOIN security_options sec ON sec.id = c.security                                                                                                                                                                        
            LEFT JOIN cluster cl
                   ON c.zone REGEXP '^[0-9]+$'
                  AND c.area REGEXP '^[0-9]+$'
                  AND c.route REGEXP '^[0-9]+$'
                  AND c.cluster REGEXP '^[0-9]+$'
                  AND cl.z = CAST(c.zone AS UNSIGNED)
                  AND cl.a = CAST(c.area AS UNSIGNED)
                  AND cl.r = CAST(c.route AS UNSIGNED)
                  AND cl.c = CAST(c.cluster AS UNSIGNED)
            
            ORDER BY m.Inv_Dt ASC, m.mc_no ASC
        """
        cur.execute(query)
        rows = cur.fetchall() or []

        unique_rows = []
        seen_keys = set()
        for row in rows:
            row_key = _unique_customer_key(row)
            if row_key in seen_keys:
                continue
            seen_keys.add(row_key)
            unique_rows.append(row)

        data = []
        for idx, row in enumerate(unique_rows, start=1):
            data.append({
                "id": f"{row.get('company_id') or 'c0'}-{row.get('machine_id') or 'm0'}-{row.get('contact_id') or 'p0'}",
                "sl": str(idx),
                "customer_name": str(row.get("customer_name") or ""),
                "mc_no": str(row.get("mc_no") or ""),
                "model": str(row.get("model") or ""),
                "status": str(row.get("machine_status") or ""),
                "gstin": str(row.get("gstin") or ""),
                "invoice_date": _format_date(row.get("invoice_date")),
                "invoice_value": str(row.get("invoice_value") or ""),
                "invoice_no": str(row.get("invoice_no") or ""),
                "start_date": _format_date(row.get("start_date")),
                "end_date": _format_date(row.get("end_date")),
                "contact_person": str(row.get("contact_person") or ""),
                "designation": str(row.get("designation") or ""),
                "contact_number": str(row.get("contact_number") or ""),
                "address1": str(row.get("address1") or ""),
                "address2": str(row.get("address2") or ""),
                "address3": str(row.get("address3") or ""),
                "city": str(row.get("city") or ""),
                "pin": str(row.get("pin") or ""),
                "state": str(row.get("state") or ""),
                "country": str(row.get("country") or ""),
                "rg": str(row.get("rg") or ""),
                "cluster": str(row.get("cluster_name") or ""),
                "security": str(row.get("security") or ""),
                "weekly_off_start": str(row.get("weekly_off_start") or ""),
                "weekly_off_end": str(row.get("weekly_off_end") or ""),
                "working_hours_start": _format_time(row.get("working_hours_start")),
                "working_hours_end": _format_time(row.get("working_hours_end")),
                "zone": str(row.get("zone") or ""),
                "area": str(row.get("area") or ""),
                "route": str(row.get("route") or ""),
                "cluster_code": str(row.get("company_cluster") or "")
            })

        return jsonify(data)
    except Error as exc:
        print(f"Database error in get_customer_list: {str(exc)}")
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        print(f"Unexpected error in get_customer_list: {str(exc)}")
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
 