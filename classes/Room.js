const idgen = require("../helpers/idgen");
const io = require("../helpers/io");
const fs = require("fs");
const path = require("path");
class Room {
  constructor() {
    this.id = idgen();
    this.players = new Map();
    this.state = "waiting";
    this.maxPlayers = 10;
    this.startTime = null;
    this.startDrawingTime = null;
    this.drawingTime = null;
    this.waitingForSubmissionTime = null;
    this.topic = Room.getTopic();
    this.votingFor = null;
    this.votingTime = null;
    this.drawings = {};
  }
  addPlayer(player) {
    var ioinstance = io.getio();
    player.joinRoom(this);
    this.players.set(player.id, player);
    player.socket.join(this.id);



   if(this.players.size > 2 && !(this.startTime && this.startTime < Date.now() + 60000)) {
      this.startTime = Date.now() + 60000;
  }
  if(this.players.size > 4 && !(this.startTime && this.startTime < Date.now() + 30000)) {
      this.startTime = Date.now() + 30000;
  }
  if(this.players.size > 6 && !(this.startTime && this.startTime < Date.now() + 10000)) {
      this.startTime = Date.now() + 10000;
  }
  if(this.players.size > 8 && !(this.startTime && this.startTime < Date.now() + 5000)) {
      this.startTime = Date.now() + 5000;
  }
  if(this.state == "waiting") ioinstance.in(this.id).emit("playerCount", [this.players.size, this.maxPlayers, this.startTime]);

  }
  removePlayer(id) {
    var ioinstance = io.getio();
    var player = this.players.get(id);
    if(player) {
      player.socket.leave(this.id);
      this.players.delete(id);
      if(this.players.size < 3 && this.startTime) {
        this.startTime = null;
        ioinstance.in(this.id).emit("startTime", null);
      }
      if(this.state == "waiting") ioinstance.in(this.id).emit("playerCount", [this.players.size, this.maxPlayers, this.startTime]);
    }
  }
  static getTopic() {
    //read topics.txt
    var topics = fs.readFileSync(path.resolve("./topics.txt"), "utf8").split("\n");
    var topic = topics[Math.floor(Math.random() * topics.length)];
    return topic;
  }
  tick() {
    if(this.state == "waiting" && this.startTime && this.startTime < Date.now()) {
      console.log("starting game", this.id);
      this.state = "starting";
      this.startDrawingTime = Date.now() + 3000;
      io.getio().in(this.id).emit("startGame", this.topic, this.startDrawingTime);
    } else if(this.state == "starting" && this.startDrawingTime && this.startDrawingTime < Date.now()) {
      console.log("starting drawing", this.id);
      this.state = "drawing";
      this.drawingTime = Date.now() + 120000;
      io.getio().in(this.id).emit("startDrawing", this.drawingTime);
    } else if(this.state == "drawing" && this.drawingTime && this.drawingTime < Date.now()) {
      console.log("ending drawing", this.id);
      this.state = "waitingForSubmission";
      this.waitingForSubmissionTime = Date.now() + 6000;

      io.getio().in(this.id).emit("endDrawing", this.waitingForSubmissionTime);
    } else if(this.state == "waitingForSubmission" && this.waitingForSubmissionTime && this.waitingForSubmissionTime < Date.now()) {
      this.state = "voting";
      this.votingTime = 1;
    } else if(this.state == "voting" && this.votingTime && this.votingTime < Date.now()) {
     var availableToVote =  Object.values(this.drawings).filter(drawing=>!drawing.voted);
     console.log("remaining", availableToVote.length, "drawings");
      if(availableToVote.length > 0) {
        var drawing = availableToVote[Math.floor(Math.random() * availableToVote.length)];
        drawing.voted = true;
        this.votingFor = drawing.id;
        //200 ms to wait for responses
        this.votingTime = Date.now() + 5200;
        io.getio().in(this.id).emit("voting", drawing, this.votingTime-200);
      } else {
        console.log("no drawings to vote for", this.id);
        var e = Object.values(this.drawings);
        e = e.map(drawing=>{
          var f = {
            id: drawing.id,
            name: this.players.get(drawing.id).name,
            avgVotes: Object.values(drawing.votes).reduce((a,b)=>a+b, 0)/Object.keys(drawing.votes).length,
            drawing: drawing.drawing
          };
          return f;
        }).sort((a,b)=>b.avgVotes-a.avgVotes);
        console.table( e);
        io.getio().in(this.id).emit("endGame", e);
        this.state = "ended";
        // TODO: show winner
      }

    }
  }
  submitDrawing(id, drawing) {
    if(!this.state == "waitingForSubmission")  return;
    if(!this.players.has(id)) return;
    if(this.drawings[id]) return;

    this.drawings[id] = {drawing, voted: false, votes: {}, id, name: this.players.get(id).name};

    console.log("recieved drawing", this.id, `${Object.keys(this.drawings).length}/${this.players.size}`);
  }
  vote(id, vote) {
    if(!this.state == "voting") return;
    if(!this.players.has(id)) return;
    if(!this.drawings[this.votingFor]) return;
    if(this.drawings[this.votingFor].votes[id]) return;
    this.drawings[this.votingFor].votes[id] = vote;
    console.log("recieved vote", this.id, vote, `${Object.keys(this.drawings[this.votingFor].votes).length}/${this.players.size-1}`);
  }

}

module.exports = Room;