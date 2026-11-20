export interface SendEmailParams {
    toEmail: string
    toName: string
    emailSubject: string
    htmlContent: string
}

export type EmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string };