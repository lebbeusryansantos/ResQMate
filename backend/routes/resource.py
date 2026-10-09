from backend.audit import log_audit
from fastapi import APIRouter
from fastapi import APIRouter, HTTPException, Depends
from backend.security import get_current_user, get_current_admin, require_role
from sqlalchemy import text
from backend.database import engine

router = APIRouter()


# GET ALL RESOURCES
@router.get("/")
def get_resources(user: dict = Depends(get_current_user)):

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT * FROM resources ORDER BY resource_id DESC")
        )

        resources = []

        for row in result:

            qty = row.quantity_available
            max_stock = row.max_stock

            threshold = max_stock * 0.30

            if qty <= 0:
                status = "Depleted"
            elif qty <= threshold:
                status = "Low Stock"
            else:
                status = "Available"

            resources.append({
                "resource_id": row.resource_id,
                "resource_name": row.resource_name,
                "category": row.category,
                "quantity_available": qty,
                "max_stock": max_stock,
                "unit": row.unit,
                "location": row.location,
                "status": status,
                "last_updated": str(row.last_updated)
            })

        return resources


# CREATE RESOURCE
@router.post("/create")
def create_resource(
    resource_name: str,
    admin: dict = Depends(get_current_admin),
    category: str = "Other",
    quantity_available: int = 0,
    max_stock: int = 100,
    unit: str = "units",
    location: str = ""
):

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO resources
                (
                    resource_name,
                    category,
                    quantity_available,
                    max_stock,
                    unit,
                    location
                )
                VALUES
                (
                    :resource_name,
                    :category,
                    :quantity_available,
                    :max_stock,
                    :unit,
                    :location
                )
            """),
            {
                "resource_name":      resource_name,
                "category":           category,
                "quantity_available": quantity_available,
                "max_stock":          max_stock,
                "unit":               unit,
                "location":           location
            }
        )

    from backend.audit import log_audit
    log_audit(admin, f"Admin {admin.get('full_name', '')} added {quantity_available} to {resource_name}")

    return {"message": "Resource added successfully"}


# UPDATE RESOURCE
@router.put("/{resource_id}")
def update_resource(
    resource_id: int,
    resource_name: str,
    category: str,
    quantity_available: int,
    max_stock: int,
    unit: str,
    location: str = "",
    admin: dict = Depends(get_current_admin)
):
    with engine.begin() as conn:

        result = conn.execute(
            text("""
                UPDATE resources
                SET
                    resource_name      = :resource_name,
                    category           = :category,
                    quantity_available = :quantity_available,
                    max_stock          = :max_stock,
                    unit               = :unit,
                    location           = :location
                WHERE resource_id = :resource_id
            """),
            {
                "resource_id":        resource_id,
                "resource_name":      resource_name,
                "category":           category,
                "quantity_available": quantity_available,
                "max_stock":          max_stock,
                "unit":               unit,
                "location":           location
            }
        )

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Resource not found")

    log_audit(admin, f"Edited inventory resource ID #{resource_id}")
    return {"message": "Resource updated successfully"}


# DELETE RESOURCE
@router.delete("/{resource_id}")
def delete_resource(resource_id: int, admin: dict = Depends(get_current_admin)):

    with engine.begin() as conn:

        result = conn.execute(
            text("DELETE FROM resources WHERE resource_id = :resource_id"),
            {"resource_id": resource_id}
        )

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Resource not found")

    return {"message": "Resource deleted successfully"}
