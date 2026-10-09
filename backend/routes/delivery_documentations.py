from backend.audit import log_audit
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from sqlalchemy import text
from backend.database import engine
from backend.security import require_role

import cloudinary
import cloudinary.uploader
import os


cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter(
    prefix="/delivery-documentations",
    tags=["Delivery Documentation"]
)


# ============================================================
# STAFF SUBMIT DOCUMENTATION
# ============================================================
@router.post("/submit")
async def submit_documentation(
    request_id: int = Form(...),
    remarks: str = Form(...),
    proof_file: UploadFile = File(...),
    staff: dict = Depends(require_role(["staff"]))
):

    if not remarks.strip() or len(remarks.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="Remarks are required and must be at least 30 characters."
        )

    allowed_types = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ]

    if proof_file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and PDF files are allowed."
        )

    file_bytes = await proof_file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 5MB limit."
        )

    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Maximum file size is 5MB."
        )

    with engine.begin() as conn:

        request_result = conn.execute(
            text("""
                SELECT request_id, status
                FROM assistance_requests
                WHERE request_id = :request_id
            """),
            {
                "request_id": request_id
            }
        ).fetchone()

        if not request_result:
            raise HTTPException(
                status_code=404,
                detail="Request not found."
            )

        distribution_result = conn.execute(
            text("""
                SELECT distribution_id
                FROM distributions
                WHERE request_id = :request_id
                AND staff_id = :staff_id
            """),
            {
                "request_id": request_id,
                "staff_id": staff["user_id"]
            }
        ).fetchone()

        if not distribution_result:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this request."
            )

        existing = conn.execute(
            text("""
                SELECT documentation_id
                FROM delivery_documentations
                WHERE request_id = :request_id
            """),
            {
                "request_id": request_id
            }
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Documentation already submitted."
            )

        try:

            upload_result = cloudinary.uploader.upload(
                file_bytes,
                folder="resqmate/delivery-proofs",
                resource_type="auto"
            )

            file_url = upload_result["secure_url"]

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Cloudinary upload failed: {str(e)}"
            )

        conn.execute(
            text("""
                INSERT INTO delivery_documentations
                (
                    request_id,
                    staff_id,
                    remarks,
                    file_path,
                    status
                )
                VALUES
                (
                    :request_id,
                    :staff_id,
                    :remarks,
                    :file_path,
                    'pending_review'
                )
            """),
            {
                "request_id": request_id,
                "staff_id": staff["user_id"],
                "remarks": remarks,
                "file_path": file_url
            }
        )

        conn.execute(
            text("""
                UPDATE assistance_requests
                SET status = 'awaiting_verification'
                WHERE request_id = :request_id
            """),
            {
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
                    'awaiting_verification',
                    'Delivery documentation submitted by staff'
                )
            """),
            {
                "request_id": request_id,
                "updated_by": staff["user_id"]
            }
        )

    from backend.audit import log_audit
    log_audit(staff, f"Staff {staff.get('full_name', '')} uploaded delivery proof for Request #{request_id}")

    return {
        "message": "Documentation submitted successfully.",
        "request_id": request_id,
        "file_url": file_url
    }


# ============================================================
# ADMIN VIEW DOCUMENTATIONS
# ============================================================
@router.get("/")
def get_documentations(
    admin: dict = Depends(require_role(["admin"]))
):

    query = text("""
        SELECT
            dd.documentation_id,
            dd.request_id,
            dd.staff_id,
            dd.remarks,
            dd.file_path,
            dd.status,
            dd.submitted_at,

            CONCAT_WS(
                ' ',
                u.first_name,
                u.last_name
            ) AS staff_name

        FROM delivery_documentations dd

        LEFT JOIN users u
            ON dd.staff_id = u.user_id

        ORDER BY dd.documentation_id DESC
    """)

    with engine.connect() as conn:

        result = conn.execute(query)

        data = []

        for row in result:
            data.append({
                "documentation_id": row.documentation_id,
                "request_id": row.request_id,
                "staff_id": row.staff_id,
                "staff_name": row.staff_name,
                "remarks": row.remarks,
                "file_path": row.file_path,
                "status": row.status,
                "submitted_at": str(row.submitted_at)
            })

        return data


# ============================================================
# ADMIN APPROVE
# ============================================================
@router.put("/{documentation_id}/approve")
def approve_documentation(
    documentation_id: int,
    admin: dict = Depends(require_role(["admin"]))
):

    with engine.begin() as conn:

        documentation = conn.execute(
            text("""
                SELECT
                    documentation_id,
                    request_id
                FROM delivery_documentations
                WHERE documentation_id = :documentation_id
            """),
            {
                "documentation_id": documentation_id
            }
        ).fetchone()

        if not documentation:
            raise HTTPException(
                status_code=404,
                detail="Documentation not found."
            )

        conn.execute(
            text("""
                UPDATE delivery_documentations
                SET
                    status = 'approved',
                    reviewed_at = CURRENT_TIMESTAMP,
                    reviewed_by = :reviewed_by
                WHERE documentation_id = :documentation_id
            """),
            {
                "documentation_id": documentation_id,
                "reviewed_by": admin["user_id"]
            }
        )

        conn.execute(
            text("""
                UPDATE assistance_requests
                SET status = 'completed'
                WHERE request_id = :request_id
            """),
            {
                "request_id": documentation.request_id
            }
        )

    log_audit(
        admin,
        f"Admin {admin.get('full_name', '')} approved delivery documentation for request #{documentation.request_id}"
    )

    return {
        "message": "Request completed successfully."
    }


# ============================================================
# ADMIN REJECT
# ============================================================
@router.put("/{documentation_id}/reject")
def reject_documentation(
    documentation_id: int,
    admin: dict = Depends(require_role(["admin"]))
):

    with engine.begin() as conn:

        documentation = conn.execute(
            text("""
                SELECT
                    documentation_id,
                    request_id
                FROM delivery_documentations
                WHERE documentation_id = :documentation_id
            """),
            {
                "documentation_id": documentation_id
            }
        ).fetchone()

        if not documentation:
            raise HTTPException(
                status_code=404,
                detail="Documentation not found."
            )

        conn.execute(
            text("""
                UPDATE delivery_documentations
                SET
                    status = 'rejected',
                    reviewed_at = CURRENT_TIMESTAMP,
                    reviewed_by = :reviewed_by
                WHERE documentation_id = :documentation_id
            """),
            {
                "documentation_id": documentation_id,
                "reviewed_by": admin["user_id"]
            }
        )

        conn.execute(
            text("""
                UPDATE assistance_requests
                SET status = 'processing'
                WHERE request_id = :request_id
            """),
            {
                "request_id": documentation.request_id
            }
        )

    log_audit(
        admin,
        f"Admin {admin.get('full_name', '')} rejected delivery documentation for request #{documentation.request_id}"
    )

    return {
        "message": "Documentation rejected and returned to staff."
    }