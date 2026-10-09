from backend.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    # First, let's see constraints on audit_logs
    res = conn.execute(text("""
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'audit_logs';
    """)).fetchall()
    print('Constraints before:', res)

    try:
        conn.execute(text('ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;'))
        print('Dropped fk')
    except Exception as e:
        print('Could not drop fk:', e)
        
    try:
        conn.execute(text('ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;'))
        print('Made nullable')
    except Exception as e:
        print('Could not alter nullability:', e)
        
    try:
        conn.execute(text('ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;'))
        print('Added new fk')
    except Exception as e:
        print('Could not add new fk:', e)

    res = conn.execute(text("""
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'audit_logs';
    """)).fetchall()
    print('Constraints after:', res)
