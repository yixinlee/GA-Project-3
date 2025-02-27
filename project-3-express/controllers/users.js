const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const auth = require("../middleware/auth");
const Users = require("../models/Users");

const usernameOrPasswordError = {
  status: "error",
  message: "username or password error",
};

router.post("/create", async (req, res) => {
  try {
    req.body.passwordHash = await bcrypt.hash(req.body.password, 12);
    const createdUser = await Users.create(req.body);
    console.log("created user is: ", createdUser);
    res.json({ status: "OK", message: "user created" });
  } catch (err) {
    console.error(err);
    res.status(401).json(usernameOrPasswordError);
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Users.findOne({ username });

  if (user === null) {
    return res.status(401).send(usernameOrPasswordError);
  }

  const result = await bcrypt.compare(password, user.passwordHash);
  if (result) {
    req.session.currentUser = user.username;
    req.session.userId = user.id;
    res.send({ status: "OK", message: "user logged in" });
  } else {
    req.session.currentUser = null;
    req.session.userId = null;
    res.status(401).json(usernameOrPasswordError);
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ status: "OK", message: "user logged out" });
  });
});

router.get("/profile", auth, (req, res) => {
  if (req.session.currentUser) {
    res.json({ status: "OK", message: "profile" });
  } else {
    res.status(403).json({ status: "error", message: "profile: please log in." });
  }
});

router.delete("/remove", async (req, res) => {
  const { username } = req.body;
  const message = await Users.deleteOne({ username });

  if (message.deletedCount === 1) {
    res.json({ status: "OK", message: "user deleted" });
  } else {
    res.json({ status: "error", message: "problems with deleting user" });
  }
});

module.exports = router;
