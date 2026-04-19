import AfricasTalking from "africastalking";

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
});
const sms = at.SMS;

// In-memory store: phone -> { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<void> {
  const code = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(phone, { code, expiresAt });

  await sms.send({
    to: [phone],
    message: `Your Estate IQ verification code is: ${code}. Valid for 10 minutes.`,
    from: process.env.AT_SENDER_ID || undefined,
  });
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  
  if (entry.code !== code) return false;
  
  otpStore.delete(phone); // single use
  return true;
}
