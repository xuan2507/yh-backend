# YH Studio Backend — Setup Guide

## 1. Fix Admin Password (Required)

Render generated a random admin password when the service was first created.
You need to change it to `***`:

1. Go to https://dashboard.render.com/
2. Click **yh-studio-backend**
3. Click **Environment** tab (left sidebar)
4. Find `ADMIN_PASSWORD`
5. Change the value to: `***`
6. Click **Save Changes**
7. Render will auto-restart the service

After this, the admin panel password will be `***`.

---

## 2. Add Persistent Database (Required for orders to survive)

Render free tier uses ephemeral storage. Orders disappear when the server sleeps.
Fix: Add a free MongoDB Atlas database.

### Step-by-step (5 minutes):

**A. Create MongoDB Atlas Account**
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email (free, no credit card)
3. Click **Create** → **Shared Cluster** (FREE forever)
4. Choose any cloud provider + region (e.g. AWS / Singapore)
5. Click **Create Cluster** (takes 1-2 minutes)

**B. Create Database User**
1. In Atlas dashboard, click **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Username: `yhstudio`
4. Password: click **Autogenerate Secure Password** and COPY it
5. Click **Add User**

**C. Allow Network Access**
1. Click **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
4. Click **Confirm**

**D. Get Connection String**
1. Click **Database** → **Clusters** → **Connect**
2. Click **Drivers** → **Node.js**
3. Copy the connection string. It looks like:
   ```
   mongodb+srv://yhstudio:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
4. Replace `<db_password>` with the password you copied in Step B

**E. Add to Render**
1. Go back to Render dashboard → **yh-studio-backend** → **Environment**
2. Click **Add Environment Variable**
3. Key: `MONGODB_URI`
4. Value: paste the full connection string from Step D
5. Click **Save Changes**
6. Render will auto-restart

**F. Verify**
1. Wait 30 seconds for restart
2. Visit: https://yh-backend.onrender.com/api/health
3. You should see: `{"status":"ok","db":"mongodb",...}`

Once `db` shows `mongodb`, orders will persist forever.

---

## 3. (Optional) Webhook Notifications

Add a `WEBHOOK_URL` env var to receive order notifications.
The backend will POST order details to this URL on every new order.

Use with Zapier, Make.com, Discord webhook, or Telegram Bot API.

---

## Admin Panel

URL: https://yh-backend.onrender.com/admin
Password: `***` (after Step 1 above)
