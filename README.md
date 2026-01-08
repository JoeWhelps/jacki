# jacki

"A jack of all trades is master of none...
but oftentimes better than the master of one"

Created by Joseph Whelpley and August Berchelmann.

<img width="2493" height="1364" alt="image" src="https://github.com/user-attachments/assets/eb45483d-a4f0-413d-a56f-5f8f471e37f2" />


## Features

*   **User Authentication:** Secure user registration, login, and logout functionality.
*   **Post Feed:** A main feed to view posts from other users.
*   **Real-time Messaging:** A private messaging system to chat with other users.
*   **Dynamic Post Filtering:** A search bar on the main page to filter posts by topic, caption, or author in real-time.
*   **AI-Powered Topic Summarization:** Utilizes the `deepseek-ai/DeepSeek-V3.2` model from Hugging Face to automatically generate summaries and find relevant links for post topics.
*   **3-Layer Post System:** A unique system that encourages deeper engagement with content.
    *   **Layer 1: The Post:** The main content, including a caption and an AI-generated topic summary.
    *   **Layer 2: Comments:** A traditional comment section for discussions.
    *   **Layer 3: Quizzes:** Users can create and take interactive quizzes related to the post's topic, adding a gamified learning experience.

## Getting Started

### Prerequisites

*   Node.js and npm installed.
*   A running Parse Server instance.
*   A Hugging Face API Key with 'read' permissions.

### Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```
    npm install
    ```
3.  Create a `.env` file in the root directory and add your Parse Server and Hugging Face credentials:
    ```
    REACT_APP_APPLICATION_ID=your_app_id
    REACT_APP_JAVASCRIPT_KEY=your_js_key
    REACT_APP_SERVER_URL=your_server_url
    REACT_APP_HF_TOKEN=your_hugging_face_token
    ```
4.  Start the development server:
    ```
    npm start
    ```
