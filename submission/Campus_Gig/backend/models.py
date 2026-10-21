from datetime import date, datetime, timezone

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from enums import ApplicationStatus, GigStatus


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    major: Mapped[str] = mapped_column(String(100))
    semester: Mapped[int] = mapped_column(Integer)
    bio: Mapped[str] = mapped_column(Text, default="")
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)


class Gig(Base):
    __tablename__ = "gigs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(30))
    payment_type: Mapped[str] = mapped_column(String(20))
    budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    deadline: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default=GigStatus.OPEN.value)
    accepted_applicant_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    owner: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    # NEW: loads the accepted applicant together with the gig
    accepted_applicant = relationship(
        "User", foreign_keys=[accepted_applicant_id], lazy="joined"
    )


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("gig_id", "applicant_id", name="uq_application_gig_applicant"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    gig_id: Mapped[int] = mapped_column(ForeignKey("gigs.id"), index=True)
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(20), default=ApplicationStatus.PENDING.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    gig: Mapped["Gig"] = relationship("Gig")
    applicant: Mapped["User"] = relationship("User")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("gig_id", "reviewer_id", name="uq_review_gig_reviewer"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    gig_id: Mapped[int] = mapped_column(ForeignKey("gigs.id"), index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reviewee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text, default="")
