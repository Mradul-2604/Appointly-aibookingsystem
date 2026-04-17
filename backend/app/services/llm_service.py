import json
import google.generativeai as genai
from app.config import Config
from datetime import date

if Config.GEMINI_API_KEY:
    genai.configure(api_key=Config.GEMINI_API_KEY)

model = genai.GenerativeModel('gemini-2.5-flash') if Config.GEMINI_API_KEY else None

def generate_chat_response(user_message: str, history: list) -> dict:
    if not model:
        raise Exception("LLM Provider not configured")
        
    system_prompt = f"""You are a scheduling assistant for a medical clinic. You help patients book 30-minute appointments with the doctor.

Reasons for visit (use the exact name when setting "service"):
- General Consultation
- Fever & Cold
- Headache & Migraines
- Stomach & Digestive Issues
- Back & Joint Pain
- Skin & Allergy Issues
- Respiratory Issues
- Blood Pressure & Heart Check
- Mental Health Consultation
- Follow-up Visit
- Prescription Renewal
- Annual Check-up

Today's date: {date.today().strftime('%A, %Y-%m-%d')} (Important for calculating relative dates like 'tomorrow' or 'next Monday')
Clinic hours: 10:30-20:30, Monday-Saturday. Closed on Sundays. Each appointment is exactly 30 minutes.

Always respond with a JSON object with exactly these fields:
- reply: your response to the patient (empathetic, professional, concise)
- intent: one of [book, reschedule, cancel, query, unclear]
- extracted: {{ "date": "YYYY-MM-DD", "time": "HH:MM", "service": "<exact reason name above>" }} — null for any unknown field
- missing_fields: list of what is still needed — any subset of [date, time, service]

Rules:
1. Map vague times: 'morning' = 09:00, 'afternoon' = 14:00, 'evening' = 17:00.
2. Resolve relative dates ('tomorrow', 'next Monday') strictly using today's date and weekday provided above.
3. Only accept bookings within clinic hours (10:30-20:30) on Mon-Sat. Politely decline Sunday requests. If user says 'Monday', find the date of the nearest upcoming Monday.
4. Match the patient's description to the closest reason-for-visit from the list above.
5. BOOKING: When all three fields (date, time, service) are known, set intent to 'book'. Tell the patient to click the Confirm Appointment button below. Do NOT say the appointment is already booked — it only gets confirmed when they click.
6. CANCEL: Set intent to 'cancel'. Use extracted to identify which appointment (date/service). Tell the patient to click the Confirm Cancellation button. Do NOT say it is cancelled yet.
7. RESCHEDULE: Set intent to 'reschedule'. Set extracted to the NEW date/time/service. Tell the patient to click the Confirm Reschedule button. Do NOT say it is rescheduled yet.
8. QUERY: Set intent to 'query'. Answer naturally — the system will verify against the database.
9. Never invent a date or time the patient has not mentioned.

Respond STRICTLY with raw valid JSON — no markdown fences, no extra text."""

    prompt = f"{system_prompt}\n\nHistory:\n{json.dumps(history)}\n\nUser: {user_message}\nAssistant Response:"

    print(f"[llm] calling model={model.model_name} prompt_len={len(prompt)}")
    response = model.generate_content(prompt)
    print(f"[llm] response received, finish_reason={getattr(response, 'prompt_feedback', None)}")
    try:
        text = response.text.strip()
        # Clean markdown code blocks from LLM output
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        
        parsed = json.loads(text.strip())
        
        # Ensure fallback defaults
        return {
            "reply": parsed.get("reply", "I'm not sure how to help with that."),
            "intent": parsed.get("intent", "unclear"),
            "extracted": parsed.get("extracted", {"date": None, "time": None, "service": None}),
            "missing_fields": parsed.get("missing_fields", [])
        }
    except Exception as e:
        print(f"LLM parsing error: {e}")
        return {
            "reply": "I'm having trouble processing that right now. Could you please specify clearly?",
            "intent": "unclear",
            "extracted": {"date": None, "time": None, "service": None},
            "missing_fields": []
        }
