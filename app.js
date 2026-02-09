import express from "express";
import { logger } from "./middlewares/logger.js";
import cors from "cors";
import corsOptions from "./controller/controlCorsOption.js";
import path from "path";
import router from "./routes/routes.js";
import { fileURLToPath } from "url";
import {errorLog} from "./middlewares/errorLogger.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();


//custom middleware
app.use(logger);
app.use(cors(corsOptions));


//use built in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));


app.use("/api", router);

//sending error file for path that do not exist
app.all(/.*/, (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "views", "html", "error.html"));
    } else if (req.accepts("json")) {
        res.json({ message: "404 Not Found" });
    } else {
        res.type("txt").send("404 Not Found");
    }
});

//use error logger middleware
app.use(errorLog);

export default app;