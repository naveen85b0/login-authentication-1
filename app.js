const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (request.body.password.length < 5) {
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
                user (username, name, password, gender, location) 
            VALUES 
                (
                '${username}', 
                '${name}',
                '${hashedPassword}', 
                '${gender}',
                '${location}'
                )`;
      const dbResponse = await db.run(createUserQuery);
      response.send("User Created successfully");
    }
  } else {
    response.send("User already exist");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//API 3
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT password FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
      const updatePasswordQuery = `
                UPDATE
                user
                SET
                password ='${hashedPassword}'          
                WHERE
                username = '${username}';`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = initializeDBAndServer;
