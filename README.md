<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f6f06f25-b842-4917-8084-c077b7f191dd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and set `GEMINI_API_KEY`, `GROQ_API_KEY`, and `OPENROUTER_API_KEY`
3. Run the app:
   `npm run dev`

The local dev server runs both the React app and the `/api/*` AI proxy so provider keys stay on the server.

Run checks with:
`npm run lint`
`npm test`
`npm run build`

Completed verdicts are saved locally in the browser so recent claims can be restored from the history panel.
