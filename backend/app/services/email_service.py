import threading
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import Config


def _send_sync(to_email: str, subject: str, html: str):
    if not Config.SENDGRID_API_KEY:
        print(f"[email] SendGrid API Key not configured — skipping email to {to_email}")
        return
    
    if not Config.SMTP_EMAIL:
        print(f"[email] Sender email (SMTP_EMAIL) not configured — skipping email to {to_email}")
        return

    try:
        message = Mail(
            from_email=Config.SMTP_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html
        )
        sg = SendGridAPIClient(Config.SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code >= 200 and response.status_code < 300:
            print(f"[email] Sent '{subject}' to {to_email} via SendGrid")
        else:
            print(f"[email] SendGrid returned status code {response.status_code}")
    except Exception as e:
        print(f"[email] SendGrid Failed: {e}")


def _send(to_email: str, subject: str, html: str):
    """Sends the email in a background thread to prevent blocking headers."""
    thread = threading.Thread(target=_send_sync, args=(to_email, subject, html))
    thread.daemon = True
    thread.start()


def _wrap(content: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;
                border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#4F46E5;padding:24px 32px;">
        <span style="color:#fff;font-size:18px;font-weight:700;">&#10022; Appointly</span>
      </div>
      <div style="padding:32px;">
        {content}
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">Appointly &middot; AI Booking System</p>
      </div>
    </div>"""


def send_booking_confirmation(to_email: str, name: str, service: str, date: str, time: str):
    html = _wrap(f"""
        <h2 style="color:#111827;margin-top:0;">Appointment Confirmed ✓</h2>
        <p style="color:#4b5563;">Hi {name},</p>
        <p style="color:#4b5563;">Your appointment has been successfully booked:</p>
        <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #bbf7d0;">
          <p style="margin:6px 0;color:#111827;"><strong>Service:</strong> {service}</p>
          <p style="margin:6px 0;color:#111827;"><strong>Date:</strong> {date}</p>
          <p style="margin:6px 0;color:#111827;"><strong>Time:</strong> {time}</p>
        </div>
        <p style="color:#4b5563;">Please arrive a few minutes early. To reschedule or cancel, open the app anytime.</p>
    """)
    _send(to_email, "Appointment Confirmed — Appointly", html)


def send_cancellation_confirmation(to_email: str, name: str, service: str, date: str, time: str):
    html = _wrap(f"""
        <h2 style="color:#111827;margin-top:0;">Appointment Cancelled</h2>
        <p style="color:#4b5563;">Hi {name},</p>
        <p style="color:#4b5563;">Your appointment has been cancelled as requested:</p>
        <div style="background:#fff5f5;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #fee2e2;">
          <p style="margin:6px 0;color:#111827;"><strong>Service:</strong> {service}</p>
          <p style="margin:6px 0;color:#111827;"><strong>Date:</strong> {date}</p>
          <p style="margin:6px 0;color:#111827;"><strong>Time:</strong> {time}</p>
        </div>
        <p style="color:#4b5563;">You can book a new appointment anytime through the app.</p>
    """)
    _send(to_email, "Appointment Cancelled — Appointly", html)


def send_admin_cancellation(to_email: str, name: str, service: str, date: str, time: str):
    html = _wrap(f"""
        <h2 style="color:#111827;margin-top:0;">Appointment Cancelled</h2>
        <p style="color:#4b5563;">Hi {name},</p>
        <p style="color:#4b5563;">We regret to inform you that your appointment has been cancelled due to the doctor being unavailable at that time:</p>
        <div style="background:#fff5f5;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #fee2e2;">
          <p style="margin:6px 0;color:#111827;"><strong>Service:</strong> {service}</p>
          <p style="margin:6px 0;color:#111827;"><strong>Date:</strong> {date}</p>
          <p style="margin:6px 0;color:#111827;"><strong>Time:</strong> {time}</p>
        </div>
        <p style="color:#4b5563;">We apologise for the inconvenience. Please book a new appointment at a different time through the app.</p>
    """)
    _send(to_email, "Appointment Cancelled — Appointly", html)


def send_reschedule_confirmation(to_email: str, name: str, service: str, new_date: str, new_time: str):
    html = _wrap(f"""
        <h2 style="color:#111827;margin-top:0;">Appointment Rescheduled ✓</h2>
        <p style="color:#4b5563;">Hi {name},</p>
        <p style="color:#4b5563;">Your appointment has been rescheduled to:</p>
        <div style="background:#fffbeb;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #fde68a;">
          <p style="margin:6px 0;color:#111827;"><strong>Service:</strong> {service}</p>
          <p style="margin:6px 0;color:#111827;"><strong>New Date:</strong> {new_date}</p>
          <p style="margin:6px 0;color:#111827;"><strong>New Time:</strong> {new_time}</p>
        </div>
        <p style="color:#4b5563;">Please arrive a few minutes early. See you then!</p>
    """)
    _send(to_email, "Appointment Rescheduled — Appointly", html)
