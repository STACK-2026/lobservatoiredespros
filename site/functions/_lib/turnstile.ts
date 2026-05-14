/**
 * Cloudflare Turnstile server-side verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export interface TurnstileVerifyResult {
  success: boolean;
  errors?: string[];
}

export async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<TurnstileVerifyResult> {
  if (!token) return { success: false, errors: ["missing_token"] };

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const data = await res.json() as { success: boolean; "error-codes"?: string[] };
    return { success: data.success === true, errors: data["error-codes"] };
  } catch (e) {
    return { success: false, errors: ["fetch_failed"] };
  }
}
