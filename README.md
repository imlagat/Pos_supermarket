# POS_supermarket

## 🚀 How to Run the Project Locally

### 1. Clone the Repository
Open your terminal and run the following commands to clone the project and navigate into the root directory:

```bash
git clone https://github.com/imlagat/Pos_supermarket.git
cd supermarket

```

---

## 🖥️ Backend Setup (Laravel)

Open a terminal window and navigate to the `backend` folder to configure the API service:

```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Create environment configuration file
cp .env.example .env

# Generate application security key
php artisan key:generate

```

> 💡 **Configuration Note:** Open the newly created `.env` file in your code editor and configure your local Database connections (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) and add your M-Pesa API sandbox credentials.

Once your database is configured, run the database structures and start the development server:

```bash
# Run migrations and populate the database with seed data
php artisan migrate:fresh --seed

# seed product table 
php artisan db:seed --class=DemoProductsSeeder

# Start the Laravel development server
php artisan serve

```

Your backend API will now be running at `http://127.0.0.1:8000`.

---

## 🎨 Frontend Setup (React)

Open a **new terminal window or tab**, navigate to the `frontend` folder, and spin up the user interface application:

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev

```

Your frontend interface will now be running locally (usually at `http://localhost:5173`).

---

## 🔐 Demo Login Credentials

The database seeder generates three distinct roles for testing system permissions. Use any of the combinations below to log into the application dashboard:

| Role | Email Address | Password |
| --- | --- | --- |
| **Administrator** | `admin@pos.com` | `admin123` |
| **Manager** | `manager@pos.com` | `manager123` |
| **Cashier** | `cashier@pos.com` | `cashier123` |


