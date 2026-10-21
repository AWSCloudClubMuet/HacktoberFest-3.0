from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User


def get_current_user(
    x_user_id: int | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if x_user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Missing X-User-Id header. Select or create a profile first.",
        )
    user = db.get(User, x_user_id)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found. Select or create a profile first.",
        )
    return user
