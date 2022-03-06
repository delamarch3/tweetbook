import express from "express";
import proxy from "express-http-proxy";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/users", proxy("http://users:8000"));
app.use("/profile", proxy("http://profile:8000"));
app.use("/follows", proxy("http://follows:8000"));
app.use("/posts", proxy("http://posts:8000"));

app.use(errorHandler);
app.listen(8000, () => console.log("Server started"));
