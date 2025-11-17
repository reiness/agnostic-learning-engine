# Error Handling Test Plan for `generateLesson-background`

This document outlines the testing strategy to verify the error handling for the `generateLesson-background` function, specifically simulating a "503 Service Unavailable" error from the Gemini API.

## 1. Strategy

The testing strategy involves temporarily modifying the `generateLesson-background` Netlify function to simulate an API failure. This will be triggered by using a special keyword in the module title when creating a new lesson.

-   **Trigger Keyword:** `TEST_ERROR_503`
-   **Behavior:** When the function detects this keyword in the `moduleTitle` of the request, it will bypass the actual call to the Gemini API and instead throw a simulated "503 Service Unavailable" error.
-   **Goal:** This allows us to test the frontend's error handling logic in isolation, ensuring it responds correctly to a backend failure without making a real, and potentially costly, API call.

## 2. Implementation Steps

### A. Modify `generateLesson-background.js`

1.  Open the file [`netlify/functions/generateLesson-background.js`](netlify/functions/generateLesson-background.js).
2.  At the beginning of the `handler` function, add a check for the trigger keyword in the `moduleTitle`.

    ```javascript
    // Existing code...
    exports.handler = async (event) => {
      // ... existing variable declarations

      const { courseId, moduleTitle, uid } = JSON.parse(event.body);

      // Add this block for error simulation
      if (moduleTitle.includes('TEST_ERROR_503')) {
        console.log('Simulating a 503 Service Unavailable error.');
        return {
          statusCode: 503,
          body: JSON.stringify({ error: 'Simulated Service Unavailable' }),
        };
      }

      // ... rest of the function
    };
    ```

### B. Manually Trigger the Test from the Frontend

1.  Run the application locally.
2.  Navigate to the course creation or course editing page.
3.  Create a new module for any course.
4.  Set the module title to **"Module with TEST_ERROR_503"**.
5.  Submit the form to generate the lesson.

### C. Expected Outcome

When the test is triggered, the frontend should exhibit the following behavior:

1.  The loading spinner that appears during lesson generation should disappear.
2.  An alert or notification should be displayed to the user with a message indicating that the lesson generation failed (e.g., "Error generating lesson: Simulated Service Unavailable").
3.  The application should remain stable and not get stuck in an infinite loading loop or crash.

## 3. Cleanup

After successfully verifying the frontend's error handling, it is crucial to remove the testing code to ensure it does not remain in the production environment.

1.  Open [`netlify/functions/generateLesson-background.js`](netlify/functions/generateLesson-background.js) again.
2.  Delete the error simulation code block that was added.

    ```javascript
    // REMOVE THIS BLOCK
    if (moduleTitle.includes('TEST_ERROR_503')) {
      console.log('Simulating a 503 Service Unavailable error.');
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'Simulated Service Unavailable' }),
      };
    }
    ```

3.  Save the file and deploy the updated function. This ensures that the error simulation logic is completely removed from the codebase.