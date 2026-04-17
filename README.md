# Appointly: AI-Powered Conversational Booking System

> A professional medical scheduling platform that replaces rigid forms with an empathetic, Gemini-powered chat experience.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Clerk Auth.
- **Backend**: Python Flask, Supabase Python SDK.
- **AI Infrastructure**: 
  - **Development Phase**: Claude 4.6 Sonnet (Systems design, code generation, and complex reasoning).
  - **Production Runtime**: Google Gemini 2.5 Flash (Conversational NLU and real-time processing).
- **Database**: Supabase (PostgreSQL).
- **Notifications**: SMTP/Email Integration for automated alerts.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Supabase Project & Clerk Application
- Google Gemini API Key (Production) 

### Backend Setup
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Configure `.env`: Copy `.env.example` to `.env` and fill in your keys.
6. Run the server: `python run.py`

### Frontend Setup
1. From the project root: `npm install`
2. Configure `.env`: Add your `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and Clerk keys.
3. Start the application: `npm run dev`

---

## Abstract

In this project, we aim at developing an appointment booking application via chat. Traditional booking systems demand filling of forms which consumes a lot of time on behalf of the users. To overcome this issue, this project has been developed. In the developed chat based appointment booking system, one can make an appointment easily through typing in conversation style.

When a person logs in to the system, he/she can give a message about booking appointments with specified dates, times, and reasons. The system identifies the message and asks the user for more information if any required detail is not provided. After collecting all relevant information, it asks the user for confirming booking. It instantly books the requested appointment if selected time slot is available.

Furthermore, email notification service is enabled in the system for all types of activities including booking, cancellation, and rescheduling both for user and administrator accounts. There is also an administrative dashboard where an administrator sees all appointments. The administrator can also delete bookings and block some time slots for any days. These blocked or booked slots cannot be chosen by the user at all.

It can be said that the above system makes appointment booking very easy.

---

## Part 2: Spec & Plan (AI-Assisted)

### 1. System Design (High-Level)
The application follows a modern cloud-native architecture:
- **Frontend**: A React application bootstrapped with Vite, using Tailwind CSS for a premium "Glassmorphism" UI and Framer Motion for micro-animations.
- **Backend**: A Python Flask REST API that handles session management, business logic, and integration with the LLM.
- **AI Engine**: Hybrid implementation leveraging **Claude 4.6 Sonnet** for the initial structural design and **Gemini 2.5 Flash** for fast, cost-effective runtime inference.
- **Database**: Supabase (PostgreSQL) stores structured data such as user profiles, appointment slots, and real-time availability.
- **Notification Layer**: Automated email triggers to notify users and admins of status changes.

### 2. Feature Breakdown
- **Conversational NLU**: Transforms "I want to see someone for a headache tomorrow at 2pm" into a structured booking request.
- **Adaptive Intent Parsing**: Recognizes if a user wants to book, reschedule, or cancel based on context.
- **Real-Time Slot Engine**: Automatically calculates overlapping slots and suggests the next available time if a conflict exists.
- **Admin Command Center**: A centralized dashboard for administrators to monitor bookings and manually override availability.
- **Context Persistence**: Maintains conversation history in the database so users can resume booking even after a page refresh.

### 3. Prompt Design
The core NLU logic utilizes a sophisticated **System Prompt** that enforces:
- **Strict JSON Output**: Ensuring the backend can reliably process intents and extracted entities (date, time, service).
- **Relative Date Handling**: Resolving terms like "next Tuesday" or "day after tomorrow" into valid ISO dates.
- **Entity Mapping**: Mapping vague user descriptions to one of 12 predefined medical services (e.g., "stomach ache" -> "Stomach & Digestive Issues").
- **State Management**: Identifying "missing_fields" to keep the conversation focused on completing the booking.

### 4. Data Model
| Table | Description |
| :--- | :--- |
| `profiles` | Stores user roles (user/admin) and basic contact info. |
| `services` | Defines clinic offerings with specific durations (default 30 mins). |
| `slots` | Tracks 30-minute time blocks, marking them as available, booked, or blocked. |
| `appointments` | The join table linking users, slots, and services with status tracking. |
| `context` | Stores the ongoing chat history and partially filled booking forms in JSONB format. |

### 5. Implementation Plan
1.  **Environment Setup**: Configured Supabase project and Flask boilerplate.
2.  **LLM Integration**: Developed the `llm_service` to handle prompt engineering and response cleaning.
3.  **Booking Logic**: Implemented `booking_service` to resolve conflicts and automate slot creation.
4.  **Frontend Chat UI**: Built a responsive sidebar-based interface with real-time intent-based UI feedback.
5.  **Admin UI & Email**: Finalized the administrative control panel and integrated SMTP for notifications.

---

## Part 3: Implementation (AI-Assisted)

### AI Model & Development
- **Development & Reasoning**: **Claude 4.6 Sonnet** (Primary logic designer)
    - Used for architecture design, complex algorithm implementation (stable slot allocation), and front-end layout optimization.
- **Production Runtime**: **Google Gemini 2.5 Flash**
    - **Speed**: Flash models provide the near-instant response times (~1s) required for a conversational UI.
    - **Reliability**: Exceptional at following strict JSON formatting instructions without "hallucinating" extra markdown.
    - **Context Window**: Allows for deep conversational history (resumes where the user left off) without performance degradation.
- **Development Environment**: 
    - **IDE**: Visual Studio Code.
    - **AI Assistant**: Developed using Claude Code (Advanced AI Coding Assistant).
- **Tokens Used**:
    - **Input Tokens**: ~1,200 per message (including system instructions + history).
    - **Output Tokens**: ~150 per message (compact JSON response).
    - **Estimated Total for a Booking**: ~4,000 - 6,000 tokens per user session.

---

## Part 4: Edge Cases

The system is engineered to handle multiple real-world complexities:
- **Sunday Requests**: Automatically identifies the weekend and politely informs the user that the clinic is closed.
- **Past Bookings**: Validates date/time against the current server time to prevent booking appointments in the past.
- **Ambiguous Service Name**: If a user says "I feel sick," the AI identifies the intent as `unclear` and asks for more specific symptoms to map it to a service.
- **Conflicts & Suggestions**: If a slot is taken by another user or blocked by the admin, the system calculates the nearest 30-minute availability and offers it to the user.
- **Intent Switching**: Users can switch from "booking" to "rescheduling" midway through the conversation, and the system resets the required fields accordingly.
