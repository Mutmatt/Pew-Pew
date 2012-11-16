/** Written by Matt Erickson (ME) **/
var DEBUG = false; //debug flag for helping figure out what is going on
//One time inits
var $GALAGA_CANVAS;
var GALAGA_CANVAS;
var GALAGA_CONTEXT;
var mouse;
var bad1; //bad guy sprite 1
var bad2; //bad guy sprite 2
var bad3; //bad guy sprite 3
var good; //the GOOD GUY!
// CONSTANTS
var GUYWIDTH = 20;
var GUYHEIGHT = 20;
var FIRECHANCEDENOMINATOR = 1000;
var FIRECHANCENUMERATOR = 998;
var BULLETHEIGHT = 8;
var BULLETWIDTH = 2;
var GUYOFFSET = GUYWIDTH / 2; //player sprite positioned a mouse in center of the image
var PLAYERLIVES = 5;
//Game counters
var playerScore = 0;
var level = 1;
var lives;

//options
var gameTypeClassic;

//Multiple inits
var player;
var bullets = new Array(); //bullets fired by player
var badGuys = new Array(); //the bad guys
var badBullets = new Array(); //array of bullets fired from the bad guys
//Important interval handler!
var intervalLoop = 0;
var fakeGame = 0;

/*document ready function */
jQuery(document).ready(function($){
    //jquery GALAGA_CANVAS wrapper
    $GALAGA_CANVAS = jQuery("#galaga_canvas");
    //html GALAGA_CANVAS object
    GALAGA_CANVAS = $GALAGA_CANVAS.get(0);
    //html5 context of the GALAGA_CANVAS
    GALAGA_CONTEXT = GALAGA_CANVAS.getContext("2d");



   /* jQuery("#classicOrFree").dialog({
        resizable: false,
        height: 140,
        modal: true,
        buttons: {
            "Classic": function() {
                gameTypeClassic = true;
                ready();
                jQuery(this).dialog("close");
            },
            "Free-Flight": function() {
                gameTypeClassic = false;
                ready();
                jQuery(this).dialog("close");
            }
        }
    });*/
	gameTypeClassic = true;
	ready();
});

function ready() {

    //Game wide options
    lives = PLAYERLIVES;

    //page images
    bad1 = document.getElementById("bad1");
    bad2 = document.getElementById("bad2");
    bad3 = document.getElementById("bad3");
    good = document.getElementById("good");
    //Sets up the pregame to show the good ship and message to start
    setPreGame();

  // do nothing in the event handler except canceling the event
  GALAGA_CANVAS.ondragstart = function(e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    if (e && e.stopPropagation) { e.stopPropagation(); }
    return false;
  }

// do nothing in the event handler except canceling the event
  GALAGA_CANVAS.onselectstart = function(e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    if (e && e.stopPropagation) { e.stopPropagation(); }
    return false;
  }
    
    $GALAGA_CANVAS.on('click', function(e) {
      e.preventDefault();
    
      if (intervalLoop == 0) {
          setStartGame(5);
      } else {
          if (bullets.length < 4) {
              bullets.push(new Bullet(player.x - 1, player.y - GUYOFFSET, BULLETHEIGHT, BULLETWIDTH, 0));
          }
      }
      return false;
      
    });
    
    //Mouse listener
    jQuery($GALAGA_CANVAS).mousemove(function(event) {
        setMousePosition(event);
    });
}

/**
 * Initiallizes the game
 */
function initGalaga() {
	if (GALAGA_CONTEXT != undefined) {
		GALAGA_CONTEXT.clearRect(0, 0, 400, 400);
	}
    badGuys = [];
    player = null;
    bullets = [];
    badBullets = [];

    initPlayer(true);

    if (level % 5 != 0) {
        for (var i = 0; i < 10; i++) {
            badGuys.push(new Guy(i * 35, 0, bad1, .5, 20, 20, level * 20, 1));
        }
        for (var i = 0; i < 10; i++) {
            badGuys.push(new Guy(i * 35, 30, bad2, .5, 20, 20, level * 10, 1));
        }
        for (var i = 0; i < 10; i++) {
            badGuys.push(new Guy(i * 35, 60, bad3, .5, 20, 20, level * 5, 1));
        }
    } else {
        FIRECHANCENUMERATOR -= .5;
        badGuys.push(new Guy(1 * 35, 0, bad1, .5, 50, 50, level * 100, 10));
    }

    intervalLoop = setInterval(drawGalaga, 20);
}

/**
 * initiallizes the player
 */
