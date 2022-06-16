import GameScene from "../GameScene";
import Drawing from "../helpers/Drawing";

export default class DrawingBoard extends Phaser.GameObjects.Container {
  graphics: Phaser.GameObjects.Graphics;
  size: number;
  gameScene: GameScene;
  isDrawing: boolean;
  paths: Phaser.Curves.Path[];
  hasDrawn: boolean;
  redoImg: Phaser.GameObjects.Image;
  redoRect: Phaser.GameObjects.Rectangle;
  oldWidth: number;
  oldHeight: number;
  boundTopLeftPoint: { x: number; y: number; };
  oldBoundTopLeftPoint: any;
  topText: Phaser.GameObjects.Text;
  canDraw: boolean;
  constructor (scene: GameScene, x: number, y: number) {
    super(scene);
    this.paths = [];


    this.gameScene = scene;
    this.redoImg = new Phaser.GameObjects.Image(this.scene, 0, 0, "redo").setScale(this.gameScene.canvas.width/5000).setOrigin(0);
    this.redoRect = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, this.redoImg.displayWidth*2, this.redoImg.displayHeight*2, 0xD3D3D3);


    this.topText = new Phaser.GameObjects.Text(this.scene, 0, 0, "", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0);

    this.add(this.topText);
    this.redoRect.setInteractive();
    this.redoRect.on("pointerdown", () => {
      this.paths.length = 0;
      this.paths.push(new Phaser.Curves.Path(this.scene.input.activePointer.x, this.scene.input.activePointer.y));

      this.graphics.clear();
      this.drawBounds();
      this.isDrawing = false; 
      this.hasDrawn = false;

      this.redoImg.visible = false;
      this.redoRect.visible = false;
    });
  
    this.redoImg.setVisible(false);
  this.redoRect.setVisible(false);

  
    this.add(this.redoRect);  
  this.add(this.redoImg);
   
    
    this.graphics = new Phaser.GameObjects.Graphics(this.scene);
    this.add(this.graphics);
    this.scene.add.existing(this);
    this.graphics.fillStyle(0xffffff, 4);

    this.x = x;
    this.y = y;

    this.size = 500;


    this.width = (Math.min(this.gameScene.canvas.width, this.gameScene.canvas.height)/1.5);
    this.height = (Math.min(this.gameScene.canvas.width, this.gameScene.canvas.height)/1.5);
    this.oldWidth = this.width;
    this.oldHeight = this.height;

    this.boundTopLeftPoint = {
      x: (this.gameScene.canvas.width/2) - (this.width/ 2),
      y: (this.gameScene.canvas.height/2) - (this.height/2)
    };
    this.oldBoundTopLeftPoint = this.boundTopLeftPoint;

    console.log(this.width, this.height, this.gameScene.canvas.height);
    this.drawBounds();


