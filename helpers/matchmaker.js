const roomlist = require("./roomlist");
const Room = require("../classes/Room");
const until = require("./until");
const io = require("./io");
module.exports = async (player) => {
  player.socket.emit("findingRoom");
  
  await until(() => roomlist.getAllRooms().filter(room=>room.state != "waiting").length <= 5);
  const room = roomlist.getAllRooms().filter(room=>room.state == "waiting").length > 0 ? roomlist.getAllRooms().filter(room=>room.state == "waiting")[0] : new Room();

  room.addPlayer(player);
  roomlist.setRoom(room);
};