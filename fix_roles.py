import os
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

from backend.database import engine

def fix_roles():
    try:
        with engine.begin() as conn:
            # 1. Update admin
            conn.execute(
                text("UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com'")
            )
            print("Updated admin@gmail.com to admin role.")

            # 2. Update masteradmin
            conn.execute(
                text("UPDATE users SET role = 'superadmin' WHERE email = 'masteradmin@gmail.com'")
            )
            print("Updated masteradmin@gmail.com to superadmin role.")
            
            # 3. Check what was updated
            result = conn.execute(
                text("SELECT email, role FROM users WHERE email IN ('admin@gmail.com', 'masteradmin@gmail.com', 'superadmin@gmail.com')")
            ).fetchall()
            for row in result:
                print(row)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_roles()
