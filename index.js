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
    // await client.connect();
    
    const db=client.db('EcoTrack_db')
    const challengesCollection=db.collection('challenges')
    const tipsCollection=db.collection('tips')
    const userCollection=db.collection('users')
    const eventsCollection=db.collection('events')
    const userChallengesCollection=db.collection('userChallenges')

    //challenges api
  app.get('/challenges', async (req, res) => {
  try {
    const { limit, status, category, sortBy = "startDate", order = "desc" } = req.query;

    const nowString = new Date().toISOString().split('T')[0];
    let filter = {};

    if (status === "running") {
      filter.startDate = { $lte: nowString };
      filter.endDate = { $gte: nowString };
    } else if (status === "upcoming") {
      filter.startDate = { $gt: nowString };
    } else if (status === "ended") {
      filter.endDate = { $lt: nowString };
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const sortOrder = order === "asc" ? 1 : -1;
    let query = challengesCollection.find(filter).sort({ [sortBy]: sortOrder });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const result = await query.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch challenges" });
  }
});
app.get('/challengeCategories', async (req, res) => {
  try {
    const cursor = challengesCollection.find({}, { projection: { category: 1 } });
    const documents = await cursor.toArray();

    // Extract and deduplicate categories
    const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))];

    res.send(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send({ error: 'Failed to fetch categories' });
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
app.post('/userChallenges', async (req, res) => {
  const newUserChallenge = {
    ...req.body,
    status: 'ongoing',
    progress: 0,
    joinedAt: new Date().toISOString(),
  };

  try {
    const result = await userChallengesCollection.insertOne(newUserChallenge);

    await challengesCollection.updateOne(
      { _id: new ObjectId(newUserChallenge.challengeId) },
      { $inc: { participants: 1 } }
    );

    res.send(result);
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).send({ error: 'Failed to join challenge' });
  }
});
app.get('/userChallenges/summary', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    // Get all challenges
    const allChallenges = await challengesCollection.find({}).toArray();

    // Get user joined challenges
    const userChallenges = await userChallengesCollection.find({ userId }).toArray();

    const joinedIds = userChallenges.map(c => c.challengeId.toString());
    const totalJoined = userChallenges.length;
    const finished = userChallenges.filter(c => c.status === 'finished').length;
    const ongoing = userChallenges.filter(c => c.status === 'ongoing').length;

    // Not started = all challenges not joined
    const notStarted = allChallenges.filter(c => !joinedIds.includes(c._id.toString())).length;

    const averageProgress = totalJoined > 0
      ? Math.round(userChallenges.reduce((sum, c) => sum + (c.progress || 0), 0) / totalJoined)
      : 0;

    res.json({
      totalChallenges: allChallenges.length,
      totalJoined,
      finished,
      ongoing,
      notStarted,
      averageProgress,
    });
  } catch (error) {
    console.error('Error generating user challenge summary:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.patch('/userChallenges/update', async (req, res) => {
  const { userId, challengeId, status, progress } = req.body;

  if (!userId || !challengeId) {
    return res.status(400).json({ error: 'userId and challengeId are required.' });
  }

  const updateFields = {};
  if (status) updateFields.status = status;
  if (typeof progress === 'number') updateFields.progress = progress;

  try {
    const result = await userChallengesCollection.updateOne(
      { userId, challengeId },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'No matching challenge found or no changes made.' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating challenge progress/status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

    app.get('/userChallenges/check-status', async (req, res) => {
      const {userId,challengeId}=req.query
      const joined = await userChallengesCollection.findOne({userId,challengeId})

      res.json({joined: !!joined})
    })
app.delete('/userChallenges', async (req, res) => {
  try {
    const { userId, challengeId } = req.query;

    if (!userId || !challengeId) {
      return res.status(400).json({ error: 'userId and challengeId are required.' });
    }

    // Delete the userChallenge entry
    const deleteResult = await userChallengesCollection.deleteOne({ userId, challengeId });

    // If a record was deleted, decrement participants
    if (deleteResult.deletedCount > 0) {
      await challengesCollection.updateOne(
        { _id: new ObjectId(challengeId) },
        { $inc: { participants: -1 } }
      );
    }

    res.json({ success: deleteResult.deletedCount > 0 });
  } catch (error) {
    console.error('Error removing challenge:', error);
    res.status(500).json({ error: 'Failed to remove challenge.' });
  }
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
//number of users
app.get('/users/count', async (req, res) => {
  try {
    const count = await userCollection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Failed to count users' });
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


    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
 
  }
}
run().catch(console.dir);


app.listen(port, ()=>{
    console.log('the port is running at:',port)
})