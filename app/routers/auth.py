from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AuditLog
from ..schemas import LoginRequest, Token, UserResponse, UserCreate
from ..services.auth_service import (
    verify_password, create_access_token, get_current_user, hash_password
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == request.username) | (User.email == request.username)
    ).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )
    
    # Log audit event
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"User {user.username} logged in with role {user.role}"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
def get_demo_users():
    """Return documented demo credentials for quick reviewer evaluation."""
    return [
        {
            "role": "Administrator",
            "username": "admin",
            "password": "admin123",
            "full_name": "Rajesh Sharma (Director)",
            "description": "Full access to manage sources, users, system settings, and audit logs."
        },
        {
            "role": "Field Officer",
            "username": "officer",
            "password": "officer123",
            "full_name": "Ananya Desai (Field Officer)",
            "description": "Submits measurements, updates assigned alerts, records inspections and corrective actions."
        },
        {
            "role": "Community Viewer",
            "username": "viewer",
            "password": "viewer123",
            "full_name": "Sanjay Patel (Panchayat Member)",
            "description": "Views public water-source status, preliminary screenings, and safety notices."
        }
    ]
