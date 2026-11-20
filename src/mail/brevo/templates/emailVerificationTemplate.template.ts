export function verifyEmailTemplate(name: string, code: string ) {
    return ` 
    <html>
        <body>
            <h1> Welcome,${name || "there"} </h1>
            <p> Here is your verification code ${code} </p>
        </body>
    </html> 
            `
}