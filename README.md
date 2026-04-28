# Call Entry System

A web-based application for managing service calls, work fronts, trip sheets, and work tracking. This system helps streamline the workflow from initial call entry to work completion.

## Features

- **Call Entry**: Create and manage service tickets with company, machine, and contact information
- **Work Front**: Track pending work items and their status
- **Trip Sheet**: Generate trip sheets for field service visits
- **Work Done**: Record completed work with details like done date, done by, and spares used

## Requirements

- Python 3.7 or higher
- MySQL database server
- Internet connection (for initial package installation)

## Installation

1. Clone or download this repository to your local machine

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up your MySQL database:
   - Create a database named `call_entryv3` (or update the name in `config.py`)
   - Make sure your MySQL server is running

4. Update database configuration in `config.py`:
   ```python
   DB_CONFIG = {
       "DB_HOST": "localhost",
       "DB_USER": "your_username",
       "DB_PASSWORD": "your_password",
       "DB_NAME": "call_entryv3",
   }
   ```

## Running the Application

To start the application, run:

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Project Structure

```
Call_Entry/
├── app.py                 # Main Flask application
├── config.py              # Database configuration
├── database.py            # Database connection utilities
├── call_entry.py          # Call entry routes and logic
├── workfront.py           # Work front routes and logic
├── tripsheet.py           # Trip sheet routes and logic
├── workdone.py            # Work done routes and logic
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates
│   ├── base.html
│   ├── call_entry.html
│   ├── login.html
│   ├── tripsheet.html
│   ├── workdone.html
│   └── workfront.html
└── static/                # Static files (CSS, JS, images)
    ├── css/
    ├── js/
    └── images/
```

## Usage

1. **Login**: Access the login page at `/login`

2. **Call Entry**: Navigate to `/` or `/call-entry` to create new service tickets

3. **Work Front**: Go to `/workfront` to view and manage pending work items

4. **Trip Sheet**: Visit `/tripsheet` to generate trip sheets for field visits

5. **Work Done**: Access `/workdone` to record completed work

## Notes

- Make sure your MySQL database has all the required tables set up before running the application
- The application uses Flask's debug mode by default - remember to disable it in production
- Database connections are managed automatically, but ensure your MySQL server is accessible

## Troubleshooting

If you encounter database connection errors:
- Verify MySQL server is running
- Check database credentials in `config.py`
- Ensure the database exists and is accessible
- Check firewall settings if connecting to a remote database

For other issues, check the console output for error messages.
