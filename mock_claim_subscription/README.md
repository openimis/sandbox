# OpenIMIS FHIR Subscription Listener

A lightweight Flask-based application to manage FHIR Subscriptions from [openIMIS](https://openimis.org), store callback notifications, and provide a simple API and UI layer for polling and monitoring.

---

## 🚀 Features

- Subscribe to FHIR events from openIMIS using rest-hooks
- Receive and persist notifications to a local SQLite database
- Unsubscribe from active subscriptions
- View current subscriptions and received notifications
- Lightweight polling endpoint for client-side refresh logic (e.g., Alpine.js)

---

## 📦 Requirements

- Python 3.7+
- SQLite (default database)
- Internet access to communicate with openIMIS
- `.env` file with openIMIS credentials

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/openimis-subscription-listener.git
cd openimis-subscription-listener
