# 📧 Email Notifications Setup Guide

## Overview

This guide will help you set up email notifications for your QuizMaster application. When students complete quizzes or user profiles are updated, you'll receive email notifications via Resend API.

## 🚀 Quick Setup

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key (starts with `re_`)

### 2. Set Environment Variable in Supabase

1. Go to your Supabase Dashboard
2. Navigate to Settings → Edge Functions
3. Add environment variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (e.g., `re_1234567890...`)

### 3. Deploy Edge Function

```bash
# Navigate to your project directory
cd QuizMaster-main

# Deploy the table-notifications function
npx supabase functions deploy table-notifications
```

### 4. Set Up Database Triggers

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `database-triggers-updated.sql`
3. Make sure to replace the project reference in the URL

## 📋 What Gets Notified

### Quiz Results

- **When**: Student completes a quiz
- **What**: Score, total questions, percentage, timestamp
- **Email**: Sent to admin email

### User Profile Updates

- **When**: User profile is created/updated
- **What**: User ID, name, email, update timestamp
- **Email**: Sent to admin email

## 🧪 Testing the System

### Method 1: Use the Test Script

```bash
# Run the test script
node test-table-notifications.js
```

### Method 2: Manual Database Test

1. Go to Supabase Dashboard → Table Editor
2. Navigate to `quiz_results` table
3. Insert a test record:

```sql
INSERT INTO quiz_results (student_id, score, total_questions, timestamp)
VALUES ('test-student', 85, 100, NOW());
```

### Method 3: Complete a Quiz

1. Start your development server
2. Log in and take a quiz
3. Check your email for notifications

## 📧 Email Templates

### Quiz Result Email

```
Subject: Quiz Result INSERT - [student_id]

Content:
- Student ID
- Score (e.g., 85/100)
- Percentage (85%)
- Submission timestamp
```

### User Profile Email

```
Subject: User Profile UPDATE - [user_name]

Content:
- User ID
- Name
- Email
- Update timestamp
```

## 🔧 Troubleshooting

### Common Issues

1. **No emails received**

   - Check Resend API key is set correctly
   - Verify Edge Function is deployed
   - Check Supabase logs for errors

2. **Edge Function errors**

   - Check environment variables
   - Verify function URL in triggers
   - Check function logs in Supabase

3. **Database trigger errors**
   - Verify trigger function exists
   - Check table names match
   - Ensure proper permissions

### Debug Steps

1. **Check Edge Function Logs**

   ```bash
   npx supabase functions logs table-notifications
   ```

2. **Test Function Directly**

   ```bash
   curl -X POST 'https://your-project.functions.supabase.co/table-notifications' \
     -H 'Authorization: Bearer your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{"table_name":"quiz_results","operation":"INSERT","data":{"student_id":"test","score":85,"total_questions":100,"timestamp":"2024-01-15T12:00:00Z"}}'
   ```

3. **Verify Database Triggers**
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name LIKE '%quiz_results%'
   OR trigger_name LIKE '%users_profile%';
   ```

## 📊 Monitoring

### Check Email Delivery

- Resend Dashboard → Activity
- View sent emails and delivery status

### Monitor Function Calls

- Supabase Dashboard → Edge Functions
- View function logs and execution times

### Database Activity

- Supabase Dashboard → Logs
- Monitor table changes and trigger executions

## 🔒 Security Notes

1. **API Key Security**

   - Never commit API keys to version control
   - Use environment variables in Supabase
   - Rotate keys regularly

2. **Email Privacy**

   - Only send to verified admin email
   - Don't include sensitive data in emails
   - Consider data retention policies

3. **Rate Limiting**
   - Resend has rate limits (100 emails/day free)
   - Monitor usage to avoid hitting limits

## 📈 Advanced Configuration

### Custom Email Templates

Edit the HTML templates in `supabase/functions/table-notifications/index.ts`:

```typescript
// Quiz result template
htmlContent = `
  <div style="font-family: Arial, sans-serif;">
    <h2>Quiz Result</h2>
    <p>Student: ${quizData.student_id}</p>
    <p>Score: ${quizData.score}/${quizData.total_questions}</p>
  </div>
`;
```

### Multiple Recipients

Update the email recipients in the function:

```typescript
to: [
  "admin@example.com",
  "teacher@example.com"
],
```

### Conditional Notifications

Add logic to only send emails for certain conditions:

```typescript
// Only send for high scores
if (quizData.score >= 90) {
	await sendEmailNotification(update);
}
```

## ✅ Verification Checklist

- [ ] Resend API key configured
- [ ] Edge Function deployed
- [ ] Database triggers created
- [ ] Test email sent successfully
- [ ] Quiz completion triggers email
- [ ] User profile update triggers email
- [ ] Error handling working
- [ ] Logs accessible

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase and Resend documentation
3. Check function logs for specific error messages
4. Verify all environment variables are set correctly
