# Supabase Email Templates - Manager Invitation

## ⚠️ Important: Set Up Custom SMTP First

Supabase's built-in email service has rate limits and is not meant for production apps.

### Configure Custom SMTP:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/xtkbvnnkovogqwcwdhkg
2. Navigate to: **Project Settings → Auth → SMTP Settings**
3. Toggle ON: **"Enable Custom SMTP"**
4. Fill in your SMTP credentials:
   - **Host**: smtp.gmail.com (or your email provider)
   - **Port**: 587 (TLS) or 465 (SSL)
   - **Username**: your-email@gmail.com
   - **Password**: your-app-password
   - **Sender email**: noreply@4x4vakantiebeurs.nl (or your domain)
   - **Sender name**: 4x4 Vakantiebeurs

### Recommended SMTP Providers:

- **Gmail**: Free (500 emails/day), simple setup with app password
- **SendGrid**: Free tier (100 emails/day), reliable
- **Mailgun**: Free tier (5,000 emails/month)
- **Amazon SES**: Very cheap, requires domain verification
- **Your hosting provider**: If you have a domain with email hosting

### Gmail Setup (Easiest):

1. Create a Google account or use existing one
2. Enable 2-factor authentication
3. Generate an App Password: https://myaccount.google.com/apppasswords
4. Use that app password in SMTP settings
5. Host: `smtp.gmail.com`, Port: `587`

---

## How to Update Email Templates

1. After setting up SMTP, go to: **Authentication → Email Templates**
2. Edit the two templates below

---

## 1. Confirm Signup Template

**When it's sent**: First email when a new manager is invited

### English Version

```
Subject: Verify your 4x4 Vakantiebeurs Manager Account

Hi,

You've been invited as a manager for the 4x4 Vakantiebeurs event platform.

This is a verification email - you can ignore this message.

You will receive a separate email with a password setup link to access the admin panel.

Best regards,
4x4 Vakantiebeurs Team
```

### Dutch Version

```
Subject: Verifieer je 4x4 Vakantiebeurs Manager Account

Hoi,

Je bent uitgenodigd als manager voor het 4x4 Vakantiebeurs event platform.

Dit is een verificatie email - je kunt dit bericht negeren.

Je ontvangt een aparte email met een wachtwoord instel link voor toegang tot het admin paneel.

Met vriendelijke groet,
4x4 Vakantiebeurs Team
```

---

## 2. Reset Password Template

**When it's sent**: Second email with the actual password setup link

### English Version

```
Subject: Set Your Password - 4x4 Vakantiebeurs Admin Access

Hi,

You've been invited as a manager for the 4x4 Vakantiebeurs event platform.

Click the link below to set your password and access the admin panel:

{{ .ConfirmationURL }}

This link expires in 24 hours.

After setting your password, you can log in at:
https://tomplan.github.io/Map/#/admin

Note: The link above will take you directly to the password reset page, then redirect to admin login.

Best regards,
4x4 Vakantiebeurs Team
```

### Dutch Version

```
Subject: Stel je Wachtwoord in - 4x4 Vakantiebeurs Admin Toegang

Hoi,

Je bent uitgenodigd als manager voor het 4x4 Vakantiebeurs event platform.

Klik op onderstaande link om je wachtwoord in te stellen en toegang te krijgen tot het admin paneel:

{{ .ConfirmationURL }}

Deze link verloopt over 24 uur.

Na het instellen van je wachtwoord kun je inloggen op:
https://tomplan.github.io/Map/#/admin

Let op: De bovenstaande link brengt je naar de wachtwoord reset pagina en stuurt je daarna door naar admin login.

Met vriendelijke groet,
4x4 Vakantiebeurs Team
```

---

## 3. Magic Link Template (Optional)

**When it's sent**: When existing managers use "Forgot Password" on login page

### English Version

