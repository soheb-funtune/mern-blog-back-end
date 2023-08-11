const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user");
const Post = require("./models/post-schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Connection = require("./database/connection-db");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const salt = bcrypt.genSaltSync(10);
const secret = "skflkalfklflflsflklsdf";
// Enable JSON parsing middleware
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
// Enable CORS middleware
app.use(cors({ credentials: true, origin: process.env.FONT_END_BASE_URL }));
Connection();
console.log("front:", process.env.FONT_END_BASE_URL);

app.get("/reg", (req, res) => {
  res.status(200).json({ name: "get test kk" });
});
app.post("/reg", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (username && password) {
      // Create the new user
      const newUser = await User.create({
        username,
        password: bcrypt.hashSync(password, salt),
      });
      console.log("New user created:", newUser);
      res.status(201).json(newUser);
    } else {
      res.status(400).json({ error: "Username and password are required" });
    }
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const dbUser = await User.findOne({ username });
  const passOk = await bcrypt.compare(password, dbUser.password);
  console.log({ passOk });
  if (passOk) {
    jwt.sign({ username, id: dbUser._id }, secret, {}, (err, token) => {
      if (err) {
        throw err;
      } else {
        res
          .status(200)
          .cookie("token", token)
          .json({ message: "successFully login", token, userId: dbUser._id });
      }
    });
  } else {
    res.status(400).json({ message: "enter correct credendials" });
  }
});

// Profile

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  console.log("cookie", req.cookies);
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post("/post", upload.single("file"), async (req, res) => {
  const { path, originalname } = req.file;
  const editpath = path?.split("\\");
  editpath?.pop();
  editpath?.push(originalname);
  const newPath = editpath?.join("/");
  console.log({ newPath });
  fs.renameSync(path, newPath);
  // const fsImg = fs.readFileSync(`./uploads/${originalname}`);
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, content, summary } = req.body;
    const postCreated = await Post.create({
      title,
      content,
      summary,
      cover: newPath,
      author: info.id,
    });
    res.json(postCreated);
  });
});

app.get("/post", async (req, res) => {
  const { token } = req.cookies;

  res.json(await Post.find().populate("author", ["username"]));
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;

  res.json(await Post.findById({ _id: id }).populate("author", ["username"]));
});
app.put("/post/:id", upload.single("file"), async (req, res) => {
  const { title, content, summary } = req.body;
  const { id } = req.params;
  let newPath = null;
  if (req.file) {
    const { path, originalname } = req.file;
    const editpath = path && path?.split("\\");
    editpath?.pop();
    editpath?.push(originalname);
    newPath = editpath?.join("/");
    console.log({ newPath });
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const userDoc = await Post.findById({ _id: id });

    console.log("info", info, userDoc);
    const isAuthor = JSON.stringify(info.id) === JSON.stringify(userDoc.author);
    if (!isAuthor) res.status(400).json("your are not Author");
    // res.json({ isAuthor, userDoc });

    const postCreated = await Post.findOneAndUpdate(
      { _id: id },
      {
        title,
        content,
        summary,
        cover: newPath ? newPath : userDoc?.cover,
        author: info.id,
      },
      { new: true }
    );
    res.json(postCreated);
  });

  // res.json(await Post.findById({ _id: id }).populate("author", ["username"]));
});

const port = process.env.API_PORT;
app.listen(port, () => console.log("listning on Port : 2000 ", port));
