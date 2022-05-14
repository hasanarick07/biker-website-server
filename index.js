const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uqsst.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyjwt(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbiden access" });
    }
    console.log(decoded);
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("biker-inventory")
      .collection("product");

    // jsonwebtoken authentication
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ accessToken });
    });
    // Get by specific email
    app.get("/myProducts", verifyjwt, async (req, res) => {
      const decodedEmail = req.decoded.email;
      console.log(decodedEmail, "hi");
      const email = req.query.email;
      console.log(email, "bye");
      if (email === decodedEmail) {
        const query = { email: email };
        const products = await productCollection.find(query).toArray();
        res.send(products);
      }
    });
    app.get("/products", async (req, res) => {
      // console.log("ok");
      const products = await productCollection.find({}).toArray();
      res.send(products);
    });
    app.post("/products", async (req, res) => {
      const result = await productCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/product/:id", async (req, res) => {
      console.log(req.params.id);
      const products = await productCollection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.send(products);
    });
    app.put("/product/:id", async (req, res) => {
      console.log(req.body);
      const update = req.body;
      const filter = { _id: ObjectId(req.params.id) };
      const option = { upsert: true };
      const updateProduct = {
        $set: {
          quantity: update.quantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateProduct,
        option
      );
      res.send(result);
    });
    app.delete("/product/:id", async (req, res) => {
      const queryDelete = { _id: ObjectId(req.params.id) };
      const result = await productCollection.deleteOne(queryDelete);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  const hi = "hello dear Biker, What's up? arick";
  res.send(hi);
});
app.listen(port, () => {
  console.log("port is running Arick", port);
});
