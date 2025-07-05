# Resend API Key Setup Guide for QuizMaster

This guide will help you set up email notifications using Resend when your `quiz_results` and `users_profile` tables are updated.

## Step 1: Get Your Resend API Key

### 1.1 Sign up for Resend

1. Go to [resend.com](https://resend.com)
2. Create an account
3. Verify your email address

### 1.2 Get Your API Key

1. In your Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name (e.g., "QuizMaster Notifications")
4. Copy the API key (it starts with `re_`)
5. **Important**: Save this key securely - you won't be able to see it again

### 1.3 Verify Your Domain (Optional but Recommended)

1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `yourdomain.com`)
3. Follow the DNS verification steps
4. Once verified, you can send emails from `noreply@yourdomain.com`

## Step 2: Add API Key to Supabase Environment Variables

### 2.1 Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Settings" → "Edge Functions"
3. Add a new environment variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)
4. Click "Save"

### 2.2 Using Supabase CLI (Alternative)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Set the environment variable
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

## Step 3: Update Email Configuration

### 3.1 Update the Edge Function

In `supabase/functions/table-notifications/index.ts`, update these lines:

```typescript
// Line 220: Replace with your verified domain
from: "QuizMaster <noreply@yourdomain.com>",

// Line 221: Replace with your admin email
to: ["admin@yourdomain.com"],
```

### 3.2 For Testing (Using Resend Sandbox)

If you haven't verified a domain yet, you can use Resend's sandbox domain:

```typescript
from: "QuizMaster <onboarding@resend.dev>",
to: ["your-email@example.com"], // Your email for testing
```

## Step 4: Deploy the Edge Function

### 4.1 Using Supabase CLI

```bash
# Deploy the function
supabase functions deploy table-notifications

# Or deploy all functions
supabase functions deploy
```

### 4.2 Verify Deployment

1. Go to your Supabase dashboard
2. Navigate to "Edge Functions"
3. Check that `table-notifications` is deployed and active

## Step 5: Test the Email Notifications

### 5.1 Test Quiz Results

1. Take a quiz in your application
2. Submit the quiz
3. Check your email for the notification

### 5.2 Test User Profile Updates

1. Update a user profile in your application
2. Check your email for the notification

### 5.3 Manual Testing

You can also test manually using the test script:

```bash
node test-table-notifications.js
```

## Step 6: Monitor and Troubleshoot

### 6.1 Check Function Logs

1. Go to Supabase dashboard
2. Navigate to "Edge Functions" → "table-notifications"
3. Click "Logs" to see function execution logs

### 6.2 Common Issues

#### Issue: "RESEND_API_KEY not found"

**Solution**: Make sure you've added the environment variable correctly in Supabase dashboard.

#### Issue: "Unauthorized" error from Resend

**Solution**: Check that your API key is correct and hasn't expired.

#### Issue: Emails not being sent

**Solution**:

1. Check the function logs for errors
2. Verify your domain is verified in Resend
3. Check your spam folder

#### Issue: "Invalid from address"

**Solution**: Use a verified domain or the sandbox domain (`onboarding@resend.dev`).

## Step 7: Customize Email Templates

### 7.1 Quiz Results Email

The current template includes:

- Student ID
- Quiz ID
- Score
- Submission timestamp

### 7.2 User Profile Email

The current template includes:

- User ID
- Name
- Email
- Update timestamp

### 7.3 Customizing Templates

Edit the `htmlContent` in the `sendEmailNotification` function to customize the email appearance.

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for all sensitive data**
3. **Rotate API keys regularly**
4. **Monitor email sending limits**
5. **Set up proper error handling**

## Email Limits and Pricing

- **Resend Free Tier**: 3,000 emails/month
- **Resend Pro**: $20/month for 50,000 emails
- **Check your usage** in the Resend dashboard

## Support

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Supabase Edge Functions**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **QuizMaster Issues**: Check your project's issue tracker

---

**Next Steps**: After setting up Resend, you'll receive email notifications whenever:

- A new quiz result is submitted
- A quiz result is updated
- A user profile is created/updated/deleted

The emails will be sent to the admin email address you configure in the Edge Function.
