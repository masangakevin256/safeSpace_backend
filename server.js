import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.js";
import corsOptions from "./controller/controlCorsOption.js";

//port
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = initSocket(server, corsOptions);

//listening to port
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
