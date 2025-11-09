const express=require('express')
const cors=require('cors')

const app=express()
const port=process.env.PORT||3000

//middleware
app.use(cors())
app.use(express.json())

//get api root
app.get('/', (req,res)=>{
 res.send('my server is runing')
})

app.listen(port, ()=>{
    console.log('the port is running at:',port)
})