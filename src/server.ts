import app from "./app.ts"
import { connectDb } from "./utils/connectDb.ts"



const port = Number(process.env.PORT || 3000)
connectDb()
app.listen(port, "0.0.0.0", ()=> {
    console.log(`listening on careeros server at ${port}`)
})
