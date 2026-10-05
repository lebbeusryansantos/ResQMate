from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from backend.database import engine
from typing import Optional
from backend.security import get_current_user, get_current_admin, get_current_customer, require_role

router = APIRouter()


class CreateRequestData(BaseModel):
    user_id: int
    assistance_type: str
    barangay: str
    city: str
    province: Optional[str] = None # Made optional to handle blank province fields
    region: str
    request_details: str
    priority: str
    calamity_type: str
    specific_address: str


@router.get("/")
def get_requests(user: dict = Depends(require_role(["admin", "staff"]))):
    query = text("""
        SELECT
            ar.*,
            c.category_name,
            l.location_name,
            CONCAT_WS(' ', u.first_name, u.last_name) AS full_name,
            CONCAT_WS(' ', staff.first_name, staff.last_name) AS assigned_staff

        FROM assistance_requests ar

        LEFT JOIN categories c
            ON ar.category_id = c.category_id

        LEFT JOIN locations l
            ON ar.location_id = l.location_id

        LEFT JOIN users u
            ON ar.user_id = u.user_id

        LEFT JOIN distributions d
            ON ar.request_id = d.request_id

        LEFT JOIN users staff
            ON d.staff_id = staff.user_id

        ORDER BY ar.request_id DESC
    """)

    with engine.connect() as conn:
        result = conn.execute(query)

        requests = []

        for row in result:
            requests.append({
                "request_id": row.request_id,
                "user_id": row.user_id,
                "full_name": row.full_name,
                "category_id": row.category_id,
                "category_name": row.category_name,
                "location_id": row.location_id,
                "location_name": row.location_name,
                "request_details": row.request_details,
                "priority_level": row.priority_level,
                "status": row.status,
                "rejection_reason": row.rejection_reason,
                "assigned_staff": row.assigned_staff,
                "calamity_type": row.calamity_type,
                "specific_address": row.specific_address,
                "date_requested": str(row.date_requested)
            })

        return requests


@router.get("/{request_id}")
def get_request(request_id: int, user: dict = Depends(get_current_user)):
    query = text("""
        SELECT
            ar.*,
            c.category_name,
            l.location_name,
            l.barangay,
            l.city,
            l.province,
            l.region

        FROM assistance_requests ar

        LEFT JOIN categories c
            ON ar.category_id = c.category_id

        LEFT JOIN locations l
            ON ar.location_id = l.location_id

        WHERE ar.request_id = :request_id
    """)

    with engine.connect() as conn:
        result = conn.execute(
            query,
            {"request_id": request_id}
        )

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Request Not Found"
            )

        return {
            "request_id": row.request_id,
            "user_id": row.user_id,
            "category_id": row.category_id,
            "category_name": row.category_name,
            "location_id": row.location_id,
            "location_name": row.location_name,
            "barangay": row.barangay,
            "city": row.city,
            "province": row.province,
            "region": row.region,
            "request_details": row.request_details,
            "priority_level": row.priority_level,
            "status": row.status,
            "rejection_reason": row.rejection_reason,
            "calamity_type": row.calamity_type,
            "specific_address": row.specific_address,
            "date_requested": str(row.date_requested)
        }


