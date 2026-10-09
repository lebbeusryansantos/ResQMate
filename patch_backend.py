import os
import re

# 1. Patch request.py
req_path = 'backend/routes/request.py'
with open(req_path, 'r', encoding='utf-8') as f:
    req_content = f.read()

validation_code = """    if len(request_details) < 30:
        raise HTTPException(
            status_code=400,
            detail="Request details must be at least 30 characters."
        )

    if assistance_type not in category_mapping:"""

req_content = req_content.replace('    if assistance_type not in category_mapping:', validation_code)

with open(req_path, 'w', encoding='utf-8') as f:
    f.write(req_content)

# 2. Patch delivery_documentations.py
doc_path = 'backend/routes/delivery_documentations.py'
with open(doc_path, 'r', encoding='utf-8') as f:
    doc_content = f.read()

doc_val = """    if not remarks.strip() or len(remarks.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="Remarks are required and must be at least 30 characters."
        )"""

doc_content = re.sub(
    r'    if not remarks\.strip\(\):\s*raise HTTPException\(\s*status_code=400,\s*detail="Remarks are required\."\s*\)',
    doc_val,
    doc_content
)

size_val = """    file_bytes = await proof_file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 5MB limit."
        )"""

doc_content = doc_content.replace('    file_bytes = await proof_file.read()', size_val)

with open(doc_path, 'w', encoding='utf-8') as f:
    f.write(doc_content)

# 3. Patch distribution.py
dist_path = 'backend/routes/distribution.py'
with open(dist_path, 'r', encoding='utf-8') as f:
    dist_content = f.read()

dist_old = """        # Deduct from resource stock
        conn.execute(
            text("UPDATE resources SET quantity_available = quantity_available - :qty WHERE resource_id = :rid"),
            {"qty": quantity_given, "rid": resource_id}
        )"""

dist_new = """        # Deduct from resource stock atomically
        res = conn.execute(
            text("UPDATE resources SET quantity_available = quantity_available - :qty WHERE resource_id = :rid AND quantity_available >= :qty"),
            {"qty": quantity_given, "rid": resource_id}
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=400, detail="Insufficient resource quantity due to concurrent update.")"""

dist_content = dist_content.replace(dist_old, dist_new)

with open(dist_path, 'w', encoding='utf-8') as f:
    f.write(dist_content)

print("Backend patched successfully")
