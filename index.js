const express=require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors=require('cors')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0idmfrx.mongodb.net/?appName=Cluster0`;


const app=express()
const port=process.env.PORT||5000



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
    const eventsCollection=db.collection('events')
    const userChallengesCollection=db.collection('userChallenges')

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


  //by email challenges

  

 app.get('/challenges/:id', async (req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
  const result= await challengesCollection.findOne(query)
  res.send(result)
 })

    // app.get('/challenges/:id',async (req,res)=>{
    //   const id=req.params.id
    //   const query={_id:new ObjectId(id)}
    //   const result=await challengesCollection.findOne(query)
    //   res.send(result)
    // })

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

    //joined challenges


    //check
    app.get('/userChallenges' ,async (req,res)=>{
      const cursor= userChallengesCollection.find()
      const result= await cursor.toArray()
      res.send(result)
    })
    app.post('/userChallenges', async (req,res)=>{
      const newUserChallenge=req.body
      const result= await userChallengesCollection.insertOne(newUserChallenge)
      res.send(result)
    })
    app.get('/userChallenges/check-status', async (req, res) => {
      const {userId,challengeId}=req.query
      const joined = await userChallengesCollection.findOne({userId,challengeId})

      res.json({joined: !!joined})
    })
    app.delete('/userChallenges', async (req, res) => {
       const {userId,challengeId}=req.query
      const joined = await userChallengesCollection.deleteOne({userId,challengeId})

      res.json({success: !!true})
});

//my activities api

app.get('/userChallenges/joined', async (req, res) => {
  try {
    const { userId } = req.query;
    const joined = await userChallengesCollection.find({userId}).toArray();

    const challengeIds = joined.map(j => new ObjectId(j.challengeId));
    const result = await challengesCollection.find({ _id: { $in: challengeIds } }).toArray();

    res.send(result);
  } catch (error) {
    console.error('Error fetching joined challenges:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});




    //tips api
    app.post('/tips', async(req,res)=>{
            const newTip=req.body
      const result= await tipsCollection.insertOne(newTip)
      res.send(result)
    })

    app.get('/tips', async(req,res)=>{
      const limit=parseInt(req.query.limit) ||0
      const cursor= tipsCollection.find({}).limit(limit)
      const result = await cursor.toArray()
      res.send(result)
    })

    //events api
    app.post('/events', async (req,res)=>{
       const newEvent=req.body
      const result= await eventsCollection.insertOne(newEvent)
      res.send(result)
    })
    app.get('/events', async(req,res)=>{
      const cursor= eventsCollection.find({}).limit(4)
      const result = await cursor.toArray()
      res.send(result)
    })

    //user api
    app.post('/users', async (req,res)=>{
      const newUser=req.body
      const result =await userCollection.insertOne(newUser)
      res.send(result) 
    })
 app.patch('/users', async (req, res) => {
  try {
    const { email } = req.query;
    const { name, profileImage } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to update user.' });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (profileImage) updateFields.imageUrl = profileImage;

    const result = await userCollection.updateOne(
      { email },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found or no changes made.' });
    }

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


    //api get
    app.get('/users', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ error: 'Email query parameter is required' });
    }

    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.send(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

const { ObjectId } = require('mongodb');

app.delete('/deleteUser', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const objectId = new ObjectId(userId);

    // Delete user from users collection
    const userResult = await userCollection.deleteOne({ _id: objectId });

    // Delete all challenges associated with the user
    const challengeResult = await userChallengesCollection.deleteMany({ userId: objectId });

    res.status(200).json({
      message: 'User and related challenges deleted successfully.',
      userDeleted: userResult.deletedCount,
      challengesDeleted: challengeResult.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


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