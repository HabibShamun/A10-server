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
    const tipsCollection=db.collection('tips')
    const userCollection=db.collection('users')

    //challenges api
  app.get('/challenges', async (req, res) => {
  try {
    const { limit, status, sortBy = "startDate", order = "desc" } = req.query;

    // Format current date as "YYYY-MM-DD"
    const now = new Date();
    const nowString = now.toISOString().split('T')[0]; // "2025-11-11"

    let filter = {};

    if (status === "running") {
      filter = {
        startDate: { $lte: nowString },
        endDate: { $gte: nowString }
      };
    } else if (status === "upcoming") {
      filter = {
        startDate: { $gt: nowString }
      };
    } else if (status === "ended") {
      filter = {
        endDate: { $lt: nowString }
      };
    }

    const sortOrder = order === "asc" ? 1 : -1;
    let query = challengesCollection.find(filter).sort({ [sortBy]: sortOrder });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const result = await query.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).send({ error: "Failed to fetch challenges" });
  }
});


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

    //tips api
    app.post('/tips', async(req,res)=>{
            const newTip=req.body
      const result= await tipsCollection.insertOne(newTip)
      res.send(result)
    })

    app.get('/tips', async(req,res)=>{
      const cursor= tipsCollection.find({})
      const result = await cursor.toArray()
      res.send(result)
    })

    //user api
    app.post('/challenges/join/:id', async (req,res)=>{

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