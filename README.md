# MERN Stack Real-Time Chat Application

A simple, yet powerful real-time chat application built using the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.io for instant two-way communication.



## ✨ Features

* **User Authentication**: Secure signup and login functionality.
* **Real-Time Messaging**: Instant message delivery and updates using Socket.io.
* **One-on-One Chat**: Privately chat with other registered users.
* **Multiple Theme Options**: Light, dark, and other themes available through daisyUI.
* **Online Status**: See which users are currently online.
* **Message Deletion**: Users can delete their own messages (soft delete).
* **Responsive Design**: A clean and user-friendly interface that works on various screen sizes.

## 🛠️ Tech Stack

* **Frontend**: React.js, Tailwind CSS, **daisyUI**, Zustand (for state management)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (with Mongoose)
* **Real-Time Engine**: Socket.io
* **Authentication**: JSON Web Tokens (JWT) & bcrypt

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18.x or higher)
* npm or yarn
* MongoDB (local instance or a cloud URI from MongoDB Atlas)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/SridharPlays/Connectify.git](https://github.com/SridharPlays/Connectify.git)
    cd Connectify
    ```

2.  **Install backend dependencies:**
    ```sh
    cd backend
    npm install
    ```

3.  **Install frontend dependencies:**
    ```sh
    cd ../frontend
    npm install
    ```

4.  **Set up Environment Variables:**

    Create a `.env` file in the `backend` directory and add the following variables:
    ```env
    PORT=5000
    MONGO_DB_URI=<Your_MongoDB_Connection_String>
    JWT_SECRET=<Your_JWT_Secret_Key>
    ```

5.  **Run the application:**
    * To start the backend server: `cd backend && npm run dev`
    * To start the frontend development server: `cd frontend && npm run dev`

The application should now be running on `http://localhost:5001`.

---

## 📜 Changelog


* **Oct 19, 2025:**
    > Added Delete Message operation (soft delete). Users can now delete their messages, which will be marked as "This message was deleted" for all participants in the chat.

* **Jan 12, 2024:**
    > Added multiple theme options using the daisyUI component library for enhanced user customization.

* **Jan 11, 2024:**
    > Implemented basic message sending between users with real-time updates via Socket.io. Established core chat functionality.

## 🔮 Future Updates

* **Upcoming:** We are planning to develop and release a companion mobile application built with **React Native**. Stay tuned for updates!