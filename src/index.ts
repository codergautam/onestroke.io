import TitleScene from "./TitleScene";
import OpenScene from "./OpenScene";
import GameScene from "./GameScene";
import Phaser from "phaser";

window.addEventListener("load", () => {
var config = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    parent: "game",
    dom: {
        createContainer: true,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scale: {
        mode:Phaser.Scale.RESIZE,
    }
    
};
var mobile = window.matchMedia("(pointer: coarse)").matches;
var game = new Phaser.Game(config);

var openScene = new OpenScene();
var gameScene = new GameScene();


//alert(lastAd)
var scale = "scale(1)";         // IE 9
 document.body.style.transform = scale;     // General


var titleScene = new TitleScene((name: String) => {
    gameScene.name = name;
    game.scene.switch("title", "game");
    return name;
});

titleScene.mobile = mobile;
openScene.mobile = mobile;
gameScene.mobile = mobile;
//titleScene.showPromo = false;

function canvas() {
    return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
    };
}

Object.defineProperty(titleScene, "canvas", {
    get: canvas
});
Object.defineProperty(openScene, "canvas", {
    get: canvas
});
Object.defineProperty(gameScene, "canvas", {
    get: canvas
});



game.scene.add("title", titleScene);
game.scene.add("open", openScene);
game.scene.add("game", gameScene);

game.scene.start("open");

document.addEventListener("contextmenu",function(e) {
    e.preventDefault();
});


//for debugging on the school chromebooks they fricking banned dev console
/*window.onerror = function(msg, url, line) {
    document.write("Error : " + msg + "<br><br>");
    document.write("Line number : " + line + "<br><br>");
    document.write("File : " + url);
};*/
});
