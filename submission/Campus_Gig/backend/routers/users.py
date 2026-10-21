from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from enums import GigStatus
from models import Gig, Review, User
from schemas import UserCreate, UserOut, UserProfile

router = APIRouter(prefix="/users", tags=["Users"])


def build_profile(db: Session, user: User) -> UserProfile:
    gigs_posted = (
        db.scalar(select(func.count(Gig.id)).where(Gig.user_id == user.id)) or 0
    )

    # A gig counts as "completed" for BOTH the poster and the accepted applicant
    gigs_completed = (
        db.scalar(
            select(func.count(Gig.id)).where(
                Gig.status == GigStatus.COMPLETED.value,
                or_(Gig.user_id == user.id, Gig.accepted_applicant_id == user.id),
            )
        )
        or 0
    )

    # Average is always calculated from stored reviews (Milestone 4 rule)
    avg_rating, review_count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.reviewee_id == user.id
        )
    ).one()

    return UserProfile(
        **UserOut.model_validate(user).model_dump(),
        gigs_posted=gigs_posted,
        gigs_completed=gigs_completed,
        average_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        review_count=review_count,
    )


@router.post("", response_model=UserProfile, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return build_profile(db, user)


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.id)).all()


# NOTE: "/me" must stay ABOVE "/{user_id}", otherwise "me" is read as a user id
@router.get("/me", response_model=UserProfile)
def get_me(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return build_profile(db, current_user)


@router.get("/{user_id}", response_model=UserProfile)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return build_profile(db, user)


@router.put("/{user_id}", response_model=UserProfile)
def update_user(
    user_id: int,
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="You can only edit your own profile"
        )

    current_user.name = payload.name
    current_user.major = payload.major
    current_user.semester = payload.semester
    current_user.bio = payload.bio
    current_user.skills = payload.skills
    db.commit()
    db.refresh(current_user)
    return build_profile(db, current_user)
