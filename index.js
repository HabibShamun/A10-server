const express=require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors=require('cors')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0idmfrx.mongodb.net/?appName=Cluster0`;


const app=express()
const port=process.env.PORT||3000



//middleware
app.use(cors())
app.use(express.json())


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



//get api root
app.get('/', (req,res)=>{
 res.send('my server is runing')
})

async function run() {
  try {
    await client.connect();
    
    const db=client.db('EcoTrack_db')
    const challengesCollection=db.collection('challenges')

    //challenges api
    app.get('/challenges', async (req,res)=>{
      const limit=parseInt(req.query.limit)||0
      const cursor=challengesCollection.find({}).sort({startDate:-1}).limit(limit)
      const result=await cursor.toArray()
      res.send(result)
    })
    app.post('/challenges',async (req,res)=> {
      const newChallenge=req.body
      const result= await challengesCollection.insertOne(newChallenge)
      res.send(result)
    })
    app.delete('/challenges/:id', async(req,res)=>{
      const id=req.params.id
      const query={_id:new ObjectId(id)}
      const result=await challengesCollection.deleteOne(query)
      res.send(query)
    })

    app.get('/challenges/:id',async (req,res)=>{
      const id=req.params.id
      const query={_id:new ObjectId(id)}
      const result=await challengesCollection.findOne(query)
      res.send(result)
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
 
  }
}
run().catch(console.dir);


app.listen(port, ()=>{
    console.log('the port is running at:',port)
})