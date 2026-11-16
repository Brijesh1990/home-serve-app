from typing import Optional
from sqlalchemy.orm import Session
from app.models.feedback import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "booking",
    reference_id: Optional[int] = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_id=reference_id,
        is_read=False,
    )
    db.add(notif)
    return notif
