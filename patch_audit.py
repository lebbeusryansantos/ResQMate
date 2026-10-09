import re

def inject_log(filepath, search_str, inject_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if inject_str in content:
        print(f'{filepath}: Already injected')
        return
    if search_str in content:
        # replace the first occurrence
        content = content.replace(search_str, inject_str + '\n' + search_str, 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Injected in {filepath}: {inject_str.strip()}')
    else:
        print(f'{filepath}: search string not found -> {search_str}')

# 1. request.py
# create_request returns { "message": "Request created successfully", ... }
inject_log('backend/routes/request.py', 
    '        return {\n            "message": "Request created successfully"', 
    '        from backend.audit import log_audit\n        log_audit(customer, f"Customer {customer.get(\'full_name\', \'\')} submitted Assistance Request #{request_id}")')

# update_request_status returns { "message": "Request status updated successfully", ... }
inject_log('backend/routes/request.py',
    '        return {\n            "message": "Request status updated successfully"',
    '        from backend.audit import log_audit\n        log_audit(admin, f"Admin {admin.get(\'full_name\', \'\')} changed status of Request #{request_id} to {status}")')

# cancel_request returns {"message": "Request cancelled successfully"}
inject_log('backend/routes/request.py',
    '        return {"message": "Request cancelled successfully"}',
    '        from backend.audit import log_audit\n        log_audit(user, f"Customer {user.get(\'full_name\', \'\')} canceled Request #{request_id}")')

# 2. delivery_documentations.py
# submit_documentation returns { "message": "Delivery documentation submitted successfully", ... }
inject_log('backend/routes/delivery_documentations.py',
    '        return {\n            "message": "Delivery documentation submitted successfully"',
    '        from backend.audit import log_audit\n        log_audit(staff, f"Staff {staff.get(\'full_name\', \'\')} uploaded delivery proof for Request #{request_id}")')

# 3. distribution.py
# create_distribution returns {"message": "Distribution created successfully"}
inject_log('backend/routes/distribution.py',
    '        return {"message": "Distribution created successfully"}',
    '        from backend.audit import log_audit\n        log_audit(admin, f"Admin {admin.get(\'full_name\', \'\')} processed distribution for Request #{request_id}")')

# 4. resource.py
# create_resource returns {"message": "Resource added successfully"}
inject_log('backend/routes/resource.py',
    '        return {"message": "Resource added successfully"}',
    '        from backend.audit import log_audit\n        log_audit(admin, f"Admin {admin.get(\'full_name\', \'\')} added {data.quantity} to {data.name}")')

# 5. users.py
# create_user returns { "message": "User created successfully", ... }
inject_log('backend/routes/users.py',
    '        return {\n            "message": "User created successfully"',
    '        from backend.audit import log_audit\n        log_audit(admin, f"Admin {admin.get(\'full_name\', \'\')} created user account {data.email}")')
