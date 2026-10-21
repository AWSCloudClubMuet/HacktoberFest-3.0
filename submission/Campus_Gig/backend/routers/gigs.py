from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from database import get_db
from deps import get_current_user
from enums import ApplicationStatus, GigCategory, GigStatus, GigType, PaymentType
from models import Application, Gig, User
from schemas import ApplicationWithApplicant, GigCreate, GigOut, GigStatusUpdate
from services import effective_status, to_gig_out

router = APIRouter(prefix="/gigs", tags=["Gigs"])

# Allowed manual status changes made by the owner.
# Open -> In Progress is NOT here: it only happens by accepting an applicant.
ALLOWED_GIG_TRANSITIONS = {
    GigStatus.OPEN: {GigStatus.CANCELLED},
    GigStatus.IN_PROGRESS: {GigStatus.COMPLETED, GigStatus.CANCELLED},
}


def _like_pattern(word: str) -> str:
    # escape LIKE special characters so a search for "100%" or "a_b" is taken literally
    escaped = word.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


@router.post("", response_model=GigOut, status_code=201)
def create_gig(
    payload: GigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gig = Gig(
        user_id=current_user.id,  # poster comes from the header, never from the body
        title=payload.title,
        description=payload.description,
        type=payload.type.value,
        category=payload.category.value,
        payment_type=payload.payment_type.value,
        budget=payload.budget,
        deadline=payload.deadline,
        status=GigStatus.OPEN.value,
    )
    db.add(gig)
    db.commit()
    db.refresh(gig)
    return to_gig_out(gig)


@router.get("", response_model=list[GigOut])
def list_gigs(
    user_id: int | None = None,
    category: GigCategory | None = None,
    type: GigType | None = None,
    payment_type: PaymentType | None = None,
    min_budget: float | None = Query(default=None, ge=0),
    max_budget: float | None = Query(default=None, ge=0),
    q: str | None = Query(default=None, max_length=100),
    status: GigStatus | None = None,
    db: Session = Depends(get_db),
):
    if min_budget is not None and max_budget is not None and min_budget > max_budget:
        raise HTTPException(
            status_code=422, detail="min_budget cannot be greater than max_budget"
        )

    today = date.today()
    stmt = select(Gig).options(joinedload(Gig.owner))

    if user_id is not None:
        stmt = stmt.where(Gig.user_id == user_id)
    if category is not None:
        stmt = stmt.where(Gig.category == category.value)
    if type is not None:
        stmt = stmt.where(Gig.type == type.value)
    if payment_type is not None:
        stmt = stmt.where(Gig.payment_type == payment_type.value)

    # Gigs without a budget (Skill Swap / Free) never match a budget filter
    if min_budget is not None:
        stmt = stmt.where(Gig.budget >= min_budget)
    if max_budget is not None:
        stmt = stmt.where(Gig.budget <= max_budget)

    # every word must appear in the title OR the description
    if q:
        for word in q.split():
            pattern = _like_pattern(word)
            stmt = stmt.where(
                or_(
                    Gig.title.ilike(pattern, escape="\\"),
                    Gig.description.ilike(pattern, escape="\\"),
                )
            )

    # status filter must follow the Expired rule
    if status is not None:
        if status == GigStatus.OPEN:
            stmt = stmt.where(Gig.status == GigStatus.OPEN.value, Gig.deadline >= today)
        elif status == GigStatus.EXPIRED:
            stmt = stmt.where(
                or_(
                    Gig.status == GigStatus.EXPIRED.value,
                    and_(Gig.status == GigStatus.OPEN.value, Gig.deadline < today),
                )
            )
        else:
            stmt = stmt.where(Gig.status == status.value)

    stmt = stmt.order_by(Gig.created_at.desc(), Gig.id.desc())
    return [to_gig_out(gig) for gig in db.scalars(stmt).all()]


@router.get("/{gig_id}", response_model=GigOut)
def get_gig(gig_id: int, db: Session = Depends(get_db)):
    gig = db.scalar(select(Gig).options(joinedload(Gig.owner)).where(Gig.id == gig_id))
    if gig is None:
        raise HTTPException(status_code=404, detail="Gig not found")
    return to_gig_out(gig)


# ---------- Milestone 3 ----------
@router.get("/{gig_id}/applications", response_model=list[ApplicationWithApplicant])
def list_gig_applications(
    gig_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gig = db.get(Gig, gig_id)
    if gig is None:
        raise HTTPException(status_code=404, detail="Gig not found")
    if gig.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the gig owner can view applications"
        )

    stmt = (
        select(Application)
        .options(joinedload(Application.applicant))
        .where(Application.gig_id == gig_id)
        .order_by(Application.created_at.asc(), Application.id.asc())
    )
    return db.scalars(stmt).all()


@router.patch("/{gig_id}", response_model=GigOut)
def update_gig_status(
    gig_id: int,
    payload: GigStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gig = db.get(Gig, gig_id)
    if gig is None:
        raise HTTPException(status_code=404, detail="Gig not found")
    if gig.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the gig owner can change the gig status"
        )

    current = effective_status(gig)
    target = payload.status

    if target == GigStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400,
            detail="A gig becomes In Progress only by accepting an applicant",
        )
    if target == GigStatus.EXPIRED:
        raise HTTPException(
            status_code=400,
            detail="Expired is set automatically after the deadline passes",
        )
    if target == GigStatus.COMPLETED and current != GigStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=409,
            detail="A gig can be completed only when it is In Progress",
        )
    if target not in ALLOWED_GIG_TRANSITIONS.get(current, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot change a gig from {current.value} to {target.value}",
        )

    gig.status = target.value

    # a cancelled gig should not keep Pending applications
    if target == GigStatus.CANCELLED:
        pending = db.scalars(
            select(Application).where(
                Application.gig_id == gig.id,
                Application.status == ApplicationStatus.PENDING.value,
            )
        ).all()
        for application in pending:
            application.status = ApplicationStatus.REJECTED.value

    db.commit()
    db.refresh(gig)
    return to_gig_out(gig)
