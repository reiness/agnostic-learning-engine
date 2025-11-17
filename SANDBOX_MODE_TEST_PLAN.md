# Sandbox Mode Test Plan

## 1. Strategy

To facilitate robust error handling tests without modifying production code, we will introduce a "sandbox mode". This mode allows simulating specific backend behaviors, such as a "503 Service Unavailable" error from the Gemini API.

The core of this strategy is an environment variable, `VITE_SANDBOX_MODE`. When this variable is set to `true`, the application will operate in sandbox mode.

In this mode, the `generateLesson-background` function will inspect the module title for special keywords (e.g., "TEST_ERROR_503"). If a recognized keyword is detected, the function will simulate the corresponding behavior (e.g., return a 503 error) instead of making a real call to the Gemini API.

This approach effectively isolates testing logic from production code. The sandbox behavior is only active when explicitly enabled via the environment variable and triggered by specific test inputs, ensuring that the production code path remains unaffected.

## 2. Implementation Steps

### Modifying `netlify/functions/generateLesson-background.js`

1.  **Read Environment Variable**: Access the `VITE_SANDBOX_MODE` environment variable within the function using `process.env.VITE_SANDBOX_MODE`.
2.  **Implement Conditional Logic**:
    *   Check if `VITE_SANDBOX_MODE` is set to `'true'`.
    *   If it is, check if the `moduleTitle` contains a specific keyword (e.g., "TEST_ERROR_503").
    *   If a keyword is found, bypass the Gemini API call and immediately return a simulated error response. For "TEST_ERROR_503", this would be a response with a 503 status code and a corresponding error message.
    *   If no keyword is found, or if sandbox mode is disabled, the function should proceed with the normal execution path.

### Environment Variable Configuration

*   **Local Development**: Add `VITE_SANDBOX_MODE=true` to the `.env.local` file to enable sandbox mode for local testing.
*   **Netlify Deployment Previews**: Configure the `VITE_SANDBOX_MODE` environment variable in the Netlify UI under "Site settings" > "Build & deploy" > "Environment". Set its value to `true` for "Deploy Previews" and "Branch Deploys" contexts. Ensure it is **not** set for the "Production" context.

### Manual Frontend Testing

1.  Ensure `VITE_SANDBOX_MODE=true` is active in your environment.
2.  Navigate to the course creation or module addition section of the application.
3.  Enter a module title that includes the test keyword, for example: "Introduction to Photosynthesis TEST_ERROR_503".
4.  Submit the form to trigger the `generateLesson-background` function.

### Expected Outcome

Upon triggering the test, the frontend should behave as follows:
*   The loading spinner, indicating lesson generation, should stop.
*   An alert or notification should appear, displaying the simulated error message (e.g., "Error: Service Unavailable (503)").

## 3. Security and Cleanup

### Security
It is critical that the sandbox mode is **never** enabled in the production environment. The `VITE_SANDBOX_MODE` environment variable must not be set in the production context in Netlify. This ensures that the testing logic can never be accidentally triggered by a user in the live application.

### Cleanup
No cleanup is required after testing. The sandbox logic is a permanent part of the `generateLesson-background` function but remains dormant and inactive in the production environment where `VITE_SANDBOX_MODE` is not set. This allows for repeatable and consistent testing without the need to modify or clean up code after each test run.