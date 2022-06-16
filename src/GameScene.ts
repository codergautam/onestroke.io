import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import DrawingBoard from './components/DrawingBoard';
import Rater from "./components/Rater";
import Drawing from "./helpers/Drawing";
import msToSeconds from "./helpers/msToSeconds";

interface Result {
  id: string;
  name: string;
  avgVote: number;
  drawing: number[][];
}

class GameScene extends Phaser.Scene {
    mobile: boolean;
    name: String;
    state: String;
    socket: Socket;
    text1: Phaser.GameObjects.Text;
    text2: Phaser.GameObjects.Text;
    canvas: { width: number, height: number };
    drawingBoard: DrawingBoard;
    rater: Rater;
    roomInfo: { players: number; maxPlayers: number; startTime: null | number; topic: string; drawingEndTime: null | number; submissionEndTime: null | number; drawing: Drawing | null; votingTime: number | null; };
    now: any;

    constructor() {
      super("game");
    
    }
    preload() {
      this.state = "matchmaking";

      this.now = 0;
    }

    updateWaitingText() {
      var left = this.roomInfo.startTime - this.now;

      var top = `(${this.roomInfo.players}/${this.roomInfo.maxPlayers})`;
      var bottom = `${this.roomInfo.startTime ? left >= 0 ? `Starting in ${msToSeconds(left)}` : "Starting in 0" : "Waiting for players.."}`;
      
      this.text2.setText(top + "\n" + bottom);
    }

    create() {

      this.socket = io();
      this.socket.emit("go", this.name);

      this.text1 = this.add.text(this.canvas.width/2, this.canvas.height/3, "Finding Match..").setOrigin(0.5).setFontSize(Math.min(this.canvas.width/20, this.canvas.height/12));
      this.text2 = this.add.text(this.canvas.width/2, this.canvas.height/2 + this.text1.displayHeight, "Connecting..").setOrigin(0.5).setFontSize(Math.min(this.canvas.width/30, this.canvas.height/20)).setAlign("center");
      
      this.rater = new Rater(this, 0, this.canvas.height/2).setVisible(false);
      
      this.roomInfo = {
        players: 0,
        maxPlayers: 10,
        startTime: null,
        topic: "",
        drawingEndTime: null,
        submissionEndTime: null,
        votingTime: null,
        drawing: null,
      };

      this.socket.on("findingRoom", () => {
       this.text2.setText("Finding Room..");
      });
      this.socket.on("joinRoom", (roomId: number) => {
        this.text2.setText("Joining Room..");
      })
      this.socket.on("playerCount", ([players, maxPlayers, startTime]) => {     
        this.roomInfo.startTime = startTime;
        this.roomInfo.players = players;
        this.roomInfo.maxPlayers = maxPlayers;

        this.updateWaitingText();
      });
      this.socket.on("startGame", (topic, startDrawingTime) => {
        this.roomInfo.topic = topic;
        this.state = "starting";

        this.text1.setText("The topic is..");
        this.text2.setText(topic);
      });
      this.socket.on("startDrawing", (drawingEndTime) => {
        this.state = "drawing";

        this.text1.visible = false;
        this.text2.visible = false;

        this.roomInfo.drawingEndTime = drawingEndTime;

        this.drawingBoard = new DrawingBoard(this, 0, 0);

        this.drawingBoard.setText(`Topic: ${this.roomInfo.topic}`);

      this.drawingBoard.graphics.setAlpha(0);

      this.tweens.add({
        targets: this.drawingBoard.graphics,
        alpha: 1,
        duration: 1000,
        ease: 'Linear',
      })
      });
      this.socket.on("endDrawing", (submissionEndTime) => {
        if(this.state != "drawing") return;
        //submit drawing
        this.state = "submitting";
        this.drawingBoard.lockDrawing();
        this.drawingBoard.setText("Time is up!");
        var drawing = this.drawingBoard.getDrawing();
        this.socket.emit("submitDrawing", drawing);
        console
        this.roomInfo.submissionEndTime = submissionEndTime;
      });
      this.socket.on("voting", (drawing: Drawing, votingTime: number) => {
        this.state = "voting";
        this.roomInfo.drawing = drawing;
        this.roomInfo.votingTime = votingTime;
        this.text1.visible = false;
        this.drawingBoard.visible = true;
        this.drawingBoard.loadDrawing(drawing);

      });
      this.socket.on("endGame", (results) => {
        this.state = "ended";
        this.drawingBoard.visible = true;
        this.drawingBoard.setText("Winner: "+results[0].name);
      });
      this.socket.on("now", (now) => {
        this.now = now;
      })
      this.text1.visible = true;
      this.text2.visible = true;

     // this.drawingBoard = new DrawingBoard(this, 0, 0);
      //this.add.existing(this.drawingBoard);

      // this.drawingBoard.graphics.setAlpha(0);

      // this.tweens.add({
      //   targets: this.drawingBoard.graphics,
      //   alpha: 1,
      //   duration: 1000,
      //   ease: 'Linear',
      // })

      const resize = () => {
        this.text1.setPosition(this.canvas.width/2, this.canvas.height/3);
        this.text2.setPosition(this.canvas.width/2, this.canvas.height/2 + this.text1.displayHeight);
        this.text1.setFontSize(Math.min(this.canvas.width/20, this.canvas.height/12));
        this.text2.setFontSize(Math.min(this.canvas.width/30, this.canvas.height/20));
        if(this.drawingBoard) this.drawingBoard.resize();
      }
      var doit: string | number | NodeJS.Timeout;
      window.addEventListener("resize", function() {
        clearTimeout(doit);
        doit = setTimeout(resize, 300);
      });
  
      resize();
    }
    update() {
      if(this.drawingBoard) this.drawingBoard.updateContainer();
      if(this.rater) this.rater.updateContainer();

      if(this.state == "matchmaking" && this.socket.connected && this.roomInfo.startTime) {
        
        this.updateWaitingText();
      }

      if(this.state == "drawing" && this.socket.connected && this.roomInfo.drawingEndTime) {
        this.drawingBoard.setText(`Topic: ${this.roomInfo.topic}\n Time left: ${this.roomInfo.drawingEndTime - this.now >= 0 ? msToSeconds(this.roomInfo.drawingEndTime - this.now) : "0"}`);
      }

      if(this.state == "submitting" && this.socket.connected && this.roomInfo.submissionEndTime && this.roomInfo.submissionEndTime - this.now <= 3000) {
        this.drawingBoard.visible = false;
        this.text1.visible = true;
        this.text1.setText(`Voting begins in ${this.roomInfo.submissionEndTime - this.now >= 0 ? msToSeconds(this.roomInfo.submissionEndTime - this.now) : "0"}!`);
      }

      if(this.state == "voting" && this.socket.connected && this.roomInfo.votingTime) {
       if(this.socket.id != this.roomInfo.drawing.id) {
        this.drawingBoard.setText(`Drawing by: ${this.roomInfo.drawing.name}\n Vote now!`);
        this.rater.setVisible(true);
        if(this.roomInfo.votingTime - this.now <= 0) {
          this.rater.setVisible(false);
          this.socket.emit("vote", this.rater.getValue());
        }
       } 
       else {
        this.drawingBoard.setText(`People are rating your drawing!\n Time left: ${this.roomInfo.votingTime - this.now >= 0 ? msToSeconds(this.roomInfo.votingTime - this.now) : "0"}`);
        this.rater.setVisible(false);
       } 

    }
  }
}

export default GameScene;