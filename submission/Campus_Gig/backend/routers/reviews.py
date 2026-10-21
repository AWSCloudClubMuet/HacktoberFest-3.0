from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from enums import GigStatus
from models import Gig, Review, User
from schemas import ReviewCreate, ReviewOut, UserOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def build_review(db: Session, review: Review) -> ReviewOut:
    reviewer = db.get(User, review.reviewer_id)
    reviewee = db.get(User, review.reviewee_id)
    gig = db.get(Gig, review.gig_id)

    # These linked records are protected by foreign-key constraints.
    return ReviewOut(
        id=review.id,
        gig_id=review.gig_id,
        reviewer_id=review.reviewer_id,
        reviewee_id=review.reviewee_id,
        rating=review.rating,
        comment=review.comment,
        reviewer=UserOut.model_validate(reviewer),
        reviewee=UserOut.model_validate(reviewee),
        gig_title=gig.title,
    )


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gig = db.get(Gig, payload.gig_id)
    if gig is None:
        raise HTTPException(status_code=404, detail="Gig not found")

    if gig.status != GigStatus.COMPLETED.value:
        raise HTTPException(
            status_code=409,
            detail="Reviews can only be submitted after the gig is completed",
        )

    if gig.accepted_applicant_id is None:
        raise HTTPException(
            status_code=409,
            detail="This completed gig has no accepted applicant to review",
        )

    if current_user.id == gig.user_id:
        reviewee_id = gig.accepted_applicant_id
    elif current_user.id == gig.accepted_applicant_id:
        reviewee_id = gig.user_id
    else:
        raise HTTPException(
            status_code=403,
            detail="Only the gig owner and accepted applicant can review each other",
        )

    existing = db.scalar(
        select(Review.id).where(
            Review.gig_id == gig.id,
            Review.reviewer_id == current_user.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this gig",
        )

    review = Review(
        gig_id=gig.id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this gig",
        )

    db.refresh(review)
    return build_review(db, review)


@router.get("/gig/{gig_id}", response_model=list[ReviewOut])
def list_gig_reviews(gig_id: int, db: Session = Depends(get_db)):
    if db.get(Gig, gig_id) is None:
        raise HTTPException(status_code=404, detail="Gig not found")

    reviews = db.scalars(
        select(Review)
        .where(Review.gig_id == gig_id)
        .order_by(Review.id.asc())
    ).all()
    return [build_review(db, review) for review in reviews]


@router.get("/user/{user_id}", response_model=list[ReviewOut])
def list_user_reviews(user_id: int, db: Session = Depends(get_db)):
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")

    reviews = db.scalars(
        select(Review)
        .where(Review.reviewee_id == user_id)
        .order_by(Review.id.desc())
    ).all()
    return [build_review(db, review) for review in reviews]
