# Create project folder
sudo mkdir -p /opt/claim_submitter
sudo chown $USER:$USER /opt/claim_submitter

# Navigate to folder
cd /opt/claim_submitter

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install requests apscheduler python-dotenv

# Create Schedular Service

sudo nano /etc/systemd/system/claim_scheduler.service

```
[Unit]
Description=OpenIMIS Claim Scheduler
After=network.target

[Service]
User=user
WorkingDirectory=/opt/claim_submitter
ExecStart=/opt/claim_submitter/venv/bin/python /opt/claim_submitter/multi_claim_scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target


```

## Enable and Start Service

# Reload systemd
sudo systemctl daemon-reload

# Enable service at boot
sudo systemctl enable claim_scheduler.service

# Start service
sudo systemctl start claim_scheduler.service

# Check status
sudo systemctl status claim_scheduler.service

# logging
``` tail -f /opt/claim_submitter/claim_scheduler.log ```

# restart
``` sudo systemctl restart claim_scheduler.service ```

# stop
``` sudo systemctl stop claim_scheduler.service ```

# disable at boot

``` sudo systemctl disable claim_scheduler.service ```