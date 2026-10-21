from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from database import get_db
from deps import get_current_user
from enums import ApplicationStatus, GigStatus
from models import Application, Gig, User
from schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    ApplicationWithApplicant,
    ApplicationWithGig,
)
from services import effective_status, to_gig_out

router = APIRouter(prefix="/applications", tags=["Applications"])


def to_application_with_gig(application: Application) -> ApplicationWithGig:
    base = ApplicationOut.model_validate(application).model_dump()
    return ApplicationWithGig(**base, gig=to_gig_out(application.gig))


@router.post("", response_model=ApplicationWithGig, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gig = db.scalar(
        select(Gig).options(joinedload(Gig.owner)).where(Gig.id == payload.gig_id)
    )
    if gig is None:
        raise HTTPException(status_code=404, detail="Gig not found")

    # Rule: you cannot apply to your own gig
    if gig.user_id == current_user.id:
        raise HTTPException(status_code=403, detail="You cannot apply to your own gig")

    # Only Open gigs accept applications (Expired, In Progress, Completed, Cancelled do not)
    if effective_status(gig) != GigStatus.OPEN:
        raise HTTPException(
            status_code=400, detail="This gig is not open for applications"
        )

    # Rule: no duplicate application to the same gig
    already = db.scalar(
        select(Application.id).where(
            Application.gig_id == gig.id,
            Application.applicant_id == current_user.id,
        )
    )
    if already is not None:
        raise HTTPException(
            status_code=409, detail="You have already applied to this gig"
        )

    application = Application(
        gig_id=gig.id,
        applicant_id=current_user.id,
        message=payload.message,
        status=ApplicationStatus.PENDING.value,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        # two requests at the same time: the database unique constraint catches it
        db.rollback()
        raise HTTPException(
            status_code=409, detail="You have already applied to this gig"
        )

    db.refresh(application)
    return to_application_with_gig(application)


@router.get("/mine", response_model=list[ApplicationWithGig])
def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Application)
        .options(joinedload(Application.gig).joinedload(Gig.owner))
        .where(Application.applicant_id == current_user.id)
        .order_by(Application.created_at.desc(), Application.id.desc())
    )
    return [to_application_with_gig(app) for app in db.scalars(stmt).all()]


# ---------- Milestone 3 ----------
@router.patch("/{application_id}", response_model=ApplicationWithApplicant)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    gig = db.get(Gig, application.gig_id)
    if gig.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the gig owner can accept or reject applicants"
        )

    # a decision is final
    if application.status != ApplicationStatus.PENDING.value:
        raise HTTPException(
            status_code=409, detail=f"This application is already {application.status}"
        )

    # decisions are only possible while the gig is Open (not In Progress, Expired, ...)
    gig_status = effective_status(gig)
    if gig_status != GigStatus.OPEN:
        raise HTTPException(
            status_code=409,
            detail=f"This gig is no longer open (status: {gig_status.value})",
        )

    if payload.status == ApplicationStatus.ACCEPTED:
        # everything below is saved together in ONE commit
        application.status = ApplicationStatus.ACCEPTED.value
        gig.status = GigStatus.IN_PROGRESS.value
        gig.accepted_applicant_id = application.applicant_id

        others = db.scalars(
            select(Application).where(
                Application.gig_id == gig.id,
                Application.id != application.id,
                Application.status == ApplicationStatus.PENDING.value,
            )
        ).all()
        for other in others:
            other.status = ApplicationStatus.REJECTED.value
    else:
        application.status = ApplicationStatus.REJECTED.value

    db.commit()
    db.refresh(application)
    return application
