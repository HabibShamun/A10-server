
# EcoTrack Backend — MongoDB




## OverView
The EcoTrack Backend powers the entire platform with a robust RESTful API built on Express.js and MongoDB.
It handles user management, challenge tracking, analytics, eco tips, and events — all with a privacy-first design and scalable architecture


## Live Demo Link : https://ecotrack-server-six.vercel.app/
## ScreenShot: https://i.postimg.cc/Pr1kZ6x4/image.png
## Tech Stack
- Backend Framework: Express.js
- Database: MongoDB
- Authentication: JWT / Firebase (jwt will be integrated later)
- Hosting: Vercel
- Environment Management: dotenv




## Features
- User Management: Create, update, and delete users with email-based lookup and duplicate prevention.
- Challenge Engine: APIs for creating, joining, tracking, and summarizing challenge progress.
- Summary Analytics: Real-time aggregation of user activity, challenge status, and average progress.
- Tips & Events API: Endpoints for posting and retrieving eco tips and upcoming events.
- Privacy-First Design: Minimal data collection with secure endpoints and scalable architecture.




## Dependency
Main dependencies used in this backend:
- express
- mongodb
- cors
- dotenv
- 



## Installation
Follow these steps to run the backend locally:
- Clone the repository
git clone git@github.com:HabibShamun/A10-server.gitt
cd ecotrack-backend:
- Install dependencies:
npm install
- Set up environment variables:
Create a .env file in the root directory and add:
PORT=5000,
MONGO_URI=your_mongodb_connection_string,
- Run the server:
npm run dev
- Test the API
Visit http://localhost:5000/api or use Postman/Insomnia to test endpoints.



