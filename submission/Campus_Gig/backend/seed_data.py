"""Seed the local Campus Gig database with deterministic demo data.

Run from the backend directory:
    uv run python seed_data.py

This script is additive and safe to rerun: it only creates missing records and
keeps existing student-created records. It ensures minimum totals of 12 users,
25 gigs, 20 applications, and 8 reviews.
"""
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from database import Base, SessionLocal, engine
from enums import ApplicationStatus, GigCategory, GigStatus, GigType, PaymentType
from models import Application, Gig, Review, User

Base.metadata.create_all(bind=engine)

CATEGORIES = [
    GigCategory.PROGRAMMING.value,
    GigCategory.DESIGN.value,
    GigCategory.WRITING.value,
    GigCategory.TUTORING.value,
]
TYPES = [GigType.OFFERING.value, GigType.REQUESTING.value]
PAYMENTS = [
    PaymentType.PAID.value,
    PaymentType.SKILL_SWAP.value,
    PaymentType.FREE.value,
]


def add_demo_users(db):
    while db.query(User).count() < 12:
        existing_names = set(db.scalars(select(User.name)).all())
        number = 1
        while f"Demo Student {number:02d}" in existing_names:
            number += 1
        user = User(
            name=f"Demo Student {number:02d}",
            major=["Computer Science", "Graphic Design", "English", "Mathematics"][number % 4],
            semester=(number % 8) + 1,
            bio="Demo profile for Campus Gig milestone testing.",
            skills=[
                ["Python", "FastAPI"],
                ["Figma", "Canva"],
                ["Writing", "Editing"],
                ["Mathematics", "Tutoring"],
            ][number % 4],
        )
        db.add(user)
        db.commit()


def add_demo_gigs(db):
    count = db.query(Gig).count()
    users = db.scalars(select(User).order_by(User.id)).all()
    number = 1
    while count < 25:
        existing_titles = set(db.scalars(select(Gig.title)).all())
        title = f"Demo Gig {number:02d}"
        if title in existing_titles:
            number += 1
            continue

        owner = users[(number - 1) % len(users)]
        applicant = users[number % len(users)]
        status_cycle = [
            GigStatus.OPEN.value,
            GigStatus.IN_PROGRESS.value,
            GigStatus.COMPLETED.value,
            GigStatus.EXPIRED.value,
            GigStatus.CANCELLED.value,
        ]
        status = status_cycle[(number - 1) % len(status_cycle)]
        payment = PAYMENTS[(number - 1) % len(PAYMENTS)]
        deadline = date.today() - timedelta(days=2) if status == GigStatus.EXPIRED.value else date.today() + timedelta(days=number + 3)

        gig = Gig(
            user_id=owner.id,
            title=title,
            description=(
                f"Demo description for {title}. This sample gig is included "
                "to test Campus Gig discovery, applications, status workflows, and reviews."
            ),
            type=TYPES[(number - 1) % len(TYPES)],
            category=CATEGORIES[(number - 1) % len(CATEGORIES)],
            payment_type=payment,
            budget=(1000.0 + number * 250.0) if payment == PaymentType.PAID.value else None,
            deadline=deadline,
            status=status,
            accepted_applicant_id=(
                applicant.id
                if status in (GigStatus.IN_PROGRESS.value, GigStatus.COMPLETED.value)
                else None
            ),
        )
        db.add(gig)
        db.commit()
        count += 1
        number += 1


def add_demo_applications(db):
    # Keep the accepted applicant and the application status consistent for demo gigs.
    gigs = db.scalars(select(Gig).order_by(Gig.id)).all()
    users = db.scalars(select(User).order_by(User.id)).all()

    for gig in gigs:
        if (
            gig.status in (GigStatus.IN_PROGRESS.value, GigStatus.COMPLETED.value)
            and gig.accepted_applicant_id is not None
        ):
            existing = db.scalar(
                select(Application.id).where(
                    Application.gig_id == gig.id,
                    Application.applicant_id == gig.accepted_applicant_id,
                )
            )
            if existing is None:
                db.add(
                    Application(
                        gig_id=gig.id,
                        applicant_id=gig.accepted_applicant_id,
                        message="I can help with this project and complete the agreed work.",
                        status=ApplicationStatus.ACCEPTED.value,
                    )
                )
                db.commit()

    # Add unique demo applications until the minimum total is reached.
    attempt = 0
    while db.query(Application).count() < 20 and attempt < 1000:
        gigs = db.scalars(select(Gig).order_by(Gig.id)).all()
        users = db.scalars(select(User).order_by(User.id)).all()
        gig = gigs[attempt % len(gigs)]
        applicant = users[(attempt + 2) % len(users)]
        attempt += 1
        if applicant.id == gig.user_id:
            continue

        exists = db.scalar(
            select(Application.id).where(
                Application.gig_id == gig.id,
                Application.applicant_id == applicant.id,
            )
        )
        if exists is not None:
            continue

        if gig.status == GigStatus.OPEN.value and gig.deadline >= date.today():
            status = ApplicationStatus.PENDING.value
        else:
            status = ApplicationStatus.REJECTED.value

        db.add(
            Application(
                gig_id=gig.id,
                applicant_id=applicant.id,
                message="Demo application: I am interested and have relevant skills.",
                status=status,
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()


def add_demo_reviews(db):
    completed_gigs = db.scalars(
        select(Gig)
        .where(
            Gig.status == GigStatus.COMPLETED.value,
            Gig.accepted_applicant_id.is_not(None),
        )
        .order_by(Gig.id)
    ).all()

    for gig in completed_gigs:
        if db.query(Review).count() >= 8:
            break
        participants = [
            (gig.user_id, gig.accepted_applicant_id, 5, "Great collaboration and clear communication."),
            (gig.accepted_applicant_id, gig.user_id, 4, "The work was completed well and on time."),
        ]
        for reviewer_id, reviewee_id, rating, comment in participants:
            if db.query(Review).count() >= 8:
                break
            exists = db.scalar(
                select(Review.id).where(
                    Review.gig_id == gig.id,
                    Review.reviewer_id == reviewer_id,
                )
            )
            if exists is not None:
                continue
            db.add(
                Review(
                    gig_id=gig.id,
                    reviewer_id=reviewer_id,
                    reviewee_id=reviewee_id,
                    rating=rating,
                    comment=comment,
                )
            )
            try:
                db.commit()
            except IntegrityError:
                db.rollback()


def main():
    with SessionLocal() as db:
        add_demo_users(db)
        add_demo_gigs(db)
        add_demo_applications(db)
        add_demo_reviews(db)

        totals = {
            "users": db.query(User).count(),
            "gigs": db.query(Gig).count(),
            "applications": db.query(Application).count(),
            "reviews": db.query(Review).count(),
        }
        print("Campus Gig seed complete.")
        for table, total in totals.items():
            print(f"{table}: {total}")
        if (
            totals["users"] < 12
            or totals["gigs"] < 25
            or totals["applications"] < 20
            or totals["reviews"] < 8
        ):
            raise SystemExit(
                "Seed data did not reach all minimum totals; inspect existing database records."
            )


if __name__ == "__main__":
    main()
