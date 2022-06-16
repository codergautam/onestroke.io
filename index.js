const express = require("express");
var http = require("http");
require("dotenv").config();

const app = express();
var process = require("process");

app.use(express.json());

var server = http.createServer(app);
const io = require("./helpers/io").init(server);

const Player = require("./classes/Player");

const matchmaker = require("./helpers/matchmaker");
const roomlist = require("./helpers/roomlist");

app.use("/", express.static(__dirname + "/dist"));
app.use("/", express.static(__dirname+"/public"));
app.use("/assets", express.static(__dirname+"/assets"));

io.on("connection", async (socket) => {
  socket.on("go", (name) => {
    if(!name || typeof name != "string") return;
    name = name.trim();
    if(name.length == 0) return socket.disconnect();
    name = name.substring(0,16);
    var player = new Player(name, socket.id, socket);
    matchmaker(player);
  });
  socket.on("submitDrawing", (drawing) => {
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(!room) return;
    if(!drawing || typeof drawing != "object") return;
     if(drawing.find(p=>p.length != 2 || typeof p[0] != "number" || typeof p[1] != "number" || p[0] < 0 || p[0] > 500 || p[1] < 0 || p[1] > 500)) return;
    room.submitDrawing(socket.id, drawing);
  });
  socket.on("disconnect", async () => {
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(room) {
      room.removePlayer(socket.id);
    }
  });
  socket.on("vote", (rating) => {
    if(!rating || typeof rating != "number") return;
    rating = Math.round(rating);
    if(rating < 1 || rating > 5) return;
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(!room) return;
    room.vote(socket.id, rating);
  });
});

//tick rooms
setInterval(() => {
  roomlist.tickAll();
  io.emit("now", Date.now());
}, 1000/10);

server.listen(process.env.PORT || 3000, () => {
  console.log("server started");
});
