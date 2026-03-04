# ⚽ Futbolpedia — The Free Football Encyclopedia

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**Futbolpedia** is a comprehensive, Wikipedia-style football encyclopedia. It provides dynamic, real-time data about football teams, players, leagues, and the beautiful game's rich history. Built with a modern, clean interface, it offers fans a deep dive into the world of football.

![Futbolpedia Screenshot](assets/screenshot.png)

## ✨ Features

-   **🔍 Global Search**: Find your favorite teams and players instantly with a debounced, real-time search engine.
-   **🏆 Comprehensive League Coverage**: Detailed views for Premier League, La Liga, Serie A, Bundesliga, and more.
-   **👤 Detailed Player Profiles**: Full biographies, career statistics, and high-quality imagery.
-   **🛡️ Team Hubs**: View squad lists, upcoming fixtures, and recent results.
-   **📜 Football History**: Explore all-time top scorers and FIFA World Cup history.
-   **🌙 Modern UI/UX**: Premium design with smooth transitions and responsive layouts.
-   **🔌 Robust Backend**: An Express.js proxy server ensures API keys are never exposed and improves data reliability.

## 🛠️ Tech Stack

-   **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+).
-   **Backend**: Node.js, Express.js.
-   **API**: Powered by [TheSportsDB API](https://www.thesportsdb.com).
-   **Data**: Historical data curated from open sources.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   npm (included with Node)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/futbolpedia.git
    cd futbolpedia
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Copy the template file to `.env`:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and add your [TheSportsDB](https://www.patreon.com/thesportsdb) API key if you have a premium one. By default, it uses the test key `3`.

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```text
futbolpedia/
├── assets/             # App screenshots and media for README
├── backend/            # Express server and API routes
├── frontend/           # Static assets (HTML, CSS, JS)
├── .env.example        # Environment variable template
├── package.json        # Dependencies and scripts
└── README.md           # You are here!
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Made with ❤️ for football fans around the world.*
