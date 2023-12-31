const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const cors = require('cors');
const port = process.env.PORT || 7000;

// Midaleware.............................................
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l2ejwhb.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const varifyJWT = (req, res, next) => {
    const authoraization = (req.headers.authoraization);
    if (!authoraization) {
        return res.status(401).send({ error: true, message: 'unauthorizeation' })
    }
    const token = authoraization.split(' ')[1];
    jwt.verify(token, process.env.ACCEES_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(404).send({ error: true, message: 'unauthorizeation' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('acrMeahanic').collection('services')
        const bookingsCollection = client.db('acrMeahanic').collection('booking')

        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCEES_TOKEN, { expiresIn: '1h' });
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result);
        })



        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await servicesCollection.findOne(query, options)
            res.send(result);
        })

        // bookings........................................................
        app.post('/bookings', (req, res) => {
            const booking = req.body;
            console.log(booking)
            const result = bookingsCollection.insertOne(booking);
            res.send(result)
        })

        app.get('/bookings', varifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ erorr: 1, message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray();

            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Solution is Running.............')
});

app.listen(port, () => {
    console.log(`Car Machanic is on port ${port}`)
})



module.exports.handler = serverless(app);

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const app = express();
// const port = process.env.PORT || 5000;

// // middleware
// app.use(cors());
// app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.swu9d.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// async function run() {
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         await client.connect();

//         const coffeeCollection = client.db('coffeeDB').collection('coffee');

//         app.get('/coffee', async (req, res) => {
//             const cursor = coffeeCollection.find();
//             const result = await cursor.toArray();
//             res.send(result);
//         })

//         app.get('/coffee/:id', async(req, res) => {
//             const id = req.params.id;
//             const query = {_id: new ObjectId(id)}
//             const result = await coffeeCollection.findOne(query);
//             res.send(result);
//         })

//         app.post('/coffee', async (req, res) => {
//             const newCoffee = req.body;
//             console.log(newCoffee);
//             const result = await coffeeCollection.insertOne(newCoffee);
//             res.send(result);
//         })

//         app.put('/coffee/:id', async(req, res) => {
//             const id = req.params.id;
//             const filter = {_id: new ObjectId(id)}
//             const options = { upsert: true };
//             const updatedCoffee = req.body;

//             const coffee = {
//                 $set: {
//                     name: updatedCoffee.name,
//                     quantity: updatedCoffee.quantity,
//                     supplier: updatedCoffee.supplier,
//                     taste: updatedCoffee.taste,
//                     category: updatedCoffee.category,
//                     details: updatedCoffee.details,
//                     photo: updatedCoffee.photo
//                 }
//             }

//             const result = await coffeeCollection.updateOne(filter, coffee, options);
//             res.send(result);
//         })

//         app.delete('/coffee/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: new ObjectId(id) }
//             const result = await coffeeCollection.deleteOne(query);
//             res.send(result);
//         })


//         // Send a ping to confirm a successful connection
//         await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         // await client.close();
//     }
// }
// run().catch(console.dir);



// app.get('/', (req, res) => {
//     res.send('Coffee making server is running')
// })

// app.listen(port, () => {
//     console.log(`Coffee Server is running on port: ${port}`)
// })

// const serviceCollection = client.db('serviceDB').collection('service');

// // data pathano................................................
// app.post('/services', async(req, res)=>{
//     const newService = req.body;
//     const result = await serviceCollection.insertOne(newService);
//     res.send(result);
// })

// // data get ba show data.........................................
// app.get('/sercice', async(req, res)=>{
//     const cursor = serviceCollection.find();
//     const result = await cursor.toArray();
//     res.send(result);
// })

// // id soho data ana...............................................
// app.get('/service/:id', async(req, res)=>{
//     const id = req.params.id;
//     const query = {_id: new ObjectId(id)};
//     const result = await serviceCollection.findOne(query);
//     res.send(result);
// })

// // service delete from db.......................................
// app.delete('/service/:id', async(req, res)=>{
//     const id = req.params.id;
//     const query = {_id: new ObjectId(id)};
//     const result = await serviceCollection.deleteOne(query);
//     res.send(result);
// })