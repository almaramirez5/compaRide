# 🚗 compaRide - AI-Powered Rideshare Aggregator MVP

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

An intelligent rideshare aggregator prototype that compares options from platforms like Uber, Cabify, and Bolt. Built as a Minimum Viable Product (MVP) to demonstrate UI/UX flows, dynamic data generation via AI, and complex frontend state management.

## 🧠 The Engineering Challenge & Solution

**The Problem:** Major rideshare companies heavily restrict their public APIs, making it difficult to build a real-time aggregator without enterprise partnerships. 

**The Solution:** I designed an **Adapter Architecture** to decouple the UI from the data source. For this MVP, the backend services are powered by **Google's Gemini 3 Flash Preview AI**. The system processes user constraints (origin, destination, max price, max wait time) and utilizes **Structured Output (JSON)** to generate realistic, normalized payload responses, simulating a production-grade aggregator backend.

## ✨ Key Features

* **AI-Powered Mock Backend:** Leverages `@google/genai` with specific system instructions to ensure dynamic ride options always respect user-defined filters.
* **Dynamic Canvas Map:** Implements an HTML5 `<canvas>` API to simulate a live city grid. It draws paths and animates vehicle trajectories based on the selected provider's brand identity.
* **State Machine Implementation:** Manages complex asynchronous UI states (idle -> searching -> connecting -> arriving -> in_progress -> completed) using React hooks and Framer Motion for a fluid experience.
* **Modern UI/UX:** A mobile-first, clean interface styled with Tailwind CSS and Lucide Icons, focusing on scannability and accessibility.

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite
* **Styling & UI:** Tailwind CSS, Lucide React, Framer Motion
* **AI Integration:** Google Gemini API (`gemini-3-flash-preview` model)

## ⚠️ Technical Considerations (Post-MVP Roadmap)

To address production-grade requirements and the feedback regarding security and scalability, the following architectural improvements are planned:

* **API Security (The Proxy Pattern):** * *Current:* The Gemini API key is handled via client-side environment variables (`VITE_`). 
  * *Production Solution:* In a real-world scenario, I would implement a **Backend Proxy (Node.js/Express)**. The frontend would request data from my own server, which would then securely inject the API key and communicate with Google Gemini, preventing any exposure of secrets in the client-side bundle.

* **Robustness & Prompt Engineering:** * *Current:* Uses detailed system prompts to guide the AI.
  * *Production Solution:* To prevent "AI hallucinations" and ensure a 100% reliable UI, I would implement **Strict JSON Schema Enforcement** and a validation layer using **Zod**. This ensures the data structure matches the `RideOption` interface before it reaches the state.

* **Testing Strategy:** * *Current:* Manual testing of the search and filter flows.
  * *Production Solution:* Implementation of **Vitest** for critical business logic (price/time calculations) and **Playwright** for End-to-End (E2E) testing of the complete user journey, from searching to the "ride completed" state.

## 🚀 How to Run Locally

1. **Clone the repository:**

        git clone https://github.com/almaramirez5/compaRide.git

2. **Navigate to the project directory:**

        cd compaRide

3. **Install dependencies:**

        npm install

4. **Set up your environment variables:**
   Create a `.env` file in the root directory and add your Google Gemini API key:

        VITE_GEMINI_API_KEY="your_api_key_here"

5. **Start the development server:**

        npm run dev

## 📈 Future Scalability
In a production environment, the AI mock generator would be replaced by **Node.js/FastAPI microservices** connecting to official APIs or web scrapers via a standard interface. The frontend is already designed using an **Adapter Pattern**, meaning the UI components won't need any changes to consume real-time production data.

*Developed with 💙 as a portfolio project by a Computer Engineering student.*