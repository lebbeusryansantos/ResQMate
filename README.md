# ResQMate 🤝

**ResQMate** is a comprehensive disaster relief and community assistance platform designed to streamline the process of requesting, tracking, and distributing aid during crises.

## 🚀 Features

* **Role-Based Access Control (RBAC):** Dedicated interfaces and permissions for Community Users, Staff, and Administrators.
* **Assistance Request System:** Users can request specific aid categories (Food, Water, Shelter, Medicine, General) with location-based scoping.
* **Strict Security Architecture:** Enforces a persistent, server-side 3-attempt login lockout to prevent unauthorized access and brute-force attacks.
* **Interactive Dashboards:** Live tracking of request statuses (Pending, Approved, Dispatched, Resolved) with empty-state UI handling.
* **Cloud-Native Deployment:** Fully decoupled architecture using serverless frontends and cloud-hosted database infrastructure.

## 💻 Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (Deployed via Vercel)
* **Backend:** Python, FastAPI (Deployed via Render)
* **Database:** MySQL hosted on Aiven Cloud
* **Version Control:** GitHub

## ⚙️ Environment Variables

To run this project locally or deploy it to a cloud provider, you must configure the following environment variables in a `.env` file at the root of the backend directory:

```env
DATABASE_URL=mysql+pymysql://<username>:<password>@<host>:<port>/<database_name>
```

## 🛠️ Local Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/lebbeusryansantos/ResQMate.git
cd ResQMate
```

### 2. Set Up the Python Virtual Environment

```bash
python -m venv venv
```

**Activate the virtual environment:**

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the FastAPI Server

```bash
uvicorn backend.main:app --reload
```

### 5. Launch the Frontend

Open `frontend/customer/login.html` using Live Server or your preferred local development server.

## 🛡️ Security Notes

This system includes a strict 3-attempt lockout mechanism. If a user inputs incorrect credentials three consecutive times, the account is locked at the database level for a cooling-off period.

Administrators can manually bypass this by clearing the `locked_until` timestamp in the `users` table.
