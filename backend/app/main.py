from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.core.config import settings
from app.routers import auth, users, applications, windows, files

app = FastAPI(title="BRF Scholarships API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(
    applications.router, prefix="/api/applications", tags=["applications"]
)
app.include_router(windows.router, prefix="/api/windows", tags=["windows"])
app.include_router(files.router, prefix="/api/files", tags=["files"])


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Lambda entrypoint
handler = Mangum(app)
