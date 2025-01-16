import schedule
import time
from django.core.management import call_command

def delete_old_logs():
    print("Deleting old logs...")
    call_command('delete_old_logs')

# Schedule the task every minute for testing purposes
schedule.every(1).minutes.do(delete_old_logs)

while True:
    schedule.run_pending()
    time.sleep(1)
