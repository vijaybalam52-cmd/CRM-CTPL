"""Trip Sheet related routes."""
from flask import Blueprint, render_template, jsonify, request
from mysql.connector import Error
from datetime import time, timedelta
import math
from database import get_connection
from config import DB_CONFIG

tripsheet_bp = Blueprint('tripsheet', __name__)


def time_to_decimal_hours(time_obj):
    """Convert TIME object to decimal hours (e.g., 01:30:00 -> 1.50)."""
    if time_obj is None:
        return ''
    if isinstance(time_obj, str):
        # Handle string format like "01:30:00"
        try:
            parts = time_obj.split(':')
            hours = int(parts[0])
            minutes = int(parts[1]) if len(parts) > 1 else 0
            return f"{hours + minutes / 60.0:.2f}"
        except:
            return ''
    if isinstance(time_obj, time):
        total_seconds = time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second
        hours = total_seconds / 3600.0
        return f"{hours:.2f}"
    if isinstance(time_obj, timedelta):
        total_seconds = time_obj.total_seconds()
        hours = total_seconds / 3600.0
        return f"{hours:.2f}"
    return ''


def time_to_hhmm_format(time_obj):
    """Convert TIME/timedelta to HH.MM format (e.g., 01:30:00 -> 1.30).
    User expects 1.30 = 1 hour 30 minutes, NOT 1.50 (decimal hours).
    """
    if time_obj is None:
        return ''
    if isinstance(time_obj, time):
        h, m = time_obj.hour, time_obj.minute
        return f"{h}.{m:02d}"
    if isinstance(time_obj, timedelta):
        total_seconds = int(time_obj.total_seconds())
        h = total_seconds // 3600
        m = (total_seconds % 3600) // 60
        return f"{h}.{m:02d}"
    if isinstance(time_obj, str) and ':' in time_obj:
        try:
            parts = time_obj.split(':')
            h = int(parts[0])
            m = int(parts[1]) if len(parts) > 1 else 0
            return f"{h}.{m:02d}"
        except:
            return ''
    return ''


def hhmm_to_decimal(hhmm_str):
    """Parse HH.MM format (1.30 = 1hr 30min) to decimal hours for totals."""
    if not hhmm_str or hhmm_str == '':
        return 0.0
    try:
        parts = str(hhmm_str).split('.')
        h = int(parts[0]) if parts[0] else 0
        m = int(parts[1]) if len(parts) > 1 else 0
        return h + (m / 60.0)
    except:
        return 0.0


def decimal_hours_to_time(decimal_str):
    """Convert decimal hours string (e.g., "1.50") to TIME object."""
    if not decimal_str or decimal_str == '':
        return None
    try:
        hours = float(decimal_str)
        total_seconds = int(hours * 3600)
        h = total_seconds // 3600
        m = (total_seconds % 3600) // 60
        s = total_seconds % 60
        return time(h, m, s)
    except:
        return None


def add_time_to_time(base_time, hours_to_add):
    """Add hours (as decimal) to a TIME object and return new TIME object."""
    if base_time is None:
        return None
    if hours_to_add is None or hours_to_add == 0:
        return base_time
    
    try:
        # Convert base_time to total seconds
        base_seconds = base_time.hour * 3600 + base_time.minute * 60 + base_time.second
        
        # Add hours (convert to seconds)
        add_seconds = int(float(hours_to_add) * 3600)
        total_seconds = base_seconds + add_seconds
        
        # Handle overflow (more than 24 hours)
        total_seconds = total_seconds % (24 * 3600)
        
        # Convert back to TIME
        h = total_seconds // 3600
        m = (total_seconds % 3600) // 60
        s = total_seconds % 60
        return time(h, m, s)
    except:
        return base_time


