import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.routes import authentication_routes, course_routes, dashboard_routes, db_routes, performance_routes, student_routes, user_routes, util_routes, content_routes
from src.templating import template_Init
from src.db_init import initialize_database
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # run on startup
    initialize_database()
    yield
    # run on shutdown


SESSION_SECRET_KEY = os.urandom(24).hex()  # secret key for session

app = FastAPI(lifespan=lifespan)

# --- CORS Middleware setting start ---
# Define the origins that are allowed to access your backend
# This should be the address of your Next.js development server.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CORS middleware setting end ---

app.include_router(db_routes.router)
app.include_router(student_routes.router)
app.include_router(authentication_routes.router)
app.include_router(user_routes.router)
app.include_router(template_Init.router)
app.include_router(performance_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(course_routes.router)
app.include_router(util_routes.router)
app.include_router(content_routes.router)
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET_KEY)

@app.get("/")
def home() -> dict:
    return {"Data": "Test"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

