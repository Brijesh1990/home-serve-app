from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(default="+91 9876543210", max_length=30)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="customer")
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    category_specialization: Optional[str] = None
    experience_years: Optional[int] = 3
    city: Optional[str] = "Mumbai"
    license_number: Optional[str] = None
    id_document_url: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
