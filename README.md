# Mental Health Dashboard

A comprehensive full-stack web application designed to help users track and analyze their daily emotional well-being. The application allows users to log mood scores, record qualitative notes about their mental state, and visualize trends over time. Key features include secure user authentication, a historical mood log, and an interactive dashboard for personal wellness insights.

---

## 🛠 Setup & Installation

This project uses [uv](https://docs.astral.sh/uv/) for modern dependency management and environment isolation.

### 1. Prerequisites

Ensure you have `uv` installed on your machine:

```bash
# Mac/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Project Initialization

Clone the repository and run the following command to create a virtual environment and install all dependencies:

```bash
uv sync
```

### 3. Development Setup

To ensure code quality and consistent formatting across the team, you must install the git pre-commit hooks. This will automatically run the linter (Ruff) every time you try to commit code.

```bash
uv run pre-commit install
```

### 4. Running the Development Server

To start the FastAPI backend with auto-reload enabled:

```bash
uv run dev
```

The API will be available at `http://127.0.0.1:8000`.

### 5. Interactive Documentation

Once the server is running, you can explore and test the API endpoints directly via Swagger UI:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **Redoc:** http://127.0.0.1:8000/redoc