from datetime import date, datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from enums import ApplicationStatus, GigCategory, GigStatus, GigType, PaymentType


# ---------- Users ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    major: str = Field(min_length=2, max_length=100)
    semester: int = Field(ge=1, le=12)
    bio: str = Field(default="", max_length=500)
    skills: list[str] = Field(default_factory=list, max_length=15)

    @field_validator("name", "major", "bio", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, value):
        seen = set()
        cleaned = []
        for skill in value:
            skill = skill.strip()
            if not skill:
                continue
            if len(skill) > 30:
                raise ValueError("Each skill must be 30 characters or less")
            if skill.lower() in seen:
                continue
            seen.add(skill.lower())
            cleaned.append(skill)
        return cleaned


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    major: str
    semester: int
    bio: str
    skills: list[str]


class UserProfile(UserOut):
    gigs_posted: int
    gigs_completed: int
    average_rating: float | None
    review_count: int


# ---------- Gigs ----------
class GigCreate(BaseModel):
    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=10, max_length=2000)
    type: GigType
    category: GigCategory
    payment_type: PaymentType
    budget: float | None = Field(default=None, ge=0, le=1_000_000)
    deadline: date

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("deadline")
    @classmethod
    def deadline_not_in_past(cls, value):
        if value < date.today():
            raise ValueError("Deadline cannot be in the past")
        return value

    @model_validator(mode="after")
    def check_budget(self):
        if self.payment_type == PaymentType.PAID:
            if self.budget is None or self.budget <= 0:
                raise ValueError(
                    "Budget is required and must be greater than 0 for Paid gigs"
                )
            self.budget = round(self.budget, 2)
        else:
            # Skill Swap and Free gigs never have a budget
            self.budget = None
        return self


class GigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str
    type: GigType
    category: GigCategory
    payment_type: PaymentType
    budget: float | None
    deadline: date
    status: GigStatus
    accepted_applicant_id: int | None
    created_at: datetime
    owner: UserOut
    accepted_applicant: UserOut | None = None  # NEW

    @field_validator("created_at")
    @classmethod
    def make_utc(cls, value):
        # SQLite drops the timezone, so we put UTC back. Without this,
        # the browser would show the wrong time.
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class GigStatusUpdate(BaseModel):  # NEW
    status: GigStatus


# ---------- Applications ----------
class ApplicationCreate(BaseModel):
    gig_id: int
    message: str = Field(min_length=5, max_length=500)

    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, value):
        return value.strip() if isinstance(value, str) else value


class ApplicationStatusUpdate(BaseModel):  # NEW
    status: ApplicationStatus

    @field_validator("status")
    @classmethod
    def only_accept_or_reject(cls, value):
        if value == ApplicationStatus.PENDING:
            raise ValueError("Status must be Accepted or Rejected")
        return value


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    gig_id: int
    applicant_id: int
    message: str
    status: ApplicationStatus
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def make_utc(cls, value):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class ApplicationWithGig(ApplicationOut):
    gig: GigOut


class ApplicationWithApplicant(ApplicationOut):  # NEW
    applicant: UserOut


# ---------- Reviews (Milestone 4) ----------
class ReviewCreate(BaseModel):
    gig_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)

    @field_validator("comment", mode="before")
    @classmethod
    def strip_comment(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("comment")
    @classmethod
    def comment_not_blank(cls, value):
        if not value:
            raise ValueError("Comment cannot be blank")
        return value


class ReviewOut(BaseModel):
    id: int
    gig_id: int
    reviewer_id: int
    reviewee_id: int
    rating: int
    comment: str
    reviewer: UserOut
    reviewee: UserOut
    gig_title: str
