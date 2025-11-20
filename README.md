
#  FarmAI – Smart Farming Assistant

FarmAI is a web-based platform built to help Indian farmers get reliable farming support in one place. The main idea is to combine day-to-day farming needs such as weather alerts, crop disease detection, market prices, and advisory information in a simple and easy-to-use interface.

Many digital tools exist today, but farmers often struggle with complicated apps or English-only interfaces. FarmAI tries to solve this by offering a clean design, multiple languages, and helpful features backed by AI and real-time data.

---

## ⭐ Features

* **OTP Login** using mobile number
* **User Profile** with farm location, crops, and preferred language
* **7-Day Weather Forecast** with real-time alerts
* **AI Crop Disease Detection** (image upload)
* **Market Price Tracking**
* **Crop Advisory & Soil Guidance**
* **AI Chatbot (Farmii)**
* **Multilingual Support** – English, Hindi, Marathi
* **Future Features**: Crop calendar, community forum, scheme finder, soil PDF summary, agri news

---

## 🛠 Tech Stack

**Frontend:** Next.js, React 
**Backend:** Node.js, Express, MongoDB, JWT
**ML Model:** Python 
**APIs:** Open-Meteo (weather)

---

## 📁 Project Structure

```
FarmAI/
│── app/               # Frontend (Next.js)
│── backend/           # Backend (Express)
│── ml/                # ML model
│── components/        # Reusable UI
│── public/            # Assets
│── uploads/           # User uploads
```

---

## 🚀 Run Locally

**1. Clone repo**

```
git clone https://github.com/your-username/FarmAI.git
cd FarmAI
```

**2. Install frontend**

```
npm install
```

**3. Install backend**

```
cd backend
npm install
```

**4. Add `.env`**

Frontend:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Backend:

```
JWT_SECRET=your_secret
MONGO_URL=mongodb://127.0.0.1:27017/farmAI
```

**5. Start backend**

```
cd backend
npm run dev
```

**6. Start frontend**

```
cd ..
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:5000](http://localhost:5000)

---


## 📜 License

Academic project.

 
