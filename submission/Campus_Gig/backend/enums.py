from enum import Enum


class GigType(str, Enum):
    OFFERING = "Offering"
    REQUESTING = "Requesting"


class GigCategory(str, Enum):
    PROGRAMMING = "Programming"
    DESIGN = "Design"
    WRITING = "Writing"
    TUTORING = "Tutoring"


class PaymentType(str, Enum):
    PAID = "Paid"
    SKILL_SWAP = "SkillSwap"
    FREE = "Free"


class GigStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"


class ApplicationStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
