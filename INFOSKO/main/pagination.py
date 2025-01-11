from rest_framework.pagination import PageNumberPagination

class PersonnelPagination(PageNumberPagination):
    page_size = 21  # Adjust this number to load 7 rows per load (7 * 3 categories)
    max_page_size = 50
