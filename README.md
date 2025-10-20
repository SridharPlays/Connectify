# Connectify - A MERN Stack Real-Time Chat Application

**Connectify** is a powerful real-time messaging application built with a **React** frontend and a **MERN stack** backend (MongoDB, Express.js, React, Node.js). It features secure user authentication, live chat via Socket.io, online presence indicators, and a highly customizable theme system.

*Note: A separate mobile application built with React Native exists in another repository.*

![Project Status](https://img.shields.io/badge/status-active-brightgreen)

## ✨ Features

* **User Authentication**: Secure signup and login functionality using JWT & bcrypt.
* **Real-Time Messaging**: Instant one-on-one message delivery and updates using **Socket.io**.
* **Dynamic Theming**: Choose from **32 distinct themes** inspired by daisyUI to personalize your experience.
* **Profile Management**: View and update your profile information, including uploading a custom profile picture to Cloudinary.
* **Online Status**: See which users are currently online in real-time.
* **Message Deletion**: Soft-delete your own messages, which appear as "This message was deleted".
* **Responsive Design**: A modern frontend built with **React** and styled with **Tailwind CSS & daisyUI** that works on various screen sizes.

## 🛠️ Tech Stack

| Category   | Technology                                                              |
| :----------- | :---------------------------------------------------------------------- |
| **Backend** | Node.js, Express.js, Socket.io, MongoDB, Mongoose, JWT, Bcrypt, Cloudinary |
| **Frontend** | React, Tailwind CSS, daisyUI, Zustand (for state management), Axios     |
| **Database** | MongoDB (via MongoDB Atlas)                                             |
| **Deployment** | Render                                                                  |

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18.x or higher)
* npm or yarn
* MongoDB Connection URI (from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
* A Cloudinary account for image uploads.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/SridharPlays/Connectify.git](https://github.com/SridharPlays/Connectify.git)
    cd Connectify
    ```

2.  **Set up the Backend:**
    * Navigate to the `backend` directory: `cd backend`
    * Install dependencies: `npm install`
    * Create a `.env` file and add all the following variables:
        ```env
        PORT=5001
        MONGO_DB_URI=<Your_MongoDB_Connection_String>
        JWT_SECRET=<Your_JWT_Secret_Key>
        CLOUDINARY_CLOUD_NAME=<Your_Cloudinary_Cloud_Name>
        CLOUDINARY_API_KEY=<Your_Cloudinary_API_Key>
        CLOUDINARY_API_SECRET=<Your_Cloudinary_API_Secret>
        API_KEY=<Your_Deployment_URL>
        ```

3.  **Set up the Frontend:**
    * Navigate to the `frontend` directory: `cd ../frontend`
    * Install dependencies: `npm install`

4.  **Run the application:**
    * To start the backend server (from the `backend` folder):
        ```sh
        npm run dev
        ```
    * To start the frontend server (from the `frontend` folder):
        ```sh
        npm run dev
        ```

The application should now be running, typically at `http://localhost:3000`.

---

## 📜 Changelog

* **October 19, 2025:** Added a soft-delete feature for messages.
* **January 12, 2024:** Implemented a system with 32 customizable themes using daisyUI.
* **January 11, 2024:** Established core real-time chat functionality with Socket.io.

## 🔮 Future Updates

* A companion **[mobile application built with React Native](https://github.com/SridharPlays/Connectify-Mobile)** is also in development. Stay tuned for updates!