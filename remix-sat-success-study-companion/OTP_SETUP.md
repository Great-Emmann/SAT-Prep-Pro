# SAT Prep Pro — six-digit password reset setup

The password reset UI uses a **six-digit one-time password (OTP)** instead of Firebase's default email action link. The code is delivered by Resend using the sender name **SAT Prep Pro**. It expires after **10 minutes**, may be guessed at most **5 times**, and cannot be reused. Requests are throttled per email and IP.

This feature is **not operational until the server secrets, a Firestore database, and an email sender are configured**. Do not put private keys into GitHub or client-side Vite environment variables.

## Prerequisites

- Firebase project that actually owns your Authentication users. It must have Email/Password authentication enabled.
- Cloud Firestore database with the Admin SDK's service account permitted to read/write the OTP collections. If your project uses a **named Firestore database**, provide its exact database ID in the environment variable below.
- A [Resend](https://resend.com/) API key and an email address at a domain you've verified with Resend. A branded display name **does not** change or replace the underlying sender email address; sending as your own domain requires verification.

## Vercel project settings

In **Vercel → Project → Settings → Environment Variables**, add these as server-only settings for the Production environment:

| Name | Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON for a service account from the Firebase project that owns your users (store as a secret; never commit) |
| `FIREBASE_FIRESTORE_DATABASE_ID` | Exact Firestore database ID, or `(default)` if your project uses the default database |
| `PASSWORD_RESET_OTP_SECRET` | Long random secret (at least 32 characters), used to HMAC the OTP before storage |
| `RESEND_API_KEY` | Private Resend email API key |
| `RESET_EMAIL_FROM` | Verified sending email address, e.g. `security@your-verified-domain.example` (email only; the code prepends the **SAT Prep Pro** sender name) |

The server requires Node.js **22 or later**. Redeploy the latest commit after configuring environment variables. Do not use the Firebase **web API key** instead of a service account: they are different credentials.

## Endpoints

- `POST /api/password-reset/request` with `{"email":"student@example.com"}`: sends a 6-digit code if the email exists. Returns the same success response for non-existing accounts and rate-limited requests to discourage account enumeration.
- `POST /api/password-reset/confirm` with `{"email":"student@example.com","code":"123456","newPassword":"new secret"}`: verifies the single-use code and updates the password via Firebase Admin SDK.

Do not store student passwords or expose the service account in your frontend.

## Firebase email branding

For Firebase's **other** automated emails (such as initial email verification), open **Firebase Console → Authentication → Templates** and adjust the sender name, subject, and email text. Set your project's **public-facing name** to `SAT Prep Pro` in the Firebase project settings so the default email subject does not display the student's email address as the app name.

These Firebase email settings cannot be updated by a GitHub commit.

## Manual verification checklist

1. Open the deployment and check that it builds successfully.
2. On **Sign In**, click **Forgot password?** and enter an existing Firebase account email.
3. Confirm an email is received **from SAT Prep Pro** (from your verified sender address) with a six-digit code. Never print OTP values in logs.
4. Check that a wrong code fails, the correct code succeeds once, and expired/reused codes fail.
5. Sign in with the new password. Confirm the old password no longer works.
6. Test that excessive requests and guesses are blocked.
7. Check that existing SAT practice, dashboard widgets, and AI endpoints still work.

**Important:** These tests have not been completed on the user's live Vercel deployment. Configuration and a successful redeployment are required.
