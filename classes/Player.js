const idgen = require("../helpers/idgen");

class Player {
  constructor(name, id=idgen(), socket=undefined) {
    this.name = name;
    this.id = id;
    this.roomId = null;
    this.socket = socket;
  }
  joinRoom(room) {
    this.roomId = room.id;
    this.socket.emit("joinRoom", room.id);
  }
}
module.exports = Player;