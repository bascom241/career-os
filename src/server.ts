import app from "./app.ts"
import { connectDb } from "./utils/connectDb.ts"



const port = process.env.PORT || 3000
connectDb()
app.listen(port, ()=> {
    console.log(`listening on careeros server at ${port}`)
})
