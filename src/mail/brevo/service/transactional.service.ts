import type { SendEmailParams } from "../../mail.type.ts";
import type { EmailResult } from "../../mail.type.ts";
export async function sendTransactionalEmail({ toEmail, toName, emailSubject, htmlContent }: SendEmailParams): Promise<EmailResult> {
    try {
        
        const response = await fetch("/", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api_key": process.env.BREVO_KEY ?? "",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.BREV0_SENDER_NAME,
                    email: process.env.BREVO_SENDER_MAIL
                },
                to: [{
                    email: toEmail,
                    name: toName
                }],
                subject: emailSubject,
                htmlContent
            })
        });

        const data = (await response.json().catch(() => ({}))) as {
            message: string,
            messageId: string
        };

        if (!response.ok || !data.messageId) {
            const reason = data.message || `HTTP ${response.status}`;
            console.error(`[Brevo Failed] To: ${toEmail} | Reason: ${reason}`);
            return { success: false, error: reason };
        }
        return { success: true, messageId: data.messageId };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
        console.error(`[Brevo Exception] To: ${toEmail} | Error: ${errorMessage}`);
        return { success: false, error: errorMessage };
    }

}