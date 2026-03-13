# 🚗 compaRide - AI-Powered Rideshare Aggregator MVP

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

An intelligent rideshare aggregator prototype that compares options from platforms like Uber, Cabify, and Bolt. Built as a Minimum Viable Product (MVP) to demonstrate UI/UX flows, dynamic data generation via AI, and complex frontend state management.

## 🧠 The Engineering Challenge & Solution

**The Problem:** Major rideshare companies heavily restrict their public APIs, making it difficult to build a real-time aggregator without enterprise partnerships. 

**The Solution:** Instead of being blocked by API restrictions, I designed an **Adapter Architecture** for the frontend. For this MVP, the backend services are mocked and powered by **Google's Gemini 3 Flash Preview AI**. The AI processes the user's constraints (origin, destination, max price, max wait time) and dynamically generates realistic payload responses, simulating how a real aggregator backend would normalize data from different providers.

## ✨ Key Features

* **AI-Powered Mock Backend:** Uses `@google/genai` to generate dynamic, realistic ride options that strictly respect user-defined constraints (price and time filters).
* **Dynamic Canvas Map:** Implements an HTML5 `<canvas>` to simulate a live city grid. The map dynamically draws paths and animates the vehicle's trajectory based on the selected service provider (Black for Uber, Purple for Cabify, Green for Bolt).
* **State Machine Implementation:** Manages complex asynchronous UI states (idle -> searching -> connecting -> arriving -> in_progress -> completed) with smooth timeouts and React state hooks.
* **Modern UI/UX:** Clean, intuitive interface inspired by leading mobility apps, fully styled with Tailwind CSS, Lucide Icons, and Framer Motion.

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite
* **Styling & UI:** Tailwind CSS, Lucide React, Motion
* **AI Integration:** Google Gemini API (`gemini-3-flash-preview` model)

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/almaramirez5/compaRide.git](https://github.com/almaramirez5/compaRide.git)

2. Navigate to the project directory
    cd compaRide

3. Install dependencies
    npm install

4. Set up your environment variables:
    Create a .env file in the root directory.
    Add your Google Gemini API key:
    VITE_GEMINI_API_KEY="your_api_key_here"

5. Start the development server:
    npm run dev


## 📈 Future Scalability
In a production environment, the AI mock generator would be replaced by Node.js/FastAPI microservices connecting to official APIs or web scrapers via a standard interface, maintaining the exact same frontend architecture.


Developed as part of a portfolio project by a final-year Computer Engineering student.