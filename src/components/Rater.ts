import GameScene from "../GameScene";

export default class Rater extends Phaser.GameObjects.Container {
  gameScene: GameScene;
  stars: Phaser.GameObjects.Image[];
  starAmount: number;
  clicked: boolean;
  clickNum: number;
  constructor (scene: GameScene, x: number, y: number) {
    super(scene);
    this.starAmount = 5;
    this.stars = [];
    for (let i = 0; i < this.starAmount; i++) {
      this.stars.push(new Phaser.GameObjects.Image(this.scene, x + i * (this.stars[0]?.displayWidth ?? 0), y, "starGrey").setOrigin(0));
      this.add(this.stars[i]);
    }
    this.scene.add.existing(this);
    this.clicked = true;
    this.clickNum = 2;
    this.gameScene = scene;
  }
  updateContainer() {

    var hovering = false;
    // check if hovering over star
    for (let i = this.stars.length-1; i >= 0; i--) {
      //check if clicking
      var down = this.scene.input.activePointer.isDown;
      if (this.scene.input.activePointer.x > this.stars[i].x && this.scene.input.activePointer.x < this.stars[i].x + this.stars[i].displayWidth && this.scene.input.activePointer.y > this.stars[i].y && this.scene.input.activePointer.y < this.stars[i].y + this.stars[i].displayHeight) {
        

        hovering = true;
        if(down) {

          this.clicked = true;
          this.clickNum = i;
          this.stars[i].setTexture("starYellow");
          
        } else this.stars[i].setTexture("starMedium");
        
      } else {
        if(!hovering && !this.clicked) this.stars[i].setTexture("starGrey");
        else if(this.clicked && this.clickNum > i-1) this.stars[i].setTexture("starYellow");
        else if(hovering && !(this.clickNum > i-1)) this.stars[i].setTexture("starMedium");
        else this.stars[i].setTexture("starGrey");
      }

        this.stars[i].setScale(Math.min(this.gameScene.canvas.width/2500, this.gameScene.canvas.height/1500));
        this.stars[i].setPosition(this.gameScene.canvas.width/2 + i * (this.stars[0]?.displayWidth ?? 0), this.gameScene.canvas.height /1.2);
        var totalWidth = this.stars[0]?.displayWidth*this.starAmount ?? 0;
        this.stars[i].setX(this.gameScene.canvas.width/2 - totalWidth/2 + i * (this.stars[0]?.displayWidth ?? 0));
    }
  }
  getValue() {
    return this.clickNum+1;
  }
  resize() {

   
  };
}