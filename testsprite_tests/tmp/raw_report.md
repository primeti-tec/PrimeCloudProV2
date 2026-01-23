
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** PrimeCloudProV2
- **Date:** 2026-01-23
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 User Registration and Login Success
- **Test Code:** [TC001_User_Registration_and_Login_Success.py](./TC001_User_Registration_and_Login_Success.py)
- **Test Error:** The user registration attempts with valid credentials failed due to security validation errors preventing account creation. Consequently, login attempts with the same credentials failed as the user does not exist. The system does not currently allow successful registration and login with valid credentials using Clerk authentication under these conditions.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYY5NA7XZTPLyrfgIyPE4hKc:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/c14e0f52-3917-429e-a93c-7b5fe93800e3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 User Login Failure with Invalid Credentials
- **Test Code:** [TC002_User_Login_Failure_with_Invalid_Credentials.py](./TC002_User_Login_Failure_with_Invalid_Credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/c61e35b0-b442-4012-bb17-dded2d3e21b1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Multi-Tenant Account Creation With Branding
- **Test Code:** [TC003_Multi_Tenant_Account_Creation_With_Branding.py](./TC003_Multi_Tenant_Account_Creation_With_Branding.py)
- **Test Error:** Unable to proceed with tenant account creation due to missing interactive elements on the sign-up page. User registration and login are blocked. Please fix the registration form to enable tenant account creation and branding configuration.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYYWLmZLxzuSfL91EhcVqfOY:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYYWLmZLxzuSfL91EhcVqfOY:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYYWLmZLxzuSfL91EhcVqfOY:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYYWLmZLxzuSfL91EhcVqfOY:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYYWLmZLxzuSfL91EhcVqfOY:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/bd0e8a28-362b-4763-a286-14e2519d75a8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Custom Domain Configuration with DNS Verification
- **Test Code:** [TC004_Custom_Domain_Configuration_with_DNS_Verification.py](./TC004_Custom_Domain_Configuration_with_DNS_Verification.py)
- **Test Error:** Stopped testing due to registration form unresponsiveness and inability to create tenant admin account, which blocks proceeding with custom domain setup and DNS verification testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYV5QzJeacUG2UOPTGIA3kZP:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYV5QzJeacUG2UOPTGIA3kZP:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYV5QzJeacUG2UOPTGIA3kZP:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYV5QzJeacUG2UOPTGIA3kZP:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYV5QzJeacUG2UOPTGIA3kZP:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/3048e2b7-fa41-4f03-bdfd-c1c0aecc988f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Bucket CRUD Operations with Versioning and Lifecycle Policies
- **Test Code:** [TC005_Bucket_CRUD_Operations_with_Versioning_and_Lifecycle_Policies.py](./TC005_Bucket_CRUD_Operations_with_Versioning_and_Lifecycle_Policies.py)
- **Test Error:** Unable to proceed with bucket management testing due to failure in user registration. The registration process triggers security validation errors and results in a blank page, preventing creation of a valid tenant user account. Please resolve the registration issue to continue testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYTX3r63f7HnBOFD3axpzPZ5:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/f85689b1-c8a9-476a-bfba-68ac704071b2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Access Key Management: Creation, Rotation, Revocation, and Permissions
- **Test Code:** [TC006_Access_Key_Management_Creation_Rotation_Revocation_and_Permissions.py](./TC006_Access_Key_Management_Creation_Rotation_Revocation_and_Permissions.py)
- **Test Error:** User registration is blocked by security validation errors on the sign-up page, preventing login or creation of a user with access key management rights. Unable to proceed with testing creation, rotation, revocation, and permission changes of S3-compatible access keys. Recommend addressing the registration issue before retrying tests.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHspbIBSu59DP96UdLj7x1G:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHspbIBSu59DP96UdLj7x1G:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHspbIBSu59DP96UdLj7x1G:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHspbIBSu59DP96UdLj7x1G:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHspbIBSu59DP96UdLj7x1G:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/2a006374-4411-478a-b736-dd4b0f3526cb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Team Member Invitation, Role Assignment, and Permission Controls
- **Test Code:** [TC007_Team_Member_Invitation_Role_Assignment_and_Permission_Controls.py](./TC007_Team_Member_Invitation_Role_Assignment_and_Permission_Controls.py)
- **Test Error:** Cannot proceed with the task because the sign-up process is blocked by security validation errors. Reporting this issue and stopping further actions.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGH9iqLkB6HFThoYkI3Y5hd:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGH9iqLkB6HFThoYkI3Y5hd:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGH9iqLkB6HFThoYkI3Y5hd:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGH9iqLkB6HFThoYkI3Y5hd:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGH9iqLkB6HFThoYkI3Y5hd:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/c7fbbd22-4993-486d-90db-09fda24dc89d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Billing Workflow: Plan Selection, Subscription, Invoice Generation and Payment
- **Test Code:** [TC008_Billing_Workflow_Plan_Selection_Subscription_Invoice_Generation_and_Payment.py](./TC008_Billing_Workflow_Plan_Selection_Subscription_Invoice_Generation_and_Payment.py)
- **Test Error:** Testing halted due to inability to create or log in with tenant billing manager account. Sign-up fails with security validation errors. Please resolve the sign-up issue or provide valid credentials to continue testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHMwUeGItcaABCKY8yM8o0V:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHMwUeGItcaABCKY8yM8o0V:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHMwUeGItcaABCKY8yM8o0V:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHMwUeGItcaABCKY8yM8o0V:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHMwUeGItcaABCKY8yM8o0V:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/780e96e6-5477-4c85-bb8f-0ff0d52a3c7e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Quota Request and Approval Workflow
- **Test Code:** [TC009_Quota_Request_and_Approval_Workflow.py](./TC009_Quota_Request_and_Approval_Workflow.py)
- **Test Error:** Testing stopped due to inability to register or login tenant user. Registration fails with security validation errors preventing further progress on quota increase request testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZJgWHw9mXwayNu2sH9ksPgM:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZJgWHw9mXwayNu2sH9ksPgM:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZJgWHw9mXwayNu2sH9ksPgM:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZJgWHw9mXwayNu2sH9ksPgM:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZJgWHw9mXwayNu2sH9ksPgM:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/ca6cef40-8e36-4ed1-8b6f-2340b2344bb2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 SFTP Credential Creation and Password Reset
- **Test Code:** [TC010_SFTP_Credential_Creation_and_Password_Reset.py](./TC010_SFTP_Credential_Creation_and_Password_Reset.py)
- **Test Error:** Testing cannot proceed because the sign-up process is blocked by security validation errors, preventing creation of a tenant user account. Please resolve this issue to enable further testing of SFTP credential creation, password reset, and event logging.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZJ0PDusLj5mnRUNh1VKblfs:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZJ0PDusLj5mnRUNh1VKblfs:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZJ0PDusLj5mnRUNh1VKblfs:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZJ0PDusLj5mnRUNh1VKblfs:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZJ0PDusLj5mnRUNh1VKblfs:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/6e90b8f9-ebe6-4a69-8732-ca0c8d98fd32
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Notification System Delivery and User Interaction
- **Test Code:** [TC011_Notification_System_Delivery_and_User_Interaction.py](./TC011_Notification_System_Delivery_and_User_Interaction.py)
- **Test Error:** The task to validate in-app notifications delivery, support for different types, and read/unread status updates could not be completed because no valid tenant user account could be created or logged into. Multiple attempts to log in with tenantuser@example.com failed due to user not found. Attempts to register new users failed due to security validation errors. Without a valid user session, it is impossible to trigger notifications, verify their appearance in the bell icon dropdown, mark them as read, or dismiss them. Please provide valid user credentials or fix registration issues to proceed with notification testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:5000/src/main.tsx?v=amp4Q91dlyVjjPlsoUG27:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZGLvB76yk9LQaHKNvWNphNc:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/6c66a31d-3627-496f-8aee-7674568b5dfb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Audit Logs Capture and Review by Authorized Users
- **Test Code:** [TC012_Audit_Logs_Capture_and_Review_by_Authorized_Users.py](./TC012_Audit_Logs_Capture_and_Review_by_Authorized_Users.py)
- **Test Error:** User registration is blocked by security validation errors, preventing creation of a user with audit permissions. Without valid user credentials, audit log testing cannot proceed. Reporting this issue and stopping the task.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZHmmUuSt4k9xJPn5QdMv1dX:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/3788bd2f-e6f5-4cd4-9be1-72c332bdb0e8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 White-label Customization Application in UI and Email Templates
- **Test Code:** [TC013_White_label_Customization_Application_in_UI_and_Email_Templates.py](./TC013_White_label_Customization_Application_in_UI_and_Email_Templates.py)
- **Test Error:** Cannot proceed with tenant-specific white-label configuration validation because tenant admin account registration is blocked by security validation errors. Please resolve this issue or provide valid tenant admin credentials to continue testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZEISBDq8KMzj5tP8AW0Rg7j:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZEISBDq8KMzj5tP8AW0Rg7j:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZEISBDq8KMzj5tP8AW0Rg7j:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZEISBDq8KMzj5tP8AW0Rg7j:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZEISBDq8KMzj5tP8AW0Rg7j:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/3e9140e3-468b-4aa5-b95f-8de40aa9dae4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 API Endpoint Response Time and Error Handling
- **Test Code:** [TC014_API_Endpoint_Response_Time_and_Error_Handling.py](./TC014_API_Endpoint_Response_Time_and_Error_Handling.py)
- **Test Error:** UI does not provide direct access to API testing interface or documentation. Proceeding to backend API testing using direct API calls for core operations as per task instructions.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZEkvEjSmyeOw4dbzWK1vLJj:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZEkvEjSmyeOw4dbzWK1vLJj:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZEkvEjSmyeOw4dbzWK1vLJj:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZEkvEjSmyeOw4dbzWK1vLJj:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/b0e3cb28-1e87-4d5e-9792-f88e8212b6bf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Role-based Access Control Enforcement and Tenant Isolation
- **Test Code:** [TC015_Role_based_Access_Control_Enforcement_and_Tenant_Isolation.py](./TC015_Role_based_Access_Control_Enforcement_and_Tenant_Isolation.py)
- **Test Error:** The role-based access control testing could not be completed because the tenant A user login failed with an error indicating the user was not found. This prevents verification of tenant data isolation and permission enforcement. The issue has been reported. Please ensure valid tenant user accounts exist to enable proper testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYfPrfEBN1Bg7T3MOiWMjGgp:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epYfPrfEBN1Bg7T3MOiWMjGgp:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epYfPrfEBN1Bg7T3MOiWMjGgp:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/797e81cb-ed3a-4b5d-aeba-4520543ecdf9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Frontend UI Workflow Validation for Dashboard, Team, Billing, and Storage
- **Test Code:** [TC016_Frontend_UI_Workflow_Validation_for_Dashboard_Team_Billing_and_Storage.py](./TC016_Frontend_UI_Workflow_Validation_for_Dashboard_Team_Billing_and_Storage.py)
- **Test Error:** Sign-in failure prevents access to dashboard and other UI components. Cannot proceed with UI workflow testing. Reporting issue and stopping further actions.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZUVOmdolW1e2g0mx9bpk09D:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epZUVOmdolW1e2g0mx9bpk09D:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epZUVOmdolW1e2g0mx9bpk09D:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/cdb852c8-8024-4863-a588-2aa7e23aa2c2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Security of Sensitive Data Storage and Transmission
- **Test Code:** [TC017_Security_of_Sensitive_Data_Storage_and_Transmission.py](./TC017_Security_of_Sensitive_Data_Storage_and_Transmission.py)
- **Test Error:** User creation attempts failed repeatedly due to security validation errors, preventing creation of valid user credentials. Without a valid user, testing secure storage and transmission of sensitive data cannot proceed. Please resolve user creation issues to enable full security testing.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ups?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbojo3o2H8cSfap3FXd3HpLG:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/56931919-694a-4374-85a2-4aca84037818
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Admin Dashboard Management and Quota Approvals
- **Test Code:** [TC018_Admin_Dashboard_Management_and_Quota_Approvals.py](./TC018_Admin_Dashboard_Management_and_Quota_Approvals.py)
- **Test Error:** Unable to proceed with super admin functionalities validation because the super admin login failed due to unrecognized email and no alternative credentials or recovery options are available. Cannot test tenant account management, product/pricing setup, or quota approvals without successful login. Task stopped as per instructions.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbnsNLIVHj0sBW9y9EQfml39:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbnsNLIVHj0sBW9y9EQfml39:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbnsNLIVHj0sBW9y9EQfml39:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbnsNLIVHj0sBW9y9EQfml39:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epbnsNLIVHj0sBW9y9EQfml39:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epbnsNLIVHj0sBW9y9EQfml39:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/b22d2d4c-965b-4bf8-91b2-2071ed9c88c6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 System Stability and Performance Under Load
- **Test Code:** [TC019_System_Stability_and_Performance_Under_Load.py](./TC019_System_Stability_and_Performance_Under_Load.py)
- **Test Error:** Performance testing cannot proceed due to missing test endpoints and navigation issues. Reported the website issues and stopped further actions.
Browser Console Logs:
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epd3UBXtFbAgCHTN0MrI6SNpP:0:0)
[ERROR] Failed to load resource: the server responded with a status of 422 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/client/sign_ins?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&__clerk_db_jwt=dvb_38epd3UBXtFbAgCHTN0MrI6SNpP:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epd3UBXtFbAgCHTN0MrI6SNpP:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epd3UBXtFbAgCHTN0MrI6SNpP:0:0)
[WARNING] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (at https://fond-gobbler-62.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js:18:7047)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fond-gobbler-62.clerk.accounts.dev/v1/environment?__clerk_api_version=2025-11-10&_clerk_js_version=5.121.0&_method=PATCH&__clerk_db_jwt=dvb_38epd3UBXtFbAgCHTN0MrI6SNpP:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/144232a4-bb2a-4c7f-a400-cc4e856b307c/70cb0217-8bf8-4866-b1fe-beccb23ccfb7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **5.26** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---