"""
rate_limit.py — SlowAPI-based rate limiting for Atlas.

Usage in a router:
    from backend.utils.rate_limit import limiter
    @router.post("/login")
    @limiter.limit("5/minute")
    def login(request: Request, ...):
        ...

Remember to attach the limiter to the app and add the exception handler
in main.py (already done there).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