def get_distance_from_table(cur, from_zarc, to_zarc, from_location=None, to_location=None):
    """Get distance from distance table using ZARC or location names as fallback.
    Returns distance in kilometers or None if not found.
    """
    if not cur:
        return None
     
    # Try by ZARC first (preferred)
    if from_zarc and to_zarc:
        try:
            cur.execute("""
                SELECT distance 
                FROM distance 
                WHERE from_location_zarc = %s AND to_location_zarc = %s
                LIMIT 1
            """, (str(from_zarc).strip(), str(to_zarc).strip()))
            result = cur.fetchone()
            if result and result.get('distance') is not None:
                return float(result['distance'])
        except Exception as e:
            print(f"Error querying distance by ZARC: {e}")
    
    # Fallback to location names
    if from_location and to_location:
        try:
            cur.execute("""
                SELECT distance 
                FROM distance 
                WHERE LOWER(TRIM(from_location)) = LOWER(TRIM(%s)) 
                AND LOWER(TRIM(to_location)) = LOWER(TRIM(%s))
                LIMIT 1
            """, (from_location.strip(), to_location.strip()))
            result = cur.fetchone()
            if result and result.get('distance') is not None:
                return float(result['distance'])
        except Exception as e:
            print(f"Error querying distance by location name: {e}")
    
    return None


