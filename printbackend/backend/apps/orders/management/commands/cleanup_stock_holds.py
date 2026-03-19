"""
Management command to clean up expired stock holds.

Usage:
    python manage.py cleanup_stock_holds

Add to crontab for automatic cleanup every 2 minutes:
    */2 * * * * cd /home/printdoot/printbackend/backend && /home/printdoot/printbackend/backend/venv/bin/python manage.py cleanup_stock_holds >> /var/log/printdoot/stock-holds.log 2>&1
"""
from django.core.management.base import BaseCommand
from apps.orders.models import StockHold


class Command(BaseCommand):
    help = 'Release expired stock holds (items held in cart past the time limit)'

    def handle(self, *args, **options):
        count = StockHold.cleanup_expired()
        if count > 0:
            self.stdout.write(self.style.SUCCESS(f'Released {count} expired stock hold(s).'))
        else:
            self.stdout.write('No expired holds to release.')