@router.post("/create")
def create_request(data: CreateRequestData, customer: dict = Depends(get_current_customer)):
    assistance_type = data.assistance_type.strip()
    barangay = data.barangay.strip()
    city = data.city.strip()
    
    # Handle missing/blank province (e.g. for NCR / Metro Manila requests)
    province = data.province.strip() if data.province else "Metro Manila"
    if not province:
        province = "Metro Manila"

    region = data.region.strip()

    location = f"{barangay}, {city}, {province}, {region}"
    request_details = data.request_details.strip()
    priority = data.priority.strip()

    category_mapping = {
        "Food": "Food",
        "Water": "Water",
        "Shelter": "Shelter",
        "Medicine": "Medicine",
        "Other": "Other"
    }

    priority_mapping = {
        "Low": "low",
        "Medium": "medium",
        "High": "high"
    }

    if assistance_type not in category_mapping:
        raise HTTPException(
            status_code=400,
            detail="Invalid assistance type."
        )

    if priority not in priority_mapping:
        raise HTTPException(
            status_code=400,
            detail="Invalid priority level."
        )

    if not location:
        raise HTTPException(
            status_code=400,
            detail="Location is required."
        )

    if not request_details:
        raise HTTPException(
            status_code=400,
            detail="Request details are required."
        )

    category_name = category_mapping[assistance_type]
    database_priority = priority_mapping[priority]

    with engine.begin() as conn:
        user_result = conn.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": data.user_id}
        ).fetchone()

        if not user_result:
            raise HTTPException(
                status_code=404,
                detail="User Not Found."
            )

        category_result = conn.execute(
            text("""
                SELECT category_id
                FROM categories
                WHERE LOWER(category_name) = LOWER(:category_name)
                LIMIT 1
            """),
            {"category_name": category_name}
        ).fetchone()

        if not category_result:
            conn.execute(
                text("""
                    INSERT INTO categories
                    (
                        category_name,
                        description
                    )
                    VALUES
                    (
                        :category_name,
                        :description
                    )
                """),
                {
                    "category_name": category_name,
                    "description": f"{category_name} assistance"
                }
            )

            category_result = conn.execute(
                text("""
                    SELECT category_id
                    FROM categories
                    WHERE LOWER(category_name) = LOWER(:category_name)
                    LIMIT 1
                """),
                {"category_name": category_name}
            ).fetchone()

        category_id = category_result.category_id

        location_result = conn.execute(
            text("""
                SELECT location_id
                FROM locations
                WHERE location_name = :location_name
                LIMIT 1
            """),
            {"location_name": location}
        ).fetchone()

        if not location_result:
            conn.execute(
                text("""
                    INSERT INTO locations
                    (
                        location_name,
                        barangay,
                        city,
                        province,
                        region
                    )
                    VALUES
                    (
                        :location_name,
                        :barangay,
                        :city,
                        :province,
                        :region
                    )
                """),
                {
                    "location_name": location,
                    "barangay": barangay,
                    "city": city,
                    "province": province,
                    "region": region
                }
            )

            location_result = conn.execute(
                text("""
                    SELECT location_id
                    FROM locations
                    WHERE location_name = :location_name
                    LIMIT 1
                """),
                {"location_name": location}
            ).fetchone()

        location_id = location_result.location_id

        result = conn.execute(
            text("""
                INSERT INTO assistance_requests
                (
                    user_id,
                    category_id,
                    location_id,
                    request_details,
                    priority_level,
                    status,
                    calamity_type,
                    specific_address
                )
                VALUES
                (
                    :user_id,
                    :category_id,
                    :location_id,
                    :request_details,
                    :priority_level,
                    'pending',
                    :calamity_type,
                    :specific_address
                )
            """),
            {
                "user_id": data.user_id,
                "category_id": category_id,
                "location_id": location_id,
                "request_details": request_details,
                "priority_level": database_priority,
                "calamity_type": data.calamity_type.strip(),
                "specific_address": data.specific_address.strip()
            }
        )

        request_id = result.lastrowid

    return {
        "message": "Request Created Successfully",
        "request_id": request_id,
        "user_id": data.user_id,
        "category": category_name,
        "location": location,
        "priority": priority,
        "status": "pending"
    }


@router.put("/{request_id}/status")
def update_request_status(request_id: int, status: str, updated_by: int, rejection_reason: str = None, admin: dict = Depends(get_current_admin)):
    with engine.begin() as conn:
        user_result = conn.execute(
            text("""
                SELECT user_id, status
                FROM assistance_requests
                WHERE request_id = :request_id
            """),
            {"request_id": request_id}
        ).fetchone()

        if not user_result:
            raise HTTPException(
                status_code=404,
                detail="Request Not Found"
            )

        if user_result.status.lower() == 'completed':
            raise HTTPException(status_code=403, detail="Forbidden: Completed requests are read-only")

        user_id = user_result.user_id

        conn.execute(
            text("""
                UPDATE assistance_requests
                SET status = :status,
                    rejection_reason = :rejection_reason
                WHERE request_id = :request_id
            """),
            {
                "status": status,
                "rejection_reason": rejection_reason,
                "request_id": request_id
            }
        )

        conn.execute(
            text("""
                INSERT INTO request_status_history
                (
                    request_id,
                    updated_by,
                    status,
                    remarks
                )
                VALUES
                (
                    :request_id,
                    :updated_by,
                    :status,
                    :remarks
                )
            """),
            {
                "request_id": request_id,
                "updated_by": updated_by,
                "status": status,
                "remarks": f"Status changed to {status}"
            }
        )

        conn.execute(
            text("""
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    message
                )
                VALUES
                (
                    :user_id,
                    :title,
                    :message
                )
            """),
            {
                "user_id": user_id,
                "title": "Request Update",
                "message": f"Your request status is now {status}"
            }
        )

    return {
        "message": "Request Updated Successfully"
    }


