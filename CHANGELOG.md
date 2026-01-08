# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
 
## [0.1.0] - 2025-10-11
  
### Added
 - Initial Version. Contains the basic jacki UI and a temporary localhost database.
### Changed
  
- None
 
### Fixed
 
- None
 
## [0.2.0] - 2025-10-16
 
### Added
- post.js // functions to post and read posts
- comment.js // functions to post and read comments
- comment.jsx // display of comments
- comment.css // display of comments
- service.js // main replacement of LearnService.js
- .env // keys to database
- utils.js // header sanitizer


### Changed
- Components.js // better routing
- Profile.jsx // much better profile display from the database
- App.js // better main
- Postcard.jsx // better display from database data
- Createpost.jsx // now able to post data to database
 
### Fixed
- Profile.jsx // now able to see all database data
- Main.js //  now able to see all posts

## [0.3.0] - 2025-11-07

### Added
- user authentication
- protected routes
- 3 layer post
 

## [0.4.0] - 2025-11-07

### Added
- **Real-time Messaging:** A private messaging system to chat with other users.
- **Dynamic Post Filtering:** A search bar on the main page to filter posts by topic, caption, or author in real-time.
- **AI-Powered Topic Summarization:** Utilizes the `deepseek-ai/DeepSeek-V3.2` model from Hugging Face to automatically generate summaries and find relevant links for post topics.
- **3-Layer Post System:** A unique system that encourages deeper engagement with content, including posts, comments, and interactive quizzes.

### Changed
- **Messaging UI:** Improved the styling of the messaging window with a background and a more polished dropdown widget.
- **README.md:** Updated the README with detailed project information, including features, AI integration, and setup instructions.

### Fixed
- **Logout:** Corrected an issue where user session cookies were not being cleared on logout.
- **Search Bar:** Addressed styling and functionality issues to ensure the search bar is responsive and user-friendly.