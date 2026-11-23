
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char] ?? char;
  });

interface EmailTemplateOptions {
  name: string;
  code: string;
  title: string;
  description: string;
  expiryMinutes: number;
}

function emailLayout({
  name,
  code,
  title,
  description,
  expiryMinutes,
}: EmailTemplateOptions): string {
  const safeName = escapeHtml(name?.trim() || "there");
  const safeCode = escapeHtml(code);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport"
          content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #F8F5EF;
        font-family: Arial, Helvetica, sans-serif;
      ">

        <table
          role="presentation"
          cellpadding="0"
          cellspacing="0"
          border="0"
          width="100%"
          style="background-color: #F8F5EF;"
        >
          <tr>
            <td align="center" style="padding: 48px 16px;">

              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                width="100%"
                style="
                  max-width: 480px;
                  background-color: #FFFFFF;
                  border-radius: 20px;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="padding: 40px 28px;"
                  >

                    <!-- Brand name -->
                    <p style="
                      margin: 0 0 28px;
                      font-size: 18px;
                      font-weight: 700;
                      color: #145C38;
                      letter-spacing: -0.4px;
                    ">
                      cavaliers os
                    </p>

                    <!-- Heading -->
                    <h1 style="
                      margin: 0 0 14px;
                      font-size: 24px;
                      line-height: 32px;
                      font-weight: 700;
                      color: #171717;
                    ">
                      ${safeTitle}
                    </h1>

                    <!-- Greeting -->
                    <p style="
                      margin: 0 0 16px;
                      font-size: 14px;
                      line-height: 22px;
                      color: #777777;
                    ">
                      Hi ${safeName},
                    </p>

                    <!-- Description -->
                    <p style="
                      margin: 0 0 28px;
                      max-width: 340px;
                      font-size: 14px;
                      line-height: 23px;
                      color: #777777;
                    ">
                      ${safeDescription}
                    </p>

                    <!-- Verification code -->
                    <p style="
                      margin: 0 0 24px;
                      font-size: 36px;
                      line-height: 44px;
                      font-weight: 700;
                      letter-spacing: 6px;
                      color: #171717;
                    ">
                      ${safeCode}
                    </p>

                    <!-- Expiration -->
                    <p style="
                      margin: 0 0 12px;
                      font-size: 13px;
                      line-height: 20px;
                      color: #888888;
                    ">
                      This code expires in ${expiryMinutes} minutes.
                    </p>

                    <!-- Security note -->
                    <p style="
                      margin: 0;
                      font-size: 13px;
                      line-height: 21px;
                      color: #888888;
                    ">
                      Didn't request this code?
                      You can safely ignore this email.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <p style="
                margin: 24px 0 0;
                font-size: 12px;
                line-height: 20px;
                color: #999999;
                text-align: center;
              ">
                &copy; ${new Date().getFullYear()}
                Cavaliers OS. All rights reserved.
              </p>

            </td>
          </tr>
        </table>

      </body>
    </html>
  `;
}

// 1. Email verification
export function verifyEmailTemplate(
  name: string,
  code: string
): string {
  return emailLayout({
    name,
    code,
    title: "Verify Your Email Address",
    description:
      "Use the verification code below to verify your email address and activate your Cavaliers OS account.",
    expiryMinutes: 15,
  });
}

// 2. Password reset
export function sendResetPasswordToken(
  name: string,
  code: string
): string {
  return emailLayout({
    name,
    code,
    title: "Reset Your Password",
    description:
      "We received a request to reset your Cavaliers OS password. Enter the verification code below to continue.",
    expiryMinutes: 15,
  });
}
