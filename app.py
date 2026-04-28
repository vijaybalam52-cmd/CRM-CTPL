"""Main Flask application file."""
import os
from datetime import date
from flask import Flask, render_template, url_for, redirect, request, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from config import DB_CONFIG
from database import get_connection
from call_entry import call_entry_bp
from customer_list import customer_list_bp
from workfront import workfront_bp
from tripsheet import tripsheet_bp
from workdone import workdone_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# Configure database settings
app.config.update(DB_CONFIG)

# Register blueprints
app.register_blueprint(call_entry_bp)
app.register_blueprint(customer_list_bp)
app.register_blueprint(workfront_bp)
app.register_blueprint(tripsheet_bp)
app.register_blueprint(workdone_bp)

login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.init_app(app)


@app.before_request
def require_login():
    if request.endpoint in ("login", "login_post", "static"):
        return None
    if request.endpoint is None:
        return None
    if not current_user.is_authenticated:
        return redirect(url_for("login"))


class User(UserMixin):
    def __init__(self, id, username, tag_name, role_id, role_name, email_id, phone_no):
        self.id = str(id)
        self.username = username
        self.tag_name = tag_name
        self.role_id = role_id
        self.role_name = role_name
        self.email_id = email_id
        self.phone_no = phone_no

    @property
    def is_admin(self):
        return (self.role_name or "").lower() == "admin"


def _row_to_user(row):
    if not row:
        return None
    return User(
        id=row["id"],
        username=row.get("username"),
        tag_name=row.get("tag_name"),
        role_id=row.get("role_id"),
        role_name=row.get("role_name"),
        email_id=row.get("email_id"),
        phone_no=row.get("phone_no"),
    )


def _fetch_one(sql, params=()):
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        cur.execute(sql, params)
        row = cur.fetchone()
        return row
    finally:
        if cur:
            cur.close()
        if cnx:
            cnx.close()


def _fetch_all(sql, params=()):
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor(dictionary=True)
        cur.execute(sql, params)
        rows = cur.fetchall() or []
        return rows
    finally:
        if cur:
            cur.close()
        if cnx:
            cnx.close()


def get_user_by_id(user_id):
    sql = """
        SELECT u.id, u.username, u.tag_name, u.role_id, u.email_id, u.phone_no, u.password,
               r.role_name,u.create_date
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.id = %s
    """
    return _fetch_one(sql, (user_id,))


def get_user_by_email(email):
    sql = """
        SELECT u.id, u.username, u.tag_name, u.role_id, u.email_id, u.phone_no, u.password,
               r.role_name,u.create_date
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.email_id = %s
    """
    return _fetch_one(sql, (email,))


def get_user_by_login_identifier(login_id):
    sql = """
        SELECT u.id, u.username, u.tag_name, u.role_id, u.email_id, u.phone_no, u.password,
               r.role_name,u.create_date
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE LOWER(u.email_id) = LOWER(%s)
           OR LOWER(u.username) = LOWER(%s)
           OR u.phone_no = %s
    """
    return _fetch_one(sql, (login_id, login_id, login_id))


def get_all_users():
    sql = """
        SELECT u.id, u.username, u.tag_name, u.role_id, u.email_id, u.phone_no, u.password,
               r.role_name,u.create_date
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        ORDER BY u.id DESC
    """
    return _fetch_all(sql)


def get_all_roles():
    sql = "SELECT id, role_name FROM roles ORDER BY role_name"
    return _fetch_all(sql)


def update_user_password(user_id, new_hash):
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        cur.execute("UPDATE users SET password = %s WHERE id = %s", (new_hash, user_id))
        cnx.commit()
    finally:
        if cur:
            cur.close()
        if cnx:
            cnx.close()


