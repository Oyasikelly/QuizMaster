# Supabase Edge Functions

This directory contains Edge Functions that run in the Deno runtime environment, not Node.js.

## ⚠️ TypeScript Errors Are Expected

The TypeScript errors you see in your IDE for files in this directory are **expected and normal**. This is because:

1. **Different Runtime**: These functions run in Deno, not Node.js
2. **Different Imports**: They use Deno-style imports (e.g., `https://deno.land/...`)
3. **Different Globals**: They use Deno globals like `Deno.env`

## ✅ Configuration

- `tsconfig.json` - TypeScript config for Deno environment
- `.vscode/settings.json` - VS Code settings to handle the different environments
- Main project `tsconfig.json` excludes this directory to avoid conflicts

## 🚀 Deployment

These functions are designed to be deployed to Supabase Edge Functions, where they will run in the correct Deno environment without any TypeScript errors.

## 📁 Structure

```
supabase/functions/
├── quiz_result/
│   ├── index.ts          # Edge Function handler
│   ├── README.md         # Function documentation
│   └── deno.json         # Deno configuration
└── tsconfig.json         # TypeScript config for Deno
```

## 🧪 Testing

Use the test script in the root directory (`test-quiz-function.js`) to test the functions without worrying about the TypeScript errors in your IDE.
