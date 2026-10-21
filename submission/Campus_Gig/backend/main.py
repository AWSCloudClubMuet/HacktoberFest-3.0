from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  (makes sure all tables are registered before create_all)
from database import Base, engine
from routers import applications, gigs, reviews, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campus Gig & SkillSwap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(gigs.router)
app.include_router(applications.router)
app.include_router(reviews.router)


@app.get("/")
def home():
    return {"message": "Campus Gig FastAPI backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "backend": "FastAPI", "project": "Campus Gig"}


# Temporary: keeps your current App.jsx working until the next chat replaces it
@app.get("/test/{name}")
def test_name(name: str):
    return {"message": f"Hello, {name}!", "success": True}