function initPlayer(isGame) {
    mouse = new Mouse();
    player = new Guy(0, 0, good, 0, GUYWIDTH, GUYHEIGHT, 0, 5);
    if (!isGame) {
        fakeGame = setInterval(drawPlayerGalaga, 20);
    }
}

/**
 * clears the GALAGA_CANVAS and redraws the player
 */
function drawPlayerGalaga() {
    //Clean GALAGA_CANVAS
    GALAGA_CONTEXT.clearRect(0, 0, 400, 400);
    //Move player to mouse
    redrawPlayerGalaga("Click To Start!");
}

/**
 * clears the GALAGA_CANVAS and calls a bunch of helper methods to redraw and check collions.
 * This method is where most of the "heavy lifting" is done
 */
function drawGalaga() {
    //Clean GALAGA_CANVAS
    GALAGA_CONTEXT.clearRect(0, 0, 400, 400);
    //Move player to mouse
    redrawPlayerGalaga("");
    collisionCheckBullets();
    moveBadGuys();
    redrawBadGuys();
    badGuysTryFire();
    redrawBullets();
    checkLevelFinished();
}

/**
 * Gives the bad guys a chance to fire
 */
function badGuysTryFire() {
    jQuery.each(badGuys, function(index, badGuy) {
        //Chance to fire
        if (Math.floor(Math.random() * FIRECHANCEDENOMINATOR) > FIRECHANCENUMERATOR) {
            badBullets.push(new Bullet(badGuy.x + (badGuy.width / 2), badGuy.bottom(), BULLETHEIGHT, BULLETWIDTH, 0));
        }
    });
}


function redrawPlayerGalaga(str) {
    player.x = mouse.x;
    if (gameTypeClassic) {
        player.y = 370;
    } else {
        player.y = mouse.y;
    }

    GALAGA_CONTEXT.drawImage(player.img, player.x - GUYOFFSET, player.y - GUYOFFSET, player.height, player.width);
    GALAGA_CONTEXT.fillStyle = "White";
    GALAGA_CONTEXT.fillText("PlayerScore: [" + playerScore + "] Level: [" + level + "] " + str, 20, 390);
    for (var i = 1; i < lives; i++) {
        GALAGA_CONTEXT.drawImage(player.img, 390 - (i * 17), 380, 15, 15);
    }
    if (DEBUG) {
        //Write other things about the player
    }

    if (player != undefined && player.x != undefined) {
        jQuery.each(badGuys, function(index, badGuy) {
            if (intersect(badGuy)) {
                setEndGame("Collision in Redraw Player");
                return false;
            }
        });
    }
}


function collisionCheckBullets() {
    jQuery.each(badGuys, function(indexGuy, badGuy) {
        jQuery.each(bullets, function(indexBullet, bullet) {
            if ((bullet != undefined && badGuy != undefined) && intersectOther(badGuy, bullet)) {
                if (badGuy.hp == 1) {
                    badGuy.hp--;
                    playerScore += badGuy.points;
                    badGuys.splice(indexGuy, 1);
                    bullets.splice(indexBullet, 1);
                    return false;
                } else {
                    badGuy.hp--;
                    bullets.splice(indexBullet, 1);
                    return false;
                }
            }
        });
    });

    jQuery.each(badBullets, function(index, badBullet) {
        if (badBullet != undefined && intersect(badBullet)) {
            setEndGame("Collision with bad bullet");
            return false;
        }
    });
}

function moveBadGuys() {
    var isWall = false;
    jQuery.each(badGuys, function(index, badGuy) {
        vel = badGuy.vel;
        if ((badGuy.x + badGuy.width) > $GALAGA_CANVAS.width() && badGuy.direction) { //moving right hit a wall?
            isWall = true;
            badGuy.x += badGuy.velocity;
        } else if (badGuy.x < 0 && !badGuy.direction) { //moving left hit a wall?
            isWall = true;
            badGuy.x -= badGuy.velocity;
        } else { //no walls GO
            if (badGuy.direction) { //right
                badGuy.x += badGuy.velocity;
            } else { //left
                badGuy.x -= badGuy.velocity;
            }
        }
    });

    if (isWall) { //hit a wall, gotta reset and move back the other way
        jQuery.each(badGuys, function(index, badGuy) {
            badGuy.velocity = badGuy.velocity + .1;
            if (badGuy.direction) {
                badGuy.y += 15;
                badGuy.x -= badGuy.velocity;
                badGuy.direction = !badGuy.direction;
            } else {
                badGuy.y += 15;
                badGuy.x += badGuy.velocity;
                badGuy.direction = !badGuy.direction;
            }

            //Check if bad guy hit the bottom
            if (badGuy.bottom > GALAGA_CANVAS.height) {
                setEndGame("Bad guys hit the bottom of the GALAGA_CANVAS");
                return false;
            }
        });
        isWall = false;
    }
}