@router.get("/user/{user_id}")
def get_user_requests(user_id: int, user: dict = Depends(get_current_user)):
    if user["role"] == "community_user" and user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot view other users' requests")
        
    query = text("""
        SELECT
            ar.request_id,
            ar.user_id,
            ar.category_id,
            ar.location_id,
            ar.request_details,
            ar.priority_level,
            ar.status,
            ar.rejection_reason,
            ar.date_requested,
            c.category_name,
            l.location_name,
            CONCAT_WS(' ', u.first_name, u.last_name) AS full_name
        FROM assistance_requests ar
        LEFT JOIN categories c
            ON ar.category_id = c.category_id
        LEFT JOIN locations l
            ON ar.location_id = l.location_id
        LEFT JOIN users u
            ON ar.user_id = u.user_id
        WHERE ar.user_id = :user_id
        ORDER BY ar.request_id DESC
    """)

    with engine.connect() as conn:
        result = conn.execute(
            query,
            {"user_id": user_id}
        )

        requests = []

        for row in result:
            requests.append({
                "request_id": row.request_id,
                "user_id": row.user_id,
                "full_name": row.full_name,
                "category_id": row.category_id,
                "category_name": row.category_name,
                "location": row.location_name,
                "request_details": row.request_details,
                "priority_level": row.priority_level,
                "status": row.status,
                "rejection_reason": row.rejection_reason,
                "date_requested": str(row.date_requested)
            })

        return requests


@router.put("/{request_id}/cancel")
def cancel_request(request_id: int, reason: str = None, user: dict = Depends(get_current_user)):
    with engine.begin() as conn:
        req_result = conn.execute(
            text("SELECT user_id, status FROM assistance_requests WHERE request_id = :request_id"),
            {"request_id": request_id}
        ).fetchone()

        if not req_result:
            raise HTTPException(status_code=404, detail="Request Not Found")

        if req_result.user_id != user["user_id"] and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Forbidden: You can only cancel your own requests")

        if req_result.status.lower() != "pending":
            raise HTTPException(status_code=400, detail="Only pending requests can be cancelled")

        conn.execute(
            text("""
                UPDATE assistance_requests
                SET status = 'cancelled',
                    rejection_reason = :reason
                WHERE request_id = :request_id
            """),
            {"reason": reason, "request_id": request_id}
        )

        conn.execute(
            text("""
                INSERT INTO request_status_history (request_id, updated_by, status, remarks)
                VALUES (:request_id, :updated_by, 'cancelled', :remarks)
            """),
            {
                "request_id": request_id,
                "updated_by": user["user_id"],
                "remarks": f"Cancelled by user: {reason}"
            }
        )
        
    return {"message": "Request cancelled successfully"}


@router.delete("/{request_id}")
def delete_request(request_id: int, admin: dict = Depends(get_current_admin)):
    with engine.begin() as conn:
        req_result = conn.execute(
            text("SELECT request_id, status FROM assistance_requests WHERE request_id = :request_id"),
            {"request_id": request_id}
        ).fetchone()

        if not req_result:
            raise HTTPException(status_code=404, detail="Request Not Found")

        if req_result.status and req_result.status.lower() in ["pending", "processing", "under_review", "awaiting_verification"]:
            raise HTTPException(status_code=403, detail="Forbidden: You must reject or complete the request before deleting it.")

        # Manual cleanup of related records to avoid FK constraints
        conn.execute(
            text("DELETE FROM distributions WHERE request_id = :request_id"),
            {"request_id": request_id}
        )
        conn.execute(
            text("DELETE FROM request_status_history WHERE request_id = :request_id"),
            {"request_id": request_id}
        )
        conn.execute(
            text("DELETE FROM assistance_requests WHERE request_id = :request_id"),
            {"request_id": request_id}
        )

    return {"message": "Request permanently deleted"}