def get_travel_time_from_table(cur, from_zarc, to_zarc, from_location=None, to_location=None):
    """Get travel time from distance_time table using ZARC or location names as fallback.
    Returns TIME object or None if not found.
    Time_mins is in minutes, convert to TIME object.
    """
    if not cur:
        return None
    
    # Try by ZARC first (preferred)
    if from_zarc and to_zarc:
        try:
            cur.execute("""
                SELECT Time_mins 
                FROM distance_time 
                WHERE from_location_zarc = %s AND to_location_zarc = %s
                LIMIT 1
            """, (str(from_zarc).strip(), str(to_zarc).strip()))
            result = cur.fetchone()
            if result and result.get('Time_mins') is not None:
                minutes = float(result['Time_mins'])
                # Convert minutes to TIME object
                hours = int(minutes // 60)
                mins = int(minutes % 60)
                return time(hours, mins, 0)
        except Exception as e:
            print(f"Error querying travel time by ZARC: {e}")
    
    # Fallback to location names
    if from_location and to_location:
        try:
            cur.execute("""
                SELECT Time_mins 
                FROM distance_time 
                WHERE LOWER(TRIM(from_location)) = LOWER(TRIM(%s)) 
                AND LOWER(TRIM(to_location)) = LOWER(TRIM(%s))
                LIMIT 1
            """, (from_location.strip(), to_location.strip()))
            result = cur.fetchone()
            if result and result.get('Time_mins') is not None:
                minutes = float(result['Time_mins'])
                # Convert minutes to TIME object
                hours = int(minutes // 60)
                mins = int(minutes % 60)
                return time(hours, mins, 0)
        except Exception as e:
            print(f"Error querying travel time by location name: {e}")
    
    return None


def time_to_decimal_hours_for_calc(time_obj):
    """Convert TIME object to decimal hours for calculation."""
    if time_obj is None:
        return 0.0
    if isinstance(time_obj, time):
        return time_obj.hour + time_obj.minute / 60.0 + time_obj.second / 3600.0
    return 0.0


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula.
    Returns distance in kilometers.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    
    # Convert to float
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except:
        return None
    
    # Radius of Earth in kilometers
    R = 6371.0
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 2)


@tripsheet_bp.route("/tripsheet")
def tripsheet():
    return render_template("tripsheet.html")


def _get_food_times_from_job_time(cur):
    """Fetch breakfast and lunch times from job_time table for Food & Fuel placement.
    The job_time table should contain entries with purpose='BF' for breakfast and purpose='Lunch' for lunch.
    """
    food_times = {'breakfast_time': '', 'lunch_time': ''}
    try:
        # First, verify the job_time table exists and has data
        cur.execute("SELECT COUNT(*) as count FROM job_time")
        count_result = cur.fetchone()
        if count_result and count_result.get('count', 0) == 0:
            print("Warning: job_time table is empty")
            return food_times
        
        # Fetch all purpose and est_time_job values from job_time table
        # id=7 is Lunch, id=8 is BF (Breakfast)
        cur.execute("SELECT id, purpose, est_time_job FROM job_time")
        rows = cur.fetchall()
        
        if not rows:
            print("Warning: No rows found in job_time table")
            return food_times
        
        # Process each row to find BF (breakfast, id=8) and Lunch (id=7) entries
        for row in rows:
            row_id = row.get('id')
            purpose_val = (row.get('purpose') or '').strip().lower()
            time_val = row.get('est_time_job')
            
            if not purpose_val or not time_val:
                continue
            
            # Match Lunch: id=7 or purpose='Lunch' (case-insensitive)
            if row_id == 7 or purpose_val == 'lunch':
                food_times['lunch_time'] = time_to_hhmm_format(time_val) if time_val else ''
                print(f"Found Lunch time from job_time (id={row_id}, purpose='{purpose_val}'): {food_times['lunch_time']}")
            
            # Match BF (Breakfast): id=8 or purpose='BF' (case-insensitive)
            elif row_id == 8 or purpose_val == 'bf':
                food_times['breakfast_time'] = time_to_hhmm_format(time_val) if time_val else ''
                print(f"Found BF (Breakfast) time from job_time (id={row_id}, purpose='{purpose_val}'): {food_times['breakfast_time']}")
        
        # Verify both times were found
        if not food_times['breakfast_time']:
            print("Warning: BF (Breakfast) time not found in job_time table")
        if not food_times['lunch_time']:
            print("Warning: Lunch time not found in job_time table")
            
    except Exception as e:
        print(f"Error: Could not fetch food times from job_time table: {e}")
        import traceback
        traceback.print_exc()
    
    return food_times


@tripsheet_bp.route("/api/tripsheet", methods=["GET"])
def get_tripsheet():
    """Generate trip sheet data on-the-fly without database storage."""
    cnx = cur = None
    try:
        # Get work_front_ids and PR order from query parameters
        work_front_ids = request.args.getlist('id')  # Get all 'id' parameters from URL
        work_front_ids = [int(id) for id in work_front_ids if id.isdigit()]  # Convert to integers
        pr_order = request.args.getlist('pr')  # Get all 'pr' parameters for ordering
        
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        
        # Get breakfast/lunch times for Food & Fuel placement (based on user schd time)
        food_times = _get_food_times_from_job_time(cur)
        
        # Generate trip sheet data on-the-fly with work_front_ids filter if provided
        if work_front_ids and len(work_front_ids) > 0:
            print(f"Filtering trip sheet by work_front_ids: {work_front_ids}, PR order: {pr_order}")
            data = _generate_tripsheet_data(cur, work_front_ids=work_front_ids, pr_order=pr_order)
        else:
            # Default: fetch all rows (no filtering)
            print("Fetching trip sheet with all rows (no filter)")
            data = _generate_tripsheet_data(cur)
        
        # Return rows + food times for frontend to place Food & Fuel based on schd time
        return jsonify({
            'rows': data,
            'breakfast_time': food_times['breakfast_time'],
            'lunch_time': food_times['lunch_time']
        })
    except Error as exc:
        print(f"Database error in get_tripsheet: {str(exc)}")
        return jsonify({'error': str(exc)}), 500
    except Exception as exc:
        print(f"Unexpected error in get_tripsheet: {str(exc)}")
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


def _generate_tripsheet_data(cur, pr_values=None, work_front_ids=None, pr_order=None):
    """Generate trip sheet data on-the-fly without saving to database.
    Returns list of row dictionaries ready for frontend.
    
    Args:
        cur: Database cursor
        pr_values: DEPRECATED - Optional list of PR values (not used, PR is temporary)
        work_front_ids: Optional list of work_front IDs to filter by
        pr_order: Optional list of PR values in order (for maintaining user's PR-based ordering)
    """
    data = []
    
    # Build query to filter by work_front_ids if provided
    # Note: PR values are temporary (not in database), so we use work_front_ids for filtering
    # Exclude rows with status='done' - only include rows that are not done
    if work_front_ids and len(work_front_ids) > 0:
        # Filter by work_front IDs and exclude status='done'
        placeholders = ','.join(['%s'] * len(work_front_ids))
        query = f"""
            SELECT wf.id AS id,
                   m.mc_no AS mc_no,
                   comp.name AS company,
                   cl.cluster AS cluster,
                   sf.purpose AS purpose,
                   cl.zarc AS zarc,
                   cl.rg AS rg
            FROM work_front wf
            LEFT JOIN short_form sf ON wf.short_form_id = sf.id
            LEFT JOIN cluster cl ON wf.cluster_id = cl.id
            LEFT JOIN ticket_issues ti ON wf.issue_id = ti.id
            LEFT JOIN tickets t ON ti.ticket_id = t.id
            LEFT JOIN machines m ON t.machine_id = m.id
            LEFT JOIN companies comp ON t.company_id = comp.id
            WHERE wf.id IN ({placeholders}) AND (wf.status != 'done' OR wf.status IS NULL)
        """
        cur.execute(query, tuple(work_front_ids))
        workfront_rows = cur.fetchall()
        
        # Sort rows by PR order if provided (maintain user's PR-based ordering)
        if pr_order and len(pr_order) > 0 and len(pr_order) == len(work_front_ids):
            # Create a mapping of work_front_id to PR value for sorting
            # pr_order and work_front_ids are in the same order (already sorted by PR in frontend)
            id_to_pr = {}
            for idx, wf_id in enumerate(work_front_ids):
                if idx < len(pr_order):
                    try:
                        pr_val = pr_order[idx].strip()
                        id_to_pr[wf_id] = int(pr_val) if pr_val and pr_val.isdigit() else 999999
                    except:
                        id_to_pr[wf_id] = 999999
            
            # Sort workfront_rows by PR value (ascending: 1, 2, 3...)
            workfront_rows.sort(key=lambda row: id_to_pr.get(row['id'], 999999))
            print(f"Sorted {len(workfront_rows)} rows by PR order: {[id_to_pr.get(r['id'], '?') for r in workfront_rows]}")
    else:
        # Default: Get all work_front rows (no filtering) but exclude status='done'
        query = """
            SELECT wf.id AS id,
                   m.mc_no AS mc_no,
                   comp.name AS company,
                   cl.cluster AS cluster,
                   sf.purpose AS purpose,
                   cl.zarc AS zarc,
                   cl.rg AS rg
            FROM work_front wf
            LEFT JOIN short_form sf ON wf.short_form_id = sf.id
            LEFT JOIN cluster cl ON wf.cluster_id = cl.id
            LEFT JOIN ticket_issues ti ON wf.issue_id = ti.id
            LEFT JOIN tickets t ON ti.ticket_id = t.id
            LEFT JOIN machines m ON t.machine_id = m.id
            LEFT JOIN companies comp ON t.company_id = comp.id
            WHERE wf.status != 'done' OR wf.status IS NULL
            ORDER BY wf.id ASC
        """
        cur.execute(query)
        workfront_rows = cur.fetchall()
    
    if not workfront_rows:
        return data

    def get_location_from_start_end_by_rg(rg_value):
        """Fetch start/end location mapping by RG from start_end_location table."""
        if not rg_value:
            return None
        try:
            cur.execute("""
                SELECT customer_name, cluster_location, zarc
                FROM start_end_location
                WHERE rg = %s
                LIMIT 1
            """, (str(rg_value).strip(),))
            location_row = cur.fetchone()
            if location_row:
                return {
                    'customer_name': location_row.get('customer_name') or 'Factory',
                    'cluster_location': location_row.get('cluster_location') or 'E-City',
                    'zarc': location_row.get('zarc')
                }
        except Exception as e:
            print(f"Note: Could not find location for RG '{rg_value}' in start_end_location table: {e}")
        return None
    
    # Get start location from the first selected work_front row's RG.
    # pr_order only controls sorting; it is not the RG used in start_end_location.
    start_location = {'customer_name': 'Factory', 'cluster_location': None, 'zarc': None}
    first_row_rg = workfront_rows[0].get('rg', '').strip() if workfront_rows else ''
    if first_row_rg:
        start_row = get_location_from_start_end_by_rg(first_row_rg)
        if start_row:
            start_location = start_row
            print(f"Found start location for RG '{first_row_rg}': {start_location['customer_name']} - {start_location['cluster_location']}")
    
    # If not found, use the first selected work_front cluster as a neutral fallback.
    # This keeps Chennai/other region trips local instead of forcing E-City.
    if not start_location['cluster_location']:
        first_row_cluster = workfront_rows[0].get('cluster', '').strip() if workfront_rows else ''
        first_row_zarc = workfront_rows[0].get('zarc')
        if first_row_cluster:
            start_location = {
                'customer_name': 'Factory',
                'cluster_location': first_row_cluster,
                'zarc': first_row_zarc
            }
            print(f"Set start location from first selected work_front cluster: {start_location['cluster_location']}")
    
    # Final fallback only when no mapping and no selected cluster are available.
    if not start_location['cluster_location']:
        start_location['cluster_location'] = 'Factory'
        print("Using default start location: Factory")
    
    # If zarc not found in start_end_location, try to get it from distance table
    if not start_location['zarc']:
        try:
            cur.execute("""
                SELECT from_location_zarc, to_location_zarc, from_location, to_location
                FROM distance
                WHERE from_location = %s OR to_location = %s
                LIMIT 1
            """, (start_location['cluster_location'], start_location['cluster_location']))
            dist_row = cur.fetchone()
            if dist_row:
                if dist_row.get('from_location') == start_location['cluster_location']:
                    start_location['zarc'] = dist_row.get('from_location_zarc')
                elif dist_row.get('to_location') == start_location['cluster_location']:
                    start_location['zarc'] = dist_row.get('to_location_zarc')
        except Exception as e:
            print(f"Note: Could not find ZARC for start location from distance table: {e}")
    
    # Trip should end at the same location where it started.
    end_location = start_location.copy()
    print(f"Set end location same as start location: {end_location['customer_name']} - {end_location['cluster_location']}")
    
    # Load job_time table for est_time_job lookup
    job_time_purpose_map = {}
    try:
        cur.execute("SELECT purpose, est_time_job FROM job_time")
        for row in cur.fetchall():
            purpose_val = (row.get('purpose') or '').strip()
            est_time_job_val = row.get('est_time_job')
            if purpose_val:
                time_obj = None
                if est_time_job_val is not None:
                    if isinstance(est_time_job_val, time):
                        time_obj = est_time_job_val
                    elif isinstance(est_time_job_val, timedelta):
                        total_seconds = int(est_time_job_val.total_seconds())
                        h = total_seconds // 3600
                        m = (total_seconds % 3600) // 60
                        s = total_seconds % 60
                        time_obj = time(h, m, s)
                    elif isinstance(est_time_job_val, (int, float)):
                        time_obj = decimal_hours_to_time(str(est_time_job_val))
                    elif isinstance(est_time_job_val, str):
                        if ':' in est_time_job_val:
                            parts = est_time_job_val.split(':')
                            try:
                                h, m = int(parts[0]) if parts[0] else 0, int(parts[1]) if len(parts) > 1 else 0
                                time_obj = time(h, m, 0)
                            except:
                                time_obj = decimal_hours_to_time(est_time_job_val)
                        else:
                            time_obj = decimal_hours_to_time(est_time_job_val)
                job_time_purpose_map[purpose_val.lower()] = time_obj
    except Error as e:
        print(f"Error loading job_time table: {e}")
        job_time_purpose_map = {}
    
    def get_est_job_time_from_purpose(purpose_str):
        if not purpose_str or purpose_str.strip() == '':
            return None
        purpose_clean = purpose_str.strip().lower()
        if purpose_clean in job_time_purpose_map:
            return job_time_purpose_map[purpose_clean]
        for job_purpose, est_time in job_time_purpose_map.items():
            if purpose_clean.startswith(job_purpose) or job_purpose.startswith(purpose_clean):
                return est_time
            for job_part in job_purpose.replace('-', ' ').split('/'):
                job_part = job_part.strip().lower()
                if len(job_part) >= 3 and (job_part in purpose_clean or purpose_clean in job_part):
                    return est_time
        return None
    
    first_workfront_id = workfront_rows[0]['id'] if workfront_rows else None
    
    # Add Factory row (using start location from start_end_location table)
    data.append({
        'id': None,
        'sn': '',
        'Customer_Name': start_location['customer_name'],
        'mc_no': '',
        'purpose': '',
        'task_class': '',
        'cluster_no': '',
        'cluster_location': start_location['cluster_location'],
        'est_dist_kms': '',
        'est_trvl_time': '',
        'food_fuel_others': '',
        'est_job_time': '',
        'schd_et': '',
        'actual_time': '',
        'actual_odo_read': '',
        'work_front_id': first_workfront_id
    })
    
    prev_location_zarc = start_location.get('zarc')
    prev_location_name = start_location['cluster_location']
    prev_workfront_id = first_workfront_id
    current_schd_et = None
    
    # Process work_front rows
    for idx, wf_row in enumerate(workfront_rows):
        cluster_location = wf_row['cluster'] or ''
        company_name = wf_row['company'] or ''
        mc_no = wf_row['mc_no'] or ''
        purpose = wf_row['purpose'] or ''
        work_front_id = wf_row['id']
        zarc = wf_row.get('zarc') or ''
        
        current_location_name = cluster_location.strip() if cluster_location else None
        current_location_zarc = str(zarc).strip() if zarc else None
        
        est_dist_kms = None
        est_travel_time = None
        if current_location_zarc and prev_location_zarc:
            est_dist_kms = get_distance_from_table(cur, prev_location_zarc, current_location_zarc, 
                                                   prev_location_name, current_location_name)
            est_travel_time = get_travel_time_from_table(cur, prev_location_zarc, current_location_zarc,
                                                         prev_location_name, current_location_name)
            if est_dist_kms is not None:
                est_dist_kms = round(est_dist_kms, 2)
        
        travel_schd_et = None
        if current_schd_et is not None and est_travel_time is not None:
            travel_schd_et = add_time_to_time(current_schd_et, time_to_decimal_hours_for_calc(est_travel_time))
        
        # Add Travel row
        if idx > 0 or (idx == 0 and prev_location_name):
            data.append({
                'id': None,
                'sn': '',
                'Customer_Name': '',
                'mc_no': '',
                'purpose': 'Travel',
                'task_class': '',
                'cluster_no': '',
                'cluster_location': '',
                'est_dist_kms': str(est_dist_kms) if est_dist_kms is not None else '',
                'est_trvl_time': time_to_hhmm_format(est_travel_time) if est_travel_time else '',
                'food_fuel_others': '',
                'est_job_time': '',
                'schd_et': time_to_decimal_hours(travel_schd_et) if travel_schd_et else '',
                'actual_time': '',
                'actual_odo_read': '',
                'work_front_id': prev_workfront_id
            })
            if travel_schd_et:
                current_schd_et = travel_schd_et
        
        # Add Company row
        est_job_time = get_est_job_time_from_purpose(purpose)
        company_schd_et = current_schd_et
        
        data.append({
            'id': None,
            'sn': str(len([r for r in data if r.get('Customer_Name') and r['Customer_Name'] != 'Factory' and r['Customer_Name'] != '']) + 1),
            'Customer_Name': company_name,
            'mc_no': mc_no,
            'purpose': purpose,
            'task_class': '',
            'cluster_no': '',
            'cluster_location': cluster_location,
            'est_dist_kms': '',
            'est_trvl_time': '',
            'food_fuel_others': '',
            'est_job_time': time_to_hhmm_format(est_job_time) if est_job_time else '',
            'schd_et': time_to_decimal_hours(company_schd_et) if company_schd_et else '',
            'actual_time': '',
            'actual_odo_read': '',
            'work_front_id': work_front_id
        })
        
        if current_location_zarc:
            prev_location_zarc = current_location_zarc
        if current_location_name:
            prev_location_name = current_location_name
        prev_workfront_id = work_front_id
    
    # Add return travel row for all locations so the trip closes back at the start.
    if prev_location_zarc:
        last_location_zarc = prev_location_zarc
        end_location_zarc = end_location.get('zarc')
        
        if last_location_zarc and end_location_zarc:
            return_dist_kms = get_distance_from_table(cur, last_location_zarc, end_location_zarc,
                                                      prev_location_name, end_location['cluster_location'])
            return_travel_time = get_travel_time_from_table(cur, last_location_zarc, end_location_zarc,
                                                           prev_location_name, end_location['cluster_location'])
            
            if return_dist_kms is not None:
                return_dist_kms = round(return_dist_kms, 2)
            
            return_schd_et = None
            if current_schd_et is not None and return_travel_time is not None:
                return_schd_et = add_time_to_time(current_schd_et, time_to_decimal_hours_for_calc(return_travel_time))
            
            if return_dist_kms is not None and return_travel_time is not None:
                data.append({
                    'id': None,
                    'sn': '',
                    'Customer_Name': '',
                    'mc_no': '',
                    'purpose': 'Travel',
                    'task_class': '',
                    'cluster_no': '',
                    'cluster_location': '',
                    'est_dist_kms': str(return_dist_kms),
                    'est_trvl_time': time_to_hhmm_format(return_travel_time) if return_travel_time else '',
                    'food_fuel_others': '',
                    'est_job_time': '',
                    'schd_et': time_to_decimal_hours(return_schd_et) if return_schd_et else '',
                    'actual_time': '',
                    'actual_odo_read': '',
                    'work_front_id': prev_workfront_id
                })
                if return_schd_et:
                    current_schd_et = return_schd_et

            data.append({
                'id': None,
                'sn': '',
                'Customer_Name': end_location.get('customer_name') or 'Factory',
                'mc_no': '',
                'purpose': '',
                'task_class': '',
                'cluster_no': '',
                'cluster_location': end_location.get('cluster_location') or '',
                'est_dist_kms': '',
                'est_trvl_time': '',
                'food_fuel_others': '',
                'est_job_time': '',
                'schd_et': time_to_decimal_hours(current_schd_et) if current_schd_et else '',
                'actual_time': '',
                'actual_odo_read': '',
                'work_front_id': prev_workfront_id
            })
    
    # Add total row
    if data:
        regular_rows = [r for r in data if not r.get('isTotal')]
        total_est_dist = sum(float(r['est_dist_kms']) if r['est_dist_kms'] else 0 for r in regular_rows)
        total_est_trvl = sum(hhmm_to_decimal(r['est_trvl_time']) for r in regular_rows)
        total_food_fuel = sum(hhmm_to_decimal(r['food_fuel_others']) for r in regular_rows)
        total_est_job = sum(hhmm_to_decimal(r['est_job_time']) for r in regular_rows)
        total_schd_et = sum(float(r['schd_et']) if r['schd_et'] else 0 for r in regular_rows)
        
        def decimal_to_hhmm(decimal_hours):
            if decimal_hours <= 0:
                return ''
            h = int(decimal_hours)
            m = int(round((decimal_hours - h) * 60))
            return f"{h}.{m:02d}"
        
        data.append({
            'id': None,
            'sn': '',
            'Customer_Name': 'Total',
            'mc_no': '',
            'purpose': '',
            'task_class': '',
            'cluster_no': '',
            'cluster_location': regular_rows[0]['cluster_location'] if regular_rows else '',
            'est_dist_kms': f"{total_est_dist:.0f}" if total_est_dist > 0 else '',
            'est_trvl_time': decimal_to_hhmm(total_est_trvl),
            'food_fuel_others': decimal_to_hhmm(total_food_fuel),
            'est_job_time': decimal_to_hhmm(total_est_job),
            'schd_et': f"{total_schd_et:.2f}" if total_schd_et > 0 else '',
            'actual_time': '',
            'actual_odo_read': '',
            'work_front_id': None,
            'isTotal': True
        })
    
    return data


@tripsheet_bp.route("/api/tripsheet", methods=["POST"])
def create_tripsheet():
    """Create a new trip sheet record - No-op since we don't store in database."""
    # Trip sheet is generated on-the-fly, no database storage
    return jsonify({'success': True, 'message': 'Trip sheet is generated dynamically, no database storage'}), 200


@tripsheet_bp.route("/api/tripsheet/<int:record_id>", methods=["PUT"])
def update_tripsheet(record_id):
    """Update a trip sheet record - No-op since we don't store in database."""
    # Trip sheet is generated on-the-fly, no database storage
    return jsonify({'success': True, 'message': 'Trip sheet is generated dynamically, no database storage'}), 200


@tripsheet_bp.route("/api/tripsheet/<int:record_id>", methods=["DELETE"])
def delete_tripsheet(record_id):
    """Delete a trip sheet record - No-op since we don't store in database."""
    # Trip sheet is generated on-the-fly, no database storage
    return jsonify({'success': True, 'message': 'Trip sheet is generated dynamically, no database storage'}), 200


@tripsheet_bp.route("/api/tripsheet/generate", methods=["POST"])
def generate_tripsheet():
    """Generate trip sheet from work_front rows - No database storage, returns success message."""
    cnx = cur = None
    try:
        # Get work_front_ids and pr_order from request body
        request_data = request.get_json() or {}
        work_front_ids = request_data.get('work_front_ids', [])
        pr_order = request_data.get('pr_order', [])  # PR values for ordering
        
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        
        # Generate trip sheet data (no database storage) with filtered work_front_ids and PR ordering
        data = _generate_tripsheet_data(cur, work_front_ids=work_front_ids, pr_order=pr_order)
        
        return jsonify({
            'success': True,
            'message': f'Generated trip sheet with {len(data)} rows (no database storage)'
        })
    except Error as exc:
        print(f"Database error in generate_tripsheet: {str(exc)}")
        return jsonify({'error': str(exc)}), 500
    except Exception as exc:
        print(f"Unexpected error in generate_tripsheet: {str(exc)}")
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
