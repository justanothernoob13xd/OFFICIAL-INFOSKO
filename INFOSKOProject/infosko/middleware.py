from django.http import HttpResponseForbidden
from django.conf import settings

class AllowIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Correctly calling the class method using 'self'
        ip = self.get_client_ip(request)
        if ip not in settings.ALLOWED_IPS:
            return HttpResponseForbidden("Forbidden")
        return self.get_response(request)

    def get_client_ip(self, request):
        # Retrieve the IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
