# Supabase Credentials - Detailed Step-by-Step Guide

## 🎯 Goal: Find your Supabase database connection string

## 📍 **Detailed Navigation Steps:**

### **Step 1: Access Supabase Dashboard**
1. Open your web browser
2. Go to: **https://supabase.com/dashboard**
3. Sign in with your Supabase account (email + password)

### **Step 2: Find Your Project**
After signing in, you'll see a list of projects. Look for:
- **Project Name**: "Map" (or whatever you named your project)
- **Project URL**: Usually looks like `your-project-name.supabase.co`

**Click on your "Map" project** to open it.

### **Step 3: Navigate to Database Settings**
Once inside your project, look for the **left sidebar menu**. You should see:

```
📋 Project Overview
🔧 Settings  ← CLICK THIS
📊 Database
🔐 Authentication
📡 API
⚡ Edge Functions
```

**Click on "Settings"** in the left sidebar.

### **Step 4: Access Database Tab**
In the Settings section, you'll see tabs:
- **General**
- **Database** ← CLICK THIS ONE
- **API**
- **Auth**
- **Storage**

**Click on "Database"** tab.

### **Step 5: Find Connection String**
In the Database section, look for a field called:
- **"Connection String"** 
- **"Database URL"**
- **"Direct connection"**

You'll see something like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### **Step 6: Extract Information**
From that connection string, you need these parts:

**Example Connection String:**
```
postgresql://postgres:mypassword123@db.abcdefghijk.supabase.co:5432/postgres
```

**Extract these values:**
- **Host**: `db.abcdefghijk.supabase.co` (everything between `@` and `:5432`)
- **Port**: `5432` (the number after the colon)
- **Database**: `postgres` (after the last slash)
- **User**: `postgres` (after `postgresql://`)
- **Password**: `mypassword123` (between `:` and `@`)

## 🔍 **What You Should See:**

### **Dashboard Layout:**
```
┌─ Supabase Dashboard ─┐
│                      │
│  Your Projects       │
│  📍 Map (current)    │
│                      │
└──────────────────────┘

┌─ Project Dashboard ─┐
│                     │
│  🔧 Settings        │ ← Click this
│                     │
│  [Database]         │ ← Then click this tab
│                     │
└─────────────────────┘
```

### **Database Settings Section:**
```
Database Settings
├─ Connection String: postgresql://postgres:***@db.abc123.supabase.co:5432/postgres
├─ Host: db.abc123.supabase.co
├─ Port: 5432
└─ Database: postgres
```

## 🆘 **If You Don't See These Options:**

### **Check 1: Project Access**
- Make sure you're signed into the correct Supabase account
- Verify you have access to the "Map" project
- If you don't see "Map" project, you may need to create it first

### **Check 2: Left Sidebar**
The left sidebar should have these sections. If not, try:
- Refreshing the page (F5)
- Signing out and signing back in
- Make sure you're in a project (not on the main dashboard)

### **Check 3: Settings Location**
If you can't find "Settings":
- Look for a **gear icon** (⚙️) 
- Or a **hamburger menu** (☰) 
- Settings might be under a different name

## 📱 **Alternative Method: API Settings**

If Database section isn't visible, try:
1. Go to **Settings** → **API**
2. Look for "Project URL" or "Database URL"
3. It will show: `https://your-project.supabase.co`
4. Your database host would be: `db.your-project.supabase.co`

## ✏️ **Fill in Your .env File:**

Once you have the connection string, update `scripts/backup/.env`:

```env
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-actual-password
SUPABASE_DB_SSL=true
```

## 🎉 **Success Indicators:**

✅ You can see your project in the dashboard  
✅ You can access Settings → Database  
✅ You can find a connection string  
✅ You can extract host and password  

**Once you have these values, your backup system will work perfectly!** 🚀