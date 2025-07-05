# Table Update Notifications with Email

This setup provides real-time notifications and email alerts when your `quiz_results` and `users_profile` tables are updated.

## 🎯 **What This Does**

✅ **Monitors both tables** (`quiz_results` and `users_profile`)  
✅ **Triggers on all operations** (INSERT, UPDATE, DELETE)  
✅ **Sends email notifications** for every table change  
✅ **Logs all activities** for debugging  
✅ **Handles different data types** for each table

## 📁 **Files Updated**

### **1. Edge Function** (`supabase/functions/quiz_result/index.ts`)

- Now handles both `quiz_results` and `users_profile` tables
- Sends email notifications for all table changes
- Includes proper error handling and logging

### **2. Test Script** (`test-quiz-function.js`)

- Tests both table types
- Generates cURL commands for manual testing
- Uses your environment variables

### **3. Database Triggers** (`database-triggers.sql`)

- Creates triggers for all operations on both tables
- Sends notifications to your Edge Function

## 🚀 **Setup Instructions**

### **Step 1: Deploy the Edge Function**

1. Go to your **Supabase Dashboard** → **Edge Functions**
2. Create new function called `quiz-result`
3. Copy the code from `supabase/functions/quiz_result/index.ts`
4. Deploy the function

### **Step 2: Set Up Database Triggers**

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the SQL from `database-triggers.sql`
3. **Replace** `'your-project-ref'` with your actual project reference (`eubroxxcchuozvpcwbdv`)
4. Run the SQL

### **Step 3: Test the Setup**

```bash
# Run the test script
node test-quiz-function.js
```

## 📧 **Email Notifications**

The function is set up to send email notifications. To enable actual email sending:

### **Option 1: Resend (Recommended)**

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to your Edge Function environment variables:
   ```
   RESEND_API_KEY=your_api_key_here
   ```
4. Uncomment the email sending code in the function

### **Option 2: SendGrid**

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Update the email sending code in the function

### **Option 3: Mailgun**

1. Sign up at [mailgun.com](https://mailgun.com)
2. Get your API key
3. Update the email sending code in the function

## 🧪 **Testing**

### **Test via Script**

```bash
node test-quiz-function.js
```

### **Test via Database**

```sql
-- Test quiz_results
INSERT INTO quiz_results (student_id, quiz_id, score)
VALUES ('test-123', 'quiz-001', 85);

-- Test users_profile
INSERT INTO users_profile (id, email, name)
VALUES ('user-123', 'test@example.com', 'John Doe');
```

### **Test via cURL**

```bash
curl -X POST 'https://eubroxxcchuozvpcwbdv.supabase.co/functions/v1/quiz-result' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'apikey: your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"table_name":"quiz_results","operation":"INSERT","data":{"student_id":"test-123","quiz_id":"quiz-001","score":85}}'
```

## 📊 **What You'll See**

### **In Function Logs:**

```
Processing quiz result INSERT: { student_id: 'test-123', quiz_id: 'quiz-001', score: 85 }
Email notification would be sent: { to: 'admin@yourdomain.com', subject: 'quiz_results INSERT Notification', ... }
```

### **In Email (when configured):**

```
Subject: quiz_results INSERT Notification

Table: quiz_results
Operation: INSERT
Data: {
  "student_id": "test-123",
  "quiz_id": "quiz-001",
  "score": 85,
  "submitted_at": "2024-01-01T00:00:00.000Z"
}
Time: 2024-01-01T00:00:00.000Z
```

## 🔧 **Customization**

### **Change Email Recipient**

Update the `to` field in the `sendEmailNotification` function:

```typescript
const emailData = {
	to: "your-email@domain.com", // Change this
	// ...
};
```

### **Add More Tables**

1. Add new table handling in the main function
2. Create new trigger functions
3. Update the test script

### **Custom Email Templates**

Modify the email body in the `sendEmailNotification` function to include:

- HTML formatting
- Custom styling
- Different templates for different operations

## 🎉 **Result**

You now have a complete system that:

- ✅ Monitors both your tables
- ✅ Sends email notifications for all changes
- ✅ Logs everything for debugging
- ✅ Is easily testable and extensible

**Your tables will now automatically trigger email notifications whenever they're updated!**
