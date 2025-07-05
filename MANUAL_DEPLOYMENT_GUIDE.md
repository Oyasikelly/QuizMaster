# 📧 Manual Edge Function Deployment Guide

## Updated Email Content Features

The updated Edge Function now includes:

✅ **User Names in Email Notifications**

- Fetches user name from `users_profile` table
- Shows "Unknown User" if name not found
- Enhanced email template with emojis and better formatting

✅ **Improved Email Design**

- Professional HTML layout
- Performance summary section
- Better visual hierarchy
- Emoji icons for better readability

## 🔧 Manual Deployment Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**

   - Visit: https://supabase.com/dashboard
   - Select your project: `eubroxxcchuozvpcwbdv`

2. **Navigate to Edge Functions**

   - Click on "Edge Functions" in the left sidebar
   - Find the `table-notifications` function

3. **Update the Function**

   - Click "Edit" or "Update"
   - Replace the content with the updated code from:
     `supabase/functions/table-notifications/index.ts`

4. **Deploy**
   - Click "Deploy" or "Save"
   - Wait for deployment to complete

### Option 2: Supabase CLI (Alternative)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the function
supabase functions deploy table-notifications --project-ref eubroxxcchuozvpcwbdv
```

## 🧪 Testing the Updated Function

1. **Run the test script:**

   ```bash
   node test-updated-email.js
   ```

2. **Check your email** for the updated notification with:
   - User name (if found in database)
   - Enhanced formatting
   - Performance summary
   - Better visual design

## 📧 What the Updated Email Looks Like

**Subject:** `Quiz Result INSERT - [User Name]`

**Content includes:**

- 👤 Student Name: [User's actual name]
- 🆔 Student ID: [User ID]
- 📊 Score: [Score]/[Total Questions]
- 📈 Percentage: [Percentage]%
- ⏰ Submitted: [Timestamp]
- 📋 Performance Summary section

## 🔍 Troubleshooting

### If user name shows "Unknown User":

1. Check if the user exists in `users_profile` table
2. Verify the `student_id` matches the user's `id` in the profile table
3. Check database permissions

### If email doesn't arrive:

1. Check spam/junk folder
2. Verify Resend API key is set correctly
3. Check Edge Function logs in Supabase dashboard

### If function deployment fails:

1. Check syntax errors in the TypeScript code
2. Verify all environment variables are set
3. Try deploying through the dashboard instead

## 📊 Expected Results

After successful deployment and testing, you should receive emails like:

```
🎯 Quiz Result INSERT

Student Details:
👤 Student Name: John Doe
🆔 Student ID: user-123
📊 Score: 92/100
📈 Percentage: 92%
⏰ Submitted: January 15, 2024 at 2:30 PM

📋 Performance Summary
John Doe completed a quiz with 92 correct answers out of 100 questions.
```

## 🎯 Next Steps

1. Deploy the updated function
2. Test with the provided script
3. Verify email notifications include user names
4. Customize further if needed (recipients, styling, etc.)
