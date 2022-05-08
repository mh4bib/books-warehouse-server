const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeaders.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p3ee6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const bookCollection = client.db('booksWarehouse').collection('items');

        //jwt
        app.post('/token', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '7d'
            });
            res.send({ accessToken });
        });


        app.get('/items', async (req, res) => {
            const query = {};
            const cursor = bookCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })

        app.get('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await bookCollection.findOne(query);
            res.send(item);
        });

        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await bookCollection.deleteOne(query);
            res.send(item);
        });

        app.post('/items', async (req, res) => {
            const newItem = req.body;
            const item = await bookCollection.insertOne(newItem);
            res.send(item);
        });

        app.get('/my-item', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email };
                const cursor = bookCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        });

        app.put('/items/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.newQuantity
                }
            };
            const result = await bookCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log('listening to port', port);
});