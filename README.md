

# LUMINA

A highly optimized, multi-agent AI orchestration platform designed for real-time misinformation detection and automated fact-checking. Built with a premium, cinematic user interface and a robust backend that processes complex claims in seconds.

</div>

## 📖 Overview

The **LUMINA** engine serves as a digital forensic laboratory, simulating a "Courtroom" debate between specialized AI agents to arrive at an objective, well-researched verdict. By leveraging multiple Large Language Models (LLMs) and real-time data retrieval (Wikipedia and Live Web Search), the platform evaluates claims from multiple angles—acting as a Skeptic, Supporter, and Analyst—before a final Judge model synthesizes the findings.

This project was built to deliver rapid, high-confidence fact-checking within strict latency constraints, providing a complete end-to-end dashboard that supports batch processing, domain-specific research modes, and webhook integrations.

## ⚙️ Architecture & Workflow

The platform operates on a fast, parallelized workflow to ensure low-latency responses:

1. **Claim Intake:** A user submits a claim via the interactive **Courtroom Landing Page**, which seamlessly transitions into the Lumina Dashboard.
2. **Parallel Agent Invocation:** The Express backend triggers three distinct AI personas simultaneously:
   - 🛡️ **The Supporter:** Defends the claim, seeking validating evidence and official sources. (Powered by Meta Llama / Groq)
   - ⚖️ **The Skeptic:** Challenges the claim, looking for counter-evidence, logical fallacies, and dissenting views. (Powered by Meta Llama / Groq)
   - 📊 **The Analyst:** Objectively analyzes factual data, scientific consensus, and statistical evidence. (Powered by Google Gemini / OpenRouter)
3. **Data Retrieval & Processing:** Each agent fetches context using Wikipedia and live DuckDuckGo web searches. The raw data passes through an **Evidence Processing Engine**, which filters, scores (for credibility and relevance), and summarizes the sources.
4. **The Verdict:** Once the agents formulate their arguments (JSON), the **Judge** model (Google Gemini) evaluates the debate, resolves conflicts, and produces a final verdict (`TRUE`, `FALSE`, `MISLEADING`, or `UNVERIFIED`) alongside a confidence score and key evidence.
5. **Dashboard Rendering:** Results are sent back to the React UI, displaying a detailed breakdown of each agent's stance, source citations, and the final judicial summary.

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS 4, Framer Motion (for dynamic UI animations), Lucide React.
- **Backend:** Node.js, Express, TypeScript (`tsx`).
- **AI / Orchestration:** Google GenAI SDK, OpenAI SDK (compatible with Groq and OpenRouter).
- **Data Sources:** Wikipedia API, DuckDuckGo HTML Search.

## 💻 Run Locally

**Prerequisites:** Node.js 22+

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env.local
   ```
   *Required Keys:* `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The local dev server runs both the React frontend and the `/api/*` Express backend on the same port, ensuring API keys stay securely on the server.*

4. **Build & Production Preview:**
   ```bash
   npm run build
   npm run start
   ```

## 🛠️ Additional Commands

- **Run Linter:** `npm run lint`
- **Run Tests:** `npm test`
- **Clean Dist:** `npm run clean`

## 🧠 Core Features

- **Multi-Model Fallback:** The orchestrator smartly routes requests via Groq (Fastest), OpenRouter (Reliable), and Gemini Direct (Fallback) to ensure 100% uptime and rapid responses.
- **Premium Cinematic UI:** Features dark-mode aesthetics, glassmorphism, and fluid micro-animations for an immersive user experience.
- **Local History:** Completed verdicts are automatically saved locally in the browser, allowing users to restore recent claims directly from the history panel.
- **Test Mode:** Supports a bypass mode (`TEST_MODE=true` in `.env.local`) for instant simulated fact-checks without consuming API credits.