    this.isDrawing = false; 
    this.hasDrawn = false;
    this.canDraw = true;
  }
  getDrawing() {
    // (oldPoint - oldOrigin) * (newSize / oldSize) + newOrigin
    var points = [];
    for (var i = 0; i < this.paths.length; i++) {
      this.paths[i].getPoints(2).forEach(point => {
        var newPoint = [
          (point.x - this.boundTopLeftPoint.x) * (this.size/this.width),
          (point.y - this.boundTopLeftPoint.y) * (this.size/this.height)
        ]
        points.push(newPoint);
      });
    }
    return points;
  }
  lockDrawing() {
    this.isDrawing = false;
    this.canDraw = false;
    this.redoImg.visible = false;
    this.redoRect.visible = false;
  }
  loadDrawing(drawing: Drawing) {
    this.graphics.clear();
    this.drawBounds();
    this.paths.length = 0;
    this.lockDrawing();
    this.isDrawing = false;
    drawing.drawing.forEach((point, i) => {
      var newPoint = [
        point[0] * (this.width/this.size) + this.boundTopLeftPoint.x,
        point[1] * (this.height/this.size) + this.boundTopLeftPoint.y
      ];

      if(!this.isDrawing ) {
        this.isDrawing = true;
        this.paths.push(new Phaser.Curves.Path(newPoint[0], newPoint[1]));
      } else {
        this.paths[this.paths.length - 1].lineTo(newPoint[0], newPoint[1]);
      }
    

    });
    this.paths.forEach(path => {
      path.draw(this.graphics);
    });
  }
  drawBounds() {
    this.graphics.lineStyle(2, 0xffff00, 1);
    this.graphics.strokeRect((this.gameScene.canvas.width/2) - (this.width/ 2), (this.gameScene.canvas.height/2) - (this.height/2), this.width, this.height);
    this.oldBoundTopLeftPoint = this.boundTopLeftPoint;
    this.boundTopLeftPoint = {
      x: (this.gameScene.canvas.width/2) - (this.width/ 2),
      y: (this.gameScene.canvas.height/2) - (this.height/2)
    };
    this.graphics.lineStyle(2, 0xffffff, 1);
  }
  updateContainer() {
    this.topText.setPosition(this.gameScene.canvas.width/2, (this.boundTopLeftPoint.y / 2) - (this.topText.displayHeight/2));
    if(!this.canDraw) return;
    if(!this.scene.input.activePointer.isDown) {
      if(this.isDrawing && !this.redoImg.visible) {
        this.redoImg.visible = true;
        this.redoRect.visible = true;
      }
      this.isDrawing = false;
    } else {
      //check if pointer is in bounds
      if(!(this.scene.input.activePointer.x > (this.gameScene.canvas.width/2) - (this.width/ 2) && this.scene.input.activePointer.x < (this.gameScene.canvas.width/2) + (this.width/ 2) && this.scene.input.activePointer.y > (this.gameScene.canvas.height/2) - (this.height/2) && this.scene.input.activePointer.y < (this.gameScene.canvas.height/2) + (this.height/2))) {
       
        if(this.isDrawing && !this.redoImg.visible) {
          this.redoImg.visible = true;
          this.redoRect.visible = true;
        }
        this.isDrawing = false;
        return;
      }
      if(!this.isDrawing && !this.hasDrawn) {
        this.paths.length = 0;
        this.paths.push(new Phaser.Curves.Path(this.scene.input.activePointer.x, this.scene.input.activePointer.y));
        console.log("new path");
        this.isDrawing = true;
        this.hasDrawn = true;
      } else if(this.isDrawing) {
        this.paths[this.paths.length-1].lineTo(this.scene.input.activePointer.x, this.scene.input.activePointer.y);
      } else if(!this.redoImg.visible) {
        this.redoImg.visible = true;
        this.redoRect.visible = true;
      }
      this.paths[this.paths.length-1].draw(this.graphics);
      if(this.paths[this.paths.length-1].getPoints(2).length > 100) {
        this.paths.push(new Phaser.Curves.Path(this.scene.input.activePointer.x, this.scene.input.activePointer.y));
      }
    }
  }
  setText(text: string) {
    this.topText.setText(text);
  }
  resize() {
    this.oldHeight = this.height;
    this.oldWidth = this.width;
    this.width = (Math.min(this.gameScene.canvas.width, this.gameScene.canvas.height)/1.5);
    this.height = (Math.min(this.gameScene.canvas.width, this.gameScene.canvas.height)/1.5);
  
    this.graphics.clear();
    this.drawBounds();



    this.paths.map(path => {
     path.curves.map((curve: Phaser.Curves.Line) => {
        curve.p0.x = (curve.p0.x - this.oldBoundTopLeftPoint.x) * (this.width / this.oldWidth) + this.boundTopLeftPoint.x;
        curve.p0.y = (curve.p0.y - this.oldBoundTopLeftPoint.y) * (this.height / this.oldHeight) + this.boundTopLeftPoint.y;
        curve.p1.x = (curve.p1.x - this.oldBoundTopLeftPoint.x) * (this.width / this.oldWidth) + this.boundTopLeftPoint.x;
        curve.p1.y = (curve.p1.y - this.oldBoundTopLeftPoint.y) * (this.height / this.oldHeight) + this.boundTopLeftPoint.y;

      return curve;
     });
      path.draw(this.graphics);
      return path;
    });
  };
}