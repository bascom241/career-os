import app from "./app.ts";
import { connectDb } from "./utils/connectDb.ts";

const port = Number(process.env.PORT || 3000);
try {
    await connectDb();
    app.listen(port, "0.0.0.0", () => console.log(`Listening on careeros server at ${port}`));
} catch (error) {
    console.error("Failed to connect to database", error);
    process.exitCode = 1;
}