```
Subject: Reset Your Password - 4x4 Vakantiebeurs Admin

Hi,

You requested a password reset for your 4x4 Vakantiebeurs manager account.

Click the link below to reset your password:

{{ .ConfirmationURL }}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

Best regards,
4x4 Vakantiebeurs Team
```

### Dutch Version

```
Subject: Reset je Wachtwoord - 4x4 Vakantiebeurs Admin

Hoi,

Je hebt een wachtwoord reset aangevraagd voor je 4x4 Vakantiebeurs manager account.

Klik op onderstaande link om je wachtwoord te resetten:

{{ .ConfirmationURL }}

Deze link verloopt over 1 uur.

Als je dit niet hebt aangevraagd, kun je deze email veilig negeren.

Met vriendelijke groet,
4x4 Vakantiebeurs Team
```

---

## Alternative: Disable Confirmation Email

If you want users to receive **only the password setup email** (not both emails):

1. Go to: **Authentication → Providers → Email**
2. Toggle OFF: **"Confirm email"**
3. Only the password reset email will be sent

---

## Important: How Email Links Work

### The `{{ .ConfirmationURL }}` Variable

- **What it is**: Supabase automatically generates this URL with a secure token
- **Where it goes**: Points to the URL specified in `redirectTo` parameter when calling `resetPasswordForEmail()`
- **Current setting**: Should be `https://tomplan.github.io/Map/#/reset-password`
- **What happens**: 
  1. User clicks link → Goes to `/reset-password` page with token in URL
  2. User sets new password → Automatically redirects to `/admin`
  3. User logs in with new password

### ⚠️ Current Supabase URL Configuration

**Site URL**: `https://tomplan.github.io/Map/.`

**Redirect URLs** (one per line):
```
https://tomplan.github.io/Map/#/reset-password
http://localhost:5173/Map/reset-password
```

### ⚠️ If Links Go to Wrong Page

If the email link sends users to `https://tomplan.github.io/Map/#` (home page instead of reset page):

**The Problem**: Site URL ends with `/.` but redirect URLs use `/#/` - this mismatch can cause issues.

**Fix in Supabase Dashboard:**
1. Go to: **Authentication → URL Configuration**
2. Update **"Site URL"** to: `https://tomplan.github.io/Map/#/` (add hash, remove trailing dot)
   - OR keep as: `https://tomplan.github.io/Map/` (no hash, no trailing dot)
3. Verify **"Redirect URLs"** includes:
   - `https://tomplan.github.io/Map/#/reset-password` (production)
   - `http://localhost:5173/Map/reset-password` (development)

**Note**: The Site URL should match the base of your redirect URLs. Since you're using HashRouter (`#/`), the Site URL should either:
- Include the hash: `https://tomplan.github.io/Map/#/`
- Or be just the base: `https://tomplan.github.io/Map/` (without trailing dot)

## Notes

- The `{{ .ConfirmationURL }}` variable is automatically replaced by Supabase with the actual link
- Supabase currently doesn't support bilingual templates - you must choose one language
- **Recommendation**: Use Dutch since it's a Dutch event and most managers will be Dutch-speaking
- Email templates cannot be changed via SQL - they must be updated through the Dashboard

---

## Testing Emails

After setting up custom SMTP:

1. Go to **Authentication → Users**
2. Click **"Invite user"** 
3. Enter a test email address
4. Check your inbox to verify emails are working
5. Verify the sender name shows as "4x4 Vakantiebeurs"

---

## Troubleshooting

**Emails not sending?**
- Check SMTP credentials are correct
- Verify port (587 for TLS, 465 for SSL)
- For Gmail: ensure App Password is used (not regular password)
- Check Supabase logs: **Project Settings → Logs → Auth Logs**

**Rate limit errors?**
- This means custom SMTP is not enabled
- Follow SMTP setup instructions above

**Wrong sender name/email?**
- Update in **Project Settings → Auth → SMTP Settings**
- Change "Sender email" and "Sender name" fields
