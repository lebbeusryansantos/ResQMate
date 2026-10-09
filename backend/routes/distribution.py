from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from backend.database import engine
from backend.security import require_role, get_current_admin, get_current_staff

router = APIRouter()


# GET ALL DISTRIBUTIONS
@router.get("/")
def get_distributions(user: dict = Depends(require_role(["admin", "staff"]))):

    query = text("""
        SELECT
            d.distribution_id,
            d.request_id,
            d.resource_id,
            r.resource_name,
            d.staff_id,
            CONCAT_WS(' ', u.first_name, u.last_name) AS staff_name,
            d.quantity_given,
            d.distribution_date,
            ar.status AS request_status

        FROM distributions d

        LEFT JOIN resources r
            ON d.resource_id = r.resource_id

        LEFT JOIN users u
            ON d.staff_id = u.user_id

        LEFT JOIN assistance_requests ar
            ON d.request_id = ar.request_id

        ORDER BY d.distribution_id DESC
    """)

    with engine.connect() as conn:

        result = conn.execute(query)

        distributions = []
        for row in result:
            distributions.append({
                "distribution_id": row.distribution_id,
                "request_id": row.request_id,
                "resource_id": row.resource_id,
                "resource_name": row.resource_name,
                "staff_id": row.staff_id,
                "staff_name": row.staff_name,
                "quantity_given": row.quantity_given,
                "distribution_date": str(row.distribution_date) if row.distribution_date else None,
                "request_status": row.request_status
            })

        return distributions


# CREATE DISTRIBUTION
@router.post("/create")
def create_distribution(request_id:     int, resource_id:    int, staff_id:       int, quantity_given: int, admin: dict = Depends(get_current_admin)):

    if quantity_given <= 0:
        raise HTTPException(status_code=400, detail="Quantity given must be greater than 0")

    with engine.begin() as conn:

        # Validate resource exists and has enough stock
        resource = conn.execute(
            text("SELECT resource_id, quantity_available FROM resources WHERE resource_id = :rid"),
            {"rid": resource_id}
        ).fetchone()

        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        if resource.quantity_available < quantity_given:
            raise HTTPException(status_code=400, detail="Insufficient resource quantity")

        # Insert distribution
        conn.execute(
            text("""
                INSERT INTO distributions (request_id, resource_id, staff_id, quantity_given)
                VALUES (:request_id, :resource_id, :staff_id, :quantity_given)
            """),
            {
                "request_id":     request_id,
                "resource_id":    resource_id,
                "staff_id":       staff_id,
                "quantity_given": quantity_given
            }
        )

        # Deduct from resource stock atomically
        res = conn.execute(
            text("UPDATE resources SET quantity_available = quantity_available - :qty WHERE resource_id = :rid AND quantity_available >= :qty"),
            {"qty": quantity_given, "rid": resource_id}
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=400, detail="Insufficient resource quantity due to concurrent update.")

        # Move request to "processing"
        conn.execute(
            text("UPDATE assistance_requests SET status = 'processing' WHERE request_id = :rid"),
            {"rid": request_id}
        )

        # Notify the customer
        requester = conn.execute(
            text("SELECT user_id FROM assistance_requests WHERE request_id = :rid"),
            {"rid": request_id}
        ).fetchone()

        if requester:
            conn.execute(
                text("""
                    INSERT INTO notifications (user_id, title, message)
                    VALUES (:uid, 'Request Processing', 'Your request is now being processed and resources have been assigned.')
                """),
                {"uid": requester.user_id}
            )

    return {"message": "Distribution created successfully"}


# UPDATE DISTRIBUTION
@router.put("/{distribution_id}")
def update_distribution(distribution_id: int, request_id:      int, resource_id:     int, staff_id:        int, quantity_given:  int, admin: dict = Depends(get_current_admin)):

    with engine.begin() as conn:

        # Get the old quantity to adjust stock
        old = conn.execute(
            text("SELECT resource_id, quantity_given FROM distributions WHERE distribution_id = :did"),
            {"did": distribution_id}
        ).fetchone()

        if not old:
            raise HTTPException(status_code=404, detail="Distribution not found")

        # Restore old stock
        conn.execute(
            text("UPDATE resources SET quantity_available = quantity_available + :qty WHERE resource_id = :rid"),
            {"qty": old.quantity_given, "rid": old.resource_id}
        )

        # Check new stock
        resource = conn.execute(
            text("SELECT quantity_available FROM resources WHERE resource_id = :rid"),
            {"rid": resource_id}
        ).fetchone()

        if not resource or resource.quantity_available < quantity_given:
            raise HTTPException(status_code=400, detail="Insufficient resource quantity for update")

        # Deduct new quantity
        conn.execute(
            text("UPDATE resources SET quantity_available = quantity_available - :qty WHERE resource_id = :rid"),
            {"qty": quantity_given, "rid": resource_id}
        )

        # Update distribution record
        conn.execute(
            text("""
                UPDATE distributions
                SET request_id = :request_id, resource_id = :resource_id,
                    staff_id = :staff_id, quantity_given = :quantity_given
                WHERE distribution_id = :did
            """),
            {
                "did":            distribution_id,
                "request_id":     request_id,
                "resource_id":    resource_id,
                "staff_id":       staff_id,
                "quantity_given": quantity_given
            }
        )

    return {"message": "Distribution updated successfully"}


# DELETE DISTRIBUTION
@router.delete("/{distribution_id}")
def delete_distribution(distribution_id: int, admin: dict = Depends(get_current_admin)):

    with engine.begin() as conn:

        distribution = conn.execute(
            text("SELECT distribution_id, resource_id, quantity_given FROM distributions WHERE distribution_id = :did"),
            {"did": distribution_id}
        ).fetchone()

        if not distribution:
            raise HTTPException(status_code=404, detail="Distribution not found")

        # Restore stock
        conn.execute(
            text("UPDATE resources SET quantity_available = quantity_available + :qty WHERE resource_id = :rid"),
            {"qty": distribution.quantity_given, "rid": distribution.resource_id}
        )

        # Delete
        conn.execute(
            text("DELETE FROM distributions WHERE distribution_id = :did"),
            {"did": distribution_id}
        )

    return {"message": "Distribution deleted successfully", "quantity_restored": distribution.quantity_given}
