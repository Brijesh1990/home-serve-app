from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.feedback import Notification
from app.models.user import User
from app.schemas.domain import AnnouncementRequest

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def list_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "reference_id": n.reference_id,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@router.patch("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"id": notif.id, "is_read": True}


@router.post("/announce", status_code=status.HTTP_201_CREATED)
def broadcast_announcement(
    payload: AnnouncementRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.is_active == True)
    if payload.target_role and payload.target_role != "all":
        query = query.filter(User.role == payload.target_role)
    users = query.all()
    for u in users:
        db.add(
            Notification(
                user_id=u.id,
                title=payload.title,
                message=payload.message,
                notification_type="announcement",
                is_read=False,
            )
        )
    db.commit()
    return {"message": f"Broadcast sent to {len(users)} users", "recipients_count": len(users)}
