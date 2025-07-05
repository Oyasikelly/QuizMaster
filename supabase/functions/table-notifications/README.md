# Table Notifications Edge Function

This Edge Function handles real-time notifications for table changes in your Supabase database.

## 🎯 **What It Does**

- **Monitors multiple tables**: `quiz_results` and `users_profile`
- **Handles all operations**: INSERT, UPDATE, DELETE
- **Sends email notifications** for every table change
- **Logs all activities** for debugging

## 📁 **Function Structure**

```
supabase/functions/table-notifications/
├── index.ts          # Main function handler
├── deno.json         # Deno configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## 🚀 **Deployment**

### Via Supabase Dashboard:

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Create new function called `table-notifications`
3. Copy the code from `index.ts`
4. Deploy

### Via CLI (if available):

```bash
supabase functions deploy table-notifications
```

## 🧪 **Testing**

Use the test script in the root directory:

```bash
node test-table-notifications.js
```

## 📧 **Email Notifications**

The function is configured to send email notifications. To enable actual email sending:

1. **Choose an email service** (Resend, SendGrid, Mailgun, etc.)
2. **Get your API key**
3. **Add it to environment variables**
4. **Uncomment the email sending code** in the function

## 🔧 **Configuration**

### Environment Variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `RESEND_API_KEY`: (Optional) For email notifications

### Supported Tables:

- `quiz_results`: Quiz submission data
- `users_profile`: User profile information

## 📊 **Logs**

Check function logs in:

- **Supabase Dashboard** → **Edge Functions** → **Logs**
- Or use the test script to see responses

## 🎉 **Result**

Your tables will now automatically:

- ✅ Send notifications for all changes
- ✅ Log activities for debugging
- ✅ Send email alerts (when configured)
- ✅ Handle multiple table types
