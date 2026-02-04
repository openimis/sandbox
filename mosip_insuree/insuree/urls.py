# Add this to your Django urls.py

from django.urls import path
from .views import ESignetLoginView,ESignetPollView,ESignetCallbackView 

urlpatterns = [
    path('api/esignet/login/', ESignetLoginView.as_view(), name='esignet_login'),
    path('api/esignet/poll/', ESignetPollView.as_view(), name='esignet_poll'),
]