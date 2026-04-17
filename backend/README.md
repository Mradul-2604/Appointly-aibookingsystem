# Fluid Concierge API Backend

This is the complete backend system for the AI-powered chat-based appointment booking application. It provides structured conversational data extraction via an LLM, secure endpoints via Supabase authentication, rate limiting, an orchestration database, and full API documentation.

## Running the Application

### 1. Prerequisites
- Python 3.11+
- Install dependencies: `pip install -r requirements.txt`
- Populate the variables in `.env` based on `.env.example`. Make sure you provision an active Supabase Postgres instance and a Gemini API Key.

### 2. Run the App
```bash
python run.py
```
> [!NOTE] 
> The application will automatically bind port 5000 unless defined otherwise in your `.env`.

---

## Architecture Insights
- **Authentication**: JWT validation uses Supabase Auth directly mapping incoming `Bearer` tokens via the `@require_auth` decorator. Role-based checks default to `user` but can escalate to `admin` across protected slots.
- **LLM Handling**: The `llm_service.py` connects with Gemini to orchestrate incoming requests securely matching strict prompts mapping intents: *book, reschedule, cancel, query, unclear*.
- **Database**: Schemas leverage Postgres constraints mapping dates and times explicitly to safely abstract overlapping reservations.

---

## Core API Endpoints

### 1. Send Chat Request (Protected)
Retrieves and tracks conversational bounds with LLM orchestration.
**HTTP**: `POST /chat`
```bash
curl -X POST http://localhost:5000/chat \
-H "Authorization: Bearer <AUTH_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"message": "I would like to book a general consultation for tomorrow afternoon."}'
```
**Response Format (Success):**
```json
{
  "success": true,
  "data": {
    "reply": "Do you prefer a 2PM or 3PM slot tomorrow?",
    "intent": "book",
    "extracted": {
      "date": "2024-04-17",
      "time": null,
      "service": "general consultation"
    },
    "booking_ready": false,
    "context_updated": true
  }
}
```

### 2. Perform a Booking (Protected)
Submits booking context. Slot verified securely by transactional context logic.
**HTTP**: `POST /api/book`
```bash
curl -X POST http://localhost:5000/api/book \
-H "Authorization: Bearer <AUTH_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "slot_id": "b18b1ea3-f...", 
  "service_id": "c19a...512", 
  "notes": "Please verify fast track."
}'
```
**Response Format:**
```json
{
  "success": true,
  "data": { "id":"new_appt_uuid", "status": "confirmed", "..." },
  "message": "Booking successful"
}
```

### 3. Setup Slots (Admin Only)
Allow authorized admins to populate capacity logic.
**HTTP**: `POST /admin/slots`
```bash
curl -X POST http://localhost:5000/admin/slots \
-H "Authorization: Bearer <ADMIN_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "date": "2024-04-17",
  "start_time": "14:00",
  "end_time": "15:00",
  "service_id": "c19a...512"
}'
```

### 4. Fetch Appointments (Protected)
Standard lists; returns exclusively user bounds unless admin role applied.
**HTTP**: `GET /api/appointments?status=pending`
```bash
curl -X GET 'http://localhost:5000/api/appointments?status=pending&limit=10' \
-H "Authorization: Bearer <AUTH_TOKEN>"
```

### 5. Verify Health (Public)
**HTTP**: `GET /health`
```bash
curl -X GET http://localhost:5000/health
```
```json
{
  "status": "ok",
  "timestamp": "2024-04-16T15:20:01Z"
}
```
