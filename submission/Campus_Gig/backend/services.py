from datetime import date

from enums import GigStatus
from models import Gig
from schemas import GigOut


def effective_status(gig: Gig) -> GigStatus:
    """Open gigs whose deadline date has passed are shown as Expired."""
    if gig.status == GigStatus.OPEN.value and gig.deadline < date.today():
        return GigStatus.EXPIRED
    return GigStatus(gig.status)


def to_gig_out(gig: Gig) -> GigOut:
    """Turns a Gig row into the API response, with the Expired rule applied.
    The database row itself is never changed."""
    out = GigOut.model_validate(gig)
    out.status = effective_status(gig)
    return out
