import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine

# Import Models
from backend.models.user import User
from backend.models.category import Category
from backend.models.location import Location
from backend.models.assistance_request import AssistanceRequest
from backend.models.resource import Resource
from backend.models.distribution import Distribution
from backend.models.notification import Notification
from backend.models.request_status_history import RequestStatusHistory

# Import Routers
from backend.routes.users import router as user_router
from backend.routes.notification import router as notification_router
from backend.routes.history import router as history_router
from backend.routes.request import router as request_router
from backend.routes.resource import router as resource_router
from backend.routes.distribution import router as distribution_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes import reports
from backend.routes import location
from backend.routes import delivery_documentations

# Create Tables
Base.metadata.create_all(bind=engine)

# FastAPI App
app = FastAPI(
    title="ResQMate API",
    version="1.0"
)

ALLOWED_ORIGINS = [
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://res-q-mate-ten.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(
    user_router,
    prefix="/users",
    tags=["Users"]
)

app.include_router(
    notification_router,
    prefix="/notifications",
    tags=["Notifications"]
)

app.include_router(
    history_router,
    prefix="/history",
    tags=["Request History"]
)

app.include_router(
    request_router,
    prefix="/requests",
    tags=["Requests"]
)

app.include_router(
    resource_router,
    prefix="/resources",
    tags=["Resources"]
)

app.include_router(
    distribution_router,
    prefix="/distributions",
    tags=["Distributions"]
)

app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)

app.include_router(
    location.router
)

app.include_router(
    delivery_documentations.router,
    prefix="/delivery-documentations",
    tags=["Delivery Documentation"]
)

# Root Endpoint
@app.get("/")
def home():
    return {
        "message": "ResQMate API Running"
    }