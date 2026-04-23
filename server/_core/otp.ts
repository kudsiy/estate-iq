import AfricasTalking from "africastalking";

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
});
const sms = at.SMS;

// In-memory store: phone -> { code, expiresAt, attempts, lockUntil }
const otpStore = new Map<string, { 
  code: string; 
  expiresAt: number; 
  attempts: number; 
  lockUntil?: number; 
}>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<void> {
  const existing = otpStore.get(phone);
  
  // Check if locked
  if (existing && existing.lockUntil && Date.now() < existing.lockUntil) {
    const remaining = Math.ceil((existing.lockUntil - Date.now()) / 1000 / 60);
    throw new Error(`Device temporarily locked due to too many failed attempts. Try again in ${remaining} minutes.`);
  }

  const code = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Reset attempts on new OTP, but keep lock if it exists
  otpStore.set(phone, { 
    code, 
    expiresAt, 
    attempts: 0, 
    lockUntil: existing?.lockUntil 
  });

  await sms.send({
    to: [phone],
    message: `Your Estate IQ verification code is: ${code}. Valid for 10 minutes.`,
    from: process.env.AT_SENDER_ID || undefined,
  });
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  
  // Check if locked
  if (entry.lockUntil && Date.now() < entry.lockUntil) {
    return false;
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  
  entry.attempts++;
  
  if (entry.code !== code) {
    if (entry.attempts >= 6) {
      entry.lockUntil = Date.now() + 10 * 60 * 1000; // 10 minutes lock
      entry.code = "INVALIDATED";
    }
    return false;
  }
  
  otpStore.delete(phone); // single use
  return true;
}

export async function sendSms(
  phone: string, 
  message: string
): Promise<void> {
  await sms.send({
    to: [phone],
    message,
    from: process.env.AT_SENDER_ID || undefined,
  });
}
