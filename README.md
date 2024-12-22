# Scriptorium ✍️💻

Scriptorium is an innovative online platform that enables users to write, execute, and share code in multiple programming languages in a secure and intuitive environment. 🚀

---

## Features 🌟

### User Authentication 🔒  
- **Sign up, log in, and log out** with a secure JWT setup. ✅  
- **Edit profile** including first and last name, email, profile picture, and phone number. 🖼️📧📱  

### Code Writing and Execution 🧑‍💻📜  
- **Syntax highlighting** for various programming languages (e.g., C, C++, Java, Python, JavaScript). 🎨  
- **Real-time code execution** with output displayed immediately. ⚡  
- **Standard input support** for testing programs requiring user input. ⌨️  
- **Error handling** for compile errors, runtime errors, and timeouts. 🚨  
- **Secure execution environment** using Docker to sandbox user code. 🛡️🐳  
- **Resource limits** on execution to prevent abuse (e.g., infinite loops, memory hogs). ⏳📉  

### Code Templates 📝📂  
- **Save code templates** with a title, explanation, and tags. 🏷️  
- **View and search templates** by title, tags, or content. 🔍  
- **Edit or delete templates** as needed. ✏️❌  
- **Fork templates** to create new versions with a notification indicating the fork. 🔄✨  

### Blog Posts 📰🖋️  
- **Create, edit, and delete blog posts** with links to code templates. 🌐  
- **Search and browse posts** by title, content, tags, or linked code templates. 🗂️  
- **Engage with posts** through comments, replies, and upvotes/downvotes. 💬⬆️⬇️  
- **View related blog posts** on code template pages. 🔗  

### Reporting and Administration 🚩🛠️  
- **Report inappropriate content** with additional explanations. 📝  
- **Sort content by report count** for easy moderation. 📊  
- **Hide inappropriate content** from users (visible only to authors with flags). 🚫👁️  

### User Experience 🎨🖥️  
- **Responsive design** for all devices (monitors, laptops, tablets, mobile). 📱💻🖥️  
- **Dark and light themes** toggle for better user comfort. 🌞🌙  
- **Intuitive navigation** with a single-page experience, front-end validations, and clean re-rendering. 🧭🔄  

---

## Technologies Used 🛠️  

### Backend 🔙  
- **Framework**: Next.js ⚡  
- **Database**: Prisma ORM with SQLite/PostgreSQL 🗄️  
- **API**: RESTful API 🔗  
- **Sandboxing**: Docker for secure code execution 🛡️🐳  

#### How Code Execution is Containerized and Isolated  
- Each code execution request spins up a **new Docker container** with a lightweight Linux image.  
- The container runs the requested code with **limited resources** (CPU, memory, and execution time) to prevent abuse or resource exhaustion.  
- **Network access is disabled** inside the containers to avoid security breaches or misuse.  
- The container is destroyed immediately after execution to prevent persistence of malicious or unintended data.  
- Standard input and output are piped to the container securely, enabling real-time input handling and output display.  

### Frontend 🎨  
- **Framework**: React ⚛️  
- **Styling**: TailwindCSS 🌈  
- **TypeScript**: Ensures type safety and clean code 🛡️📜  

### Deployment 🚀  
- **Docker**: Ensures security, portability, and scalability 🐳🔒  
- **Environment**: Ubuntu 22.04 with Node.js 20+ 🐧  

---

## License 📜  
This project is licensed under the MIT License. 🏛️  

---

## Acknowledgments 🤝  
- Made by **William Nhut Lam** and **Cynthia Zhou** 💡✨  
