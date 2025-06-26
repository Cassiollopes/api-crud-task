import express from "express";
import routes from "./routes";
import fileUpload from "express-fileupload";
import cors from "cors";

const port = process.env.PORT || 8080;

const app = express();

app.use(
  fileUpload({
    createParentPath: true,
    tempFileDir: "./temp/",
    useTempFiles: true,
  })
);

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(routes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