function redrawBadGuys() {
    jQuery.each(badGuys, function(index, badGuy) {
        if (DEBUG) {
            GALAGA_CONTEXT.fillStyle = "White";
            GALAGA_CONTEXT.fillText("HP: [" + badGuy.hp + "]", badGuy.x, badGuy.y - 2);
        }
        GALAGA_CONTEXT.drawImage(badGuy.img, badGuy.x, badGuy.y, badGuy.width, badGuy.height);
    });
}

function redrawBullets() {
    //My fired bullets
    jQuery.each(bullets, function(index, bullet) {
        if (bullet != undefined) {
            bullet.y -= 3; //Move bullet up
            GALAGA_CONTEXT.fillStyle = "White";
            GALAGA_CONTEXT.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); //X, Y, width, height
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }
        }
    });

    //Bad guy bullets
    jQuery.each(badBullets, function(index, badBullet) {
        if (badBullet != undefined) {
            badBullet.y += 3; //Move bullet up
            GALAGA_CONTEXT.fillStyle = "White";
            GALAGA_CONTEXT.fillRect(badBullet.x, badBullet.y, badBullet.width, badBullet.height); //X, Y, width, height
            if (badBullet.y > $GALAGA_CANVAS.height) {
                badBullets.splice(index, 1);
            }
        }
    });
}

function checkLevelFinished() {
    if (badGuys.length == 0 && intervalLoop != 0) {
        setPostLevel();
        return false;
    }
}

/**
 * player has been killed or got a game over
 * optional param str of reason WHY the game ended
 */
function setEndGame(str) {
    if (lives > 1) {
        lives--;
        badGuys.length = 0;
        bullets.length = 0;
        badBullets.length = 0;
        clearInterval(intervalLoop);
        intervalLoop = 0;
        setPreGame();
    } else {
        if (DEBUG) {
            alert("Game Over! because [" + str + "]");
        } else {
            alert("Game Over!");
        }
        lives = PLAYERLIVES;
        level = 1;
        playerScore = 0;
        badGuys.length = 0;
        bullets.length = 0;
        badBullets.length = 0;
        clearInterval(intervalLoop);
        intervalLoop = 0;
        setPreGame();
    }
}

function setStartGame() {
    clearInterval(fakeGame); //Clear the pregame
    fakeGame = 0; //Remove pregame interval id
    initGalaga(); //init the game!
}

function setPreGame() {
    initPlayer(false);
}

function setPostLevel() {
    level++;
    badBullets.length = 0;
    bullets.length = 0;
    clearInterval(intervalLoop);
    intervalLoop = 0;
    setPreGame();
}

function setMousePosition(event) {
    var rect = GALAGA_CANVAS.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
}

/************* Objects *************/
/**
 * Bullets fired
 */
function Bullet(x, y, height, width) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = width;

    this.top = function() {
        return this.y;
    };
    this.bottom = function() {
        return this.y + this.height;
    };
    this.left = function() {
        return this.x;
    };
    this.right = function() {
        return this.x + this.width;
    };
}

function Mouse() {
    this.x;
    this.y;
}

/**
 * Any moving object that can collide with a bullet
 */
function Guy(x, y, img, velocity, height, width, points, hp) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.velocity = velocity;
    this.width = width;
    this.height = height;
    this.direction = true; //true is right, false is left
    this.points = points;
    this.hp = hp;

    this.top = function() {
        return this.y;
    };
    this.bottom = function() {
        return this.y + this.height;
    };
    this.left = function() {
        return this.x;
    };
    this.right = function() {
        return this.x + this.width;
    };
} /************* End Objects *************/
/************* Helper methods *************/
/**
 * Intersection of an object with the player
 */
function intersect(obj) {
    if (DEBUG) {
        //console.log("Top [" + obj.top() + "] Bottom [" + obj.bottom() + "] Right [" + obj.right() + "] Left [" + obj.left() + "]");
    }
    return (obj.left() <= player.x + GUYOFFSET && player.x <= obj.right() && obj.top() <= player.y + GUYOFFSET && player.y <= obj.bottom())
}

/**
 * Check intersections of two objects (a and b)
 */
function intersectOther(a, b) {
    return (a.left() <= b.right() && b.left() <= a.right() && a.top() <= b.bottom() && b.top() <= a.bottom())
} /************* End Helpers *************/
