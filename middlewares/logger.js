//import required modules
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//functions for logging events
 export const logEvents = async (message, fileName) => {
    const logsDir = path.join(__dirname, "..", "logs");

    if (!fs.existsSync(logsDir)) {
        await fsPromises.mkdir(logsDir);
    }

    const timeFormat = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const logMessage = `${timeFormat}\t${uuid()}\t${message}\n`;

    await fsPromises.appendFile(path.join(logsDir, fileName), logMessage);
};


//middleware for logging events
export const logger = async (req, res, next) => {
    logEvents(`${req.method}: ${req.headers.origin}: ${req.url}`, "logEvents.txt").catch(err => console.error("Log write failed:", err));
    console.log(`${req.method}:${req.url}`);
    next();
}


