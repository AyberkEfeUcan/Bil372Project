from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

TABLES_MAPPING = {
    "city": "CityID",
    "powersource": "PowerSourceID",  
    "cityenergyusage": "UsageID", 
    "energyproject": "ProjectID",
    "environmentaldata": "DataID",
    "supplier": "SupplierID",
    "maintenancerecord": "MaintenanceID",
    "citygoal": "GoalID",
    "powersourceperformance": "PerformanceID",
}

VALID_TABLES = [
    "city", "powersource", "cityenergyusage", "energyproject",
    "environmentaldata", "supplier", "maintenancerecord", "citygoal", "powersourceperformance"
]

# MySQL connection configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'ayberk',
    'database': 'project'
}

# Function to build filter query
def build_filter_query(filters):
    filter_conditions = []
    for attribute, filter in filters.items():
        if filter['value'] and filter['operator']:
            value = filter['value']
            operator = filter['operator']
            if operator == 'gt':
                filter_conditions.append(f"{attribute} > '{value}'")
            elif operator == 'lt':
                filter_conditions.append(f"{attribute} < '{value}'")
            elif operator == 'eq':
                filter_conditions.append(f"{attribute} = '{value}'")
            elif operator == 'gte':
                filter_conditions.append(f"{attribute} >= '{value}'")
            elif operator == 'lte':
                filter_conditions.append(f"{attribute} <= '{value}'")
    return " AND ".join(filter_conditions) if filter_conditions else None

def get_table_data(table_name, sort_key=None, sort_direction=None, filters=None, related_tables=None):
    if table_name not in VALID_TABLES:
        return {"error": "Invalid table name"}, 400
    
    connection = pymysql.connect(**MYSQL_CONFIG)
    cursor = connection.cursor()

    try:
        # Base query for the main table
        query = f"SELECT * FROM {table_name}"
        filter_query = build_filter_query(filters)
        if filter_query:
            query += " WHERE " + filter_query
        if sort_key and sort_direction:
            query += f" ORDER BY {sort_key} {sort_direction}"

        # Execute query for the main table
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        if not rows:
            return {"message": "No data found in the table"}, 404

        result = [dict(zip(columns, row)) for row in rows]
        primary_key = TABLES_MAPPING.get(table_name)

        # Initialize related data collection
        related_data = []

        # Check if filters contain a valid value for row selection
        if filters and 'filter' in filters and filters['filter']['value']:
            row_index = int(filters['filter']['value']) - 1  # Adjusting index for zero-based indexing
            if 0 <= row_index < len(result):
                row = result[row_index]
                main_table_id = row.get(primary_key)

                # Load each related table one by one as per the combination of tables
                for related_table in related_tables:
                    foreign_key_column = None
                    reverse_foreign_key_column = None

                    # Define the foreign key relationships (both ways)
                    if table_name == "city" and related_table == "cityenergyusage":
                        foreign_key_column = "CityID"
                    elif table_name == "cityenergyusage" and related_table == "city":
                        reverse_foreign_key_column = "CityID"
                    
                    elif table_name == "city" and related_table == "supplier":
                        foreign_key_column = "CityID"
                    elif table_name == "supplier" and related_table == "city":
                        reverse_foreign_key_column = "CityID"
                    
                    elif table_name == "city" and related_table == "maintenancerecord":
                        foreign_key_column = "CityID"
                    elif table_name == "maintenancerecord" and related_table == "city":
                        reverse_foreign_key_column = "CityID"
                    
                    elif table_name == "city" and related_table == "citygoal":
                        foreign_key_column = "CityID"
                    elif table_name == "citygoal" and related_table == "city":
                        reverse_foreign_key_column = "CityID"
                    
                    elif table_name == "powersource" and related_table == "powersourceperformance":
                        foreign_key_column = "PowerSourceID"
                    elif table_name == "powersourceperformance" and related_table == "powersource":
                        reverse_foreign_key_column = "PowerSourceID"
                    
                    # energyproject and environmentaldata handling
                    elif table_name == "city" and related_table == "energyproject":
                        foreign_key_column = "CityID"
                    elif table_name == "energyproject" and related_table == "city":
                        reverse_foreign_key_column = "CityID"

                    elif table_name == "city" and related_table == "environmentaldata":
                        foreign_key_column = "CityID"
                    elif table_name == "environmentaldata" and related_table == "city":
                        reverse_foreign_key_column = "CityID"

                    else:
                        continue  # Skip if no valid foreign key direction is found

                    # Perform the join, using either foreign key or reverse foreign key
                    if foreign_key_column:
                        related_query = f"""
                            SELECT * FROM {related_table}
                            LEFT JOIN {table_name} ON {related_table}.{foreign_key_column} = {table_name}.{primary_key}
                            WHERE {table_name}.{primary_key} = %s
                        """
                    elif reverse_foreign_key_column:
                        related_query = f"""
                            SELECT * FROM {related_table}
                            LEFT JOIN {table_name} ON {related_table}.{reverse_foreign_key_column} = {table_name}.{primary_key}
                            WHERE {related_table}.{reverse_foreign_key_column} = %s
                        """
                    else:
                        continue  # Skip if no valid foreign key or reverse foreign key is found

                    cursor.execute(related_query, (main_table_id,))
                    related_columns = [desc[0] for desc in cursor.description]
                    related_rows = cursor.fetchall()

                    if related_rows:
                        related_data.append({
                            'related_table': related_table,
                            'data': [dict(zip(related_columns, r)) for r in related_rows]
                        })
                    else:
                        related_data.append({
                            'related_table': related_table,
                            'data': []  # No related data found, return empty list
                        })

        return {"data": result, "related_tables": related_data}

    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        connection.close()


# Route to fetch table data
@app.route('/table/<table_name>', methods=['GET'])
def get_table(table_name):
    sort_key = request.args.get('sort_key')
    sort_direction = request.args.get('sort_direction')
    
    # Collect filter parameters
    filters = {}
    for param in request.args:
        if '_value' in param and request.args.get(param):
            attribute = param.split('_')[0]
            filters[attribute] = {
                'value': request.args.get(param),
                'operator': request.args.get(f"{attribute}_operator")
            }

    related_tables = request.args.get('related_tables')
    related_tables = related_tables.split(',') if related_tables else []

    data = get_table_data(table_name, sort_key, sort_direction, filters, related_tables)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