def create_user(username, tag_name, role_id, email_id, phone_no, password):
    password_hash = generate_password_hash(password)
    created = date.today()
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        cur.execute(
            """
            INSERT INTO users (username, tag_name, role_id, email_id, phone_no, password, create_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (username, tag_name, role_id, email_id, phone_no, password_hash, created),
        )
        cnx.commit()
    finally:
        if cur:
            cur.close()
        if cnx:
            cnx.close()


def update_user(user_id, username, tag_name, role_id, email_id, phone_no, password):
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        if password:
            password_hash = generate_password_hash(password)
            cur.execute(
                """
                UPDATE users
                SET username = %s,
                    tag_name = %s,
                    role_id = %s,
                    email_id = %s,
                    phone_no = %s,
                    password = %s
                WHERE id = %s
                """,
                (username, tag_name, role_id, email_id, phone_no, password_hash, user_id),
            )
        else:
            cur.execute(
                """
                UPDATE users
                SET username = %s,
                    tag_name = %s,
                    role_id = %s,
                    email_id = %s,
                    phone_no = %s
                WHERE id = %s
                """,
                (username, tag_name, role_id, email_id, phone_no, user_id),
            )
        cnx.commit()
    finally:
        if cur:
            cur.close()
        if cnx:
            cnx.close()


def delete_user(user_id):
    cnx = cur = None
    try:
        cnx = get_connection(DB_CONFIG)
        cur = cnx.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        cnx.commit()
    finally:
        if cur:
            cur.close()
        if cnx:
            cnx.close()


@login_manager.user_loader
def load_user(user_id):
    row = get_user_by_id(user_id)
    return _row_to_user(row)


def _redirect_after_login(user_obj):
    if user_obj and user_obj.is_admin:
        return redirect(url_for("admin_panel"))
    return redirect(url_for("user_profile"))


@app.route("/login")
def login():
    if current_user.is_authenticated:
        return _redirect_after_login(current_user)
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_post():
    login_id = (request.form.get("login_id") or request.form.get("email") or "").strip()
    password = request.form.get("password") or ""
    if not login_id or not password:
        flash("Please enter your email, username, or phone number and password.", "error")
        return redirect(url_for("login"))

    row = get_user_by_login_identifier(login_id)
    if not row:
        flash("Invalid credentials.", "error")
        return redirect(url_for("login"))

    stored_password = row.get("password") or ""
    password_ok = False
    needs_rehash = False
    try:
        password_ok = check_password_hash(stored_password, password)
    except ValueError:
        password_ok = False

    if not password_ok and stored_password == password:
        password_ok = True
        needs_rehash = True

    if not password_ok:
        flash("Invalid credentials.", "error")
        return redirect(url_for("login"))

    if needs_rehash:
        update_user_password(row["id"], generate_password_hash(password))

    user_obj = _row_to_user(row)
    login_user(user_obj)
    return _redirect_after_login(user_obj)


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("login"))


def _admin_required():
    if not current_user.is_authenticated:
        return redirect(url_for("login"))
    if not current_user.is_admin:
        return redirect(url_for("user_profile"))
    return None


@app.route("/admin-panel")
@login_required
def admin_panel():
    redirect_resp = _admin_required()
    if redirect_resp:
        return redirect_resp

    users = get_all_users()
    roles = get_all_roles()

    total_users = len(users)
    admin_count = sum(1 for u in users if (u.get("role_name") or "").lower() == "admin")
    regular_count = max(total_users - admin_count, 0)
    active_today = total_users

    return render_template(
        "admin_panel.html",
        users=users,
        roles=roles,
        stats={
            "total_users": total_users,
            "admin_count": admin_count,
            "regular_count": regular_count,
            "active_today": active_today,
        },
    )


@app.route("/admin/register", methods=["GET", "POST"])
@login_required
def admin_register():
    redirect_resp = _admin_required()
    if redirect_resp:
        return redirect_resp

    roles = get_all_roles()
    if request.method == "GET":
        return render_template("admin_register.html", roles=roles)

    username = (request.form.get("username") or "").strip()
    tag_name = (request.form.get("tag_name") or "").strip()
    email_id = (request.form.get("email_id") or "").strip().lower()
    phone_no = (request.form.get("phone_no") or "").strip()
    role_id = request.form.get("role_id")
    password = request.form.get("password") or ""
    confirm_password = request.form.get("confirm_password") or ""

    if not all([username, tag_name, email_id, phone_no, role_id, password, confirm_password]):
        flash("Please fill in all required fields.", "error")
        return render_template("admin_register.html", roles=roles)

    if password != confirm_password:
        flash("Password and Confirm Password must match.", "error")
        return render_template("admin_register.html", roles=roles)

    existing = get_user_by_email(email_id)
    if existing:
        flash("A user with this email already exists.", "error")
        return render_template("admin_register.html", roles=roles)

    try:
        create_user(username, tag_name, int(role_id), email_id, phone_no, password)
    except Exception:
        flash("Unable to create user. Please try again.", "error")
        return render_template("admin_register.html", roles=roles)

    flash("User created successfully.", "success")
    return redirect(url_for("admin_panel"))


@app.route("/admin/users/<int:user_id>/edit", methods=["GET", "POST"])
@login_required
def admin_edit_user(user_id):
    redirect_resp = _admin_required()
    if redirect_resp:
        return redirect_resp

    roles = get_all_roles()
    user_row = get_user_by_id(user_id)
    if not user_row:
        flash("User not found.", "error")
        return redirect(url_for("admin_panel"))

    if request.method == "GET":
        return render_template("admin_edit_user.html", roles=roles, user=user_row)

    username = (request.form.get("username") or "").strip()
    tag_name = (request.form.get("tag_name") or "").strip()
    email_id = (request.form.get("email_id") or "").strip().lower()
    phone_no = (request.form.get("phone_no") or "").strip()
    role_id = request.form.get("role_id")
    password = request.form.get("password") or ""
    confirm_password = request.form.get("confirm_password") or ""

    if not all([username, tag_name, email_id, phone_no, role_id]):
        flash("Please fill in all required fields.", "error")
        return render_template("admin_edit_user.html", roles=roles, user=user_row)

    if password or confirm_password:
        if password != confirm_password:
            flash("Password and Confirm Password must match.", "error")
            return render_template("admin_edit_user.html", roles=roles, user=user_row)

    try:
        update_user(user_id, username, tag_name, int(role_id), email_id, phone_no, password)
    except Exception:
        flash("Unable to update user. Please try again.", "error")
        return render_template("admin_edit_user.html", roles=roles, user=user_row)

    flash("User updated successfully.", "success")
    return redirect(url_for("admin_panel"))


@app.route("/admin/users/<int:user_id>/delete", methods=["POST"])
@login_required
def admin_delete_user(user_id):
    redirect_resp = _admin_required()
    if redirect_resp:
        return redirect_resp

    if str(current_user.id) == str(user_id):
        flash("You cannot delete your own account.", "error")
        return redirect(url_for("admin_panel"))

    try:
        delete_user(user_id)
    except Exception:
        flash("Unable to delete user. Please try again.", "error")
        return redirect(url_for("admin_panel"))

    flash("User deleted successfully.", "success")
    return redirect(url_for("admin_panel"))


@app.route("/user-profile")
@login_required
def user_profile():
    return render_template("user_profile.html")


if __name__ == "__main__":
    #app.run(host="0.0.0.0", port=5000)
    app.run(host="0.0.0.0", port=5000, debug=True)
