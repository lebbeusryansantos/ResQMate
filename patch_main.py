import os

f1 = "backend/main.py"
with open(f1, "r", encoding="utf-8") as f:
    c = f.read()

new_block = """app.include_router(
    delivery_documentations.router
)

app.include_router(
    audit_logs_router,
    prefix="/audit_logs",
    tags=["Audit Logs"]
)"""

if "prefix=\"/audit_logs\"" not in c:
    c = c.replace("""app.include_router(
    delivery_documentations.router
)""", new_block)
    
    with open(f1, "w", encoding="utf-8") as f:
        f.write(c)
        print("Updated main.py")
