import logging
from django.http import HttpResponseForbidden
from django.conf import settings

logger = logging.getLogger(__name__)

class AllowIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            ip = self.get_client_ip(request)
            logger.info(f"Client IP: {ip}")
            if ip not in settings.ALLOWED_IPS:
                logger.warning(f"Forbidden access attempt from IP: {ip}")
                return HttpResponseForbidden("Forbidden")
        except Exception as e:
            logger.error(f"Error in middleware: {e}")
            raise
        return self.get_response(request)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
