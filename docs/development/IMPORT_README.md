# Import Subscriptions Script

This script imports company contact information and subscription data from an Excel file into the database.

## What It Does

1. **Updates Companies Table**: Imports contact, phone, and email fields to the `companies` table (these become the defaults)
2. **Updates Event Subscriptions**: Imports subscription-specific data like booth count, meals, coins, and notes for 2025
3. **Matches Companies**: Links Excel rows to database companies by name (case-insensitive)

## How to Run

### Step 1: Get Your JWT Token

1. Open the app in your browser and log in
2. Open DevTools (press F12 or Right-click → Inspect)
3. Go to: **Application** tab → **Local Storage** → `https://xtkbvnnkovogqwcwdhkg.supabase.co`
4. Find the key `supabase.auth.token`
5. Copy the `access_token` value (it's a long string starting with `eyJ...`)

### Step 2: Run the Import

**Option A: Using the helper script (recommended)**

```bash
./run-import.sh 'YOUR_JWT_TOKEN_HERE'
```

**Option B: Using environment variable**

```bash
SUPABASE_JWT_TOKEN='YOUR_JWT_TOKEN_HERE' node import-subscriptions-2025.js
```

**Option C: Edit the file directly**

1. Open `import-subscriptions-2025.js`
2. Replace `'REPLACE_WITH_YOUR_JWT_TOKEN'` on line 12 with your actual token
3. Run: `node import-subscriptions-2025.js`

## Excel File Format

The script expects an Excel file at:

```
/Users/tom/Downloads/lijst standhouders update 27-9-25.xlsx
```

### Required Columns

- **Bedrijfsnaam**: Company name (must match a company in the database)
- **Volledige naam**: Contact person name
- **telefoon nr**: Phone number
- **e-mail**: Email address
- **standplaatsen**: Number of booths
- **Munten**: Number of coins
- **opmerking**: Notes
- **BBQ**: Saturday BBQ meal count
- **Ontbijt**: Saturday breakfast count
- **Lunch**: Saturday lunch count

## Output

The script will show:

- ✓ Companies Updated: Count of companies that had contact info updated
- ✓ Subscriptions Updated: Count of subscriptions that had data updated
- ⊘ Skipped: Rows that had no data to update or no matching subscription
- ✗ Errors: Companies not found in database

## What Gets Updated

### Companies Table (Default Contact Info)

- Contact person name
- Phone number
- Email address

These become the **default** contact information shown in the Companies tab (green section).

### Event Subscriptions Table (Year-Specific Data)

- Contact, phone, email (overrides for this year)
- Booth count
- Area preference
- Meal counts (Saturday breakfast, lunch, BBQ)
- Coins
- Notes

This data is shown in the Event Subscriptions tab for 2025.

## Troubleshooting

### "JWT expired" error

Your authentication token has expired. Get a fresh token following Step 1 above.

### "Company not found in database"

The company name in Excel doesn't match any company in the database. Check:

- Spelling and capitalization (matching is case-insensitive)
- Extra spaces before/after the name
- Company exists in the Companies tab

### "No subscription found for 2025"

The company exists but isn't subscribed to 2025. The script will:

- ✓ Still update the company's contact info in the Companies table
- ⊘ Skip updating the event subscription

To fix: Subscribe the company to 2025 first in the Event Subscriptions tab.

## Database Schema

```
companies
├── id (primary key)
├── name
├── logo
├── website
├── info
├── contact  ← Default contact person
├── phone    ← Default phone
└── email    ← Default email

event_subscriptions
├── id (primary key)
├── company_id (foreign key → companies.id)
├── event_year
├── contact       ← Year-specific override
├── phone         ← Year-specific override
├── email         ← Year-specific override
├── booth_count
├── area
├── breakfast_sat
├── lunch_sat
├── bbq_sat
├── breakfast_sun
├── lunch_sun
├── coins
└── notes
```

## Notes

- Contact info in `companies` table is visible as defaults in the green "Manager-Only Info" section
- When subscribing a company to a new year, these defaults are automatically used
- Event-specific overrides can be set per year in the Event Subscriptions tab
