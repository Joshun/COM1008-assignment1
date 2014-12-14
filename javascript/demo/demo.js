/* HTML5 Canvas Demo
 * Jmoey Web Design (12/2014)
 */


var SCREEN_WIDTH = 500;
var SCREEN_HEIGHT = 500;
var BLOCK_SIZE = 50;
var BLOCKS_PER_ROW = SCREEN_WIDTH / BLOCK_SIZE;
var INTERVAL = 25;

var NUM_LIVES = 3;

var context;

var leftDown, rightDown;
var playerPaddle;
var ball;
var blocks;

var states = { INITIAL: 0, STARTED: 1, GAMEOVER: 2, GAMEWIN: 3 };
var gameState;

var canvasMinX = 0, canvasMaxX = 0;

var companyLogoImg;
var companyLogoImgWidth;
var companyLogoImgHeight;

/* Ball object definition ============================================*/

/* Ball constructor - needs initial x and y position, radius, speed and fill style */
function Ball(x, y, r, speed, style) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.dx = speed;
	this.dy = speed;
	this.style = style;
	this.livesLeft = NUM_LIVES;
}

/* Function to draw ball on screen */
Ball.prototype.draw = function() {
	context.fillStyle = this.style;
	context.beginPath();
	context.arc(this.x, this.y, this.r, 0, Math.PI * 2);
	context.closePath();
	context.fill();
};

/* Function to centre the ball on the screen */
Ball.prototype.centre = function() {
	this.x = SCREEN_WIDTH / 2;
	this.y = SCREEN_HEIGHT / 2;
};

/* Function to be called when life is lost */
Ball.prototype.dead = function() {
	this.livesLeft--;
	this.centre();
	if( this.livesLeft > 0 ) {
		playerPaddle.width /= 2;
		playerPaddle.centre();
	}
	else {
		gameState = states.GAMEOVER;
	}
};

/* Function to determine what happens when a block collides with the ball,
 * i.e. what direction to turn in */
Ball.prototype.processCollision = function(collisionType) {
	switch(collisionType) {
		case Block.collision.LEFT:
		case Block.collision.RIGHT:
			ball.dx = -ball.dx;
			break;
		case Block.collision.TOP:
		case Block.collision.BOTTOM:
			ball.dy = -ball.dy;
			break;
	}
};

/* Function to update the ball's position based on its speed and direction,
 * called from the render method */
Ball.prototype.update = function() {
	if( (this.x - this.r) < 0 || (this.x + this.r) > SCREEN_WIDTH ) {
		this.dx = -this.dx;
	}
	if( (this.y - this.r) < 0 ) {
		this.dy = -this.dy;
	}
	else if( (this.y + this.r) > SCREEN_HEIGHT ) {
		this.dead();
	}
	
	if( playerPaddle.checkBallIntersect(ball) ) {
		this.dy = -this.dy;
	}
	
	this.x += this.dx;
	this.y += this.dy;
};

/*====================================================================*/

/* Paddle object definition ==========================================*/

/* Constructor for Paddle object - needs initial width and height, movement speed
 * and fill style */
function Paddle(width, height, speed, style) {
	this.x = (SCREEN_WIDTH / 2) - (width / 2);
	this.y = SCREEN_HEIGHT - height;
	this.width = width;
	this.height = height;
	this.style = style;
	this.speed = speed;
}

/* Function to draw paddle object on screen */
Paddle.prototype.draw = function() {
	context.fillStyle = this.style;
	context.beginPath();
	context.rect(this.x, this.y, this.width, this.height);
	context.closePath();
	context.fill();
};

/* Function to centre paddle object on screen */
Paddle.prototype.centre = function() {
	this.x = (SCREEN_WIDTH / 2) - (this.width / 2);
};

Paddle.prototype.moveLeft = function() {
	if( (this.x - this.speed) > 0)
		this.x -= this.speed;
};

Paddle.prototype.moveRight = function() {
	if( ((this.x + this.width) + this.speed) < SCREEN_WIDTH )
		this.x += this.speed;
};

/* Function to determine whether the ball has hit the paddle */
Paddle.prototype.checkBallIntersect = function(ball) {
	if( ((ball.x - ball.r) > this.x) && ((ball.x + ball.r) < (this.x + this.width)) && ((ball.y + ball.r) >= this.y) )
		return true;
	else
		return false;
};

/* Function to update the paddle's position based on key presses */
Paddle.prototype.update = function() {
	if( leftDown ) {
		//console.log("Left pressed")
		this.moveLeft();
		//console.log(this.x);
	}
	else if( rightDown ) {
		//console.log("Right pressed")
		this.moveRight();
		//console.log(this.x);
	}
};
/*====================================================================*/

/* Block object definition ===========================================*/

/* Constructor for block object */
function Block(x, y, width, height, sstyle, fstyle) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.sstyle = sstyle;
	this.fstyle = fstyle;
	Block.collision = { LEFT: 0, RIGHT: 1, TOP: 2, BOTTOM: 3 };
}

Block.prototype.draw = function() {
	context.strokeStyle = this.sstyle;
	context.fillStyle = this.fstyle;
	context.beginPath();
	context.rect(this.x, this.y, this.width, this.height);
	context.closePath();
	context.stroke();
	context.fill();
};

/* Function to determine whether the ball has hit a particular block instance */
Block.prototype.checkBallIntersect = function(ball) {
	if( ((ball.x - ball.r) > this.x) && ((ball.x + ball.r) < (this.x + this.width)) ) {
		/* Bottom edge of block */
		if( ((ball.y - ball.r) < (this.y + this.height)) && ((ball.y - ball.r) > this.y) )
			return Block.collision.BOTTOM;
		/* Top edge of block */
		if( ((ball.y + ball.r) > this.y) && ((ball.y + this.r) < (this.y + this.height)) )
			return Block.collision.TOP;
	}
	else if( ((ball.y - ball.r) > this.y) && ((ball.y + this.r < (this.y + this.height)) ) ) {
		// Left edge of block
		if( ((ball.x + ball.r) < (this.x + this.width)) && ((ball.x + ball.r) > this.x) )
			return Block.collision.LEFT;
		// Right edge of block
		if( ((ball.x - ball.r) < (this.x + this.width)) && ((ball.x - ball.r) > this.x) )
			return Block.collision.RIGHT;
	}
	else
		return null;
};
/*====================================================================*/

/* Block list object definition ======================================*/

/* BlockList constructor - container object for multiple blocks, to easily draw them
 * and determine whether the ball has collided with either of them.
 *
 * Here, freePx is the number of free pixels after the rows of blocks - blocks will be drawn on the screen
 * up to this value */

function BlockList(freePx) {
	this.rows = ( SCREEN_HEIGHT - freePx ) / BLOCK_SIZE;
	this.columns = SCREEN_WIDTH / BLOCK_SIZE;
	this.blocks = [];
}
	

BlockList.prototype.addBlocks = function(style) {
	var fstyle;
	for(var row=0; row<this.rows; row++) {
		for( var column=0; column<this.columns; column++ ) {
			/* Alternate between black filled blocks and white blocks with black outline in a pattern
			 * (black-white-black-white-...) */
			if( row % 2 === 0 ) {
				if( column % 2 === 0 )
					fstyle = "rgb(0,0,0)";
				else
					fstyle = "rgb(255,255,255)";
			}
			else {
				if( column % 2 === 0 )
					fstyle = "rgb(255,255,255)";
				else
					fstyle = "rgb(0,0,0)";
			}
			
			/* Determine the array index of each of the blocks - based on rows and columns */	
			this.blocks[(row * this.columns) + column] = new Block(column*BLOCK_SIZE, row*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, style, fstyle);
		}
	}
};

BlockList.prototype.removeBlock = function(index) {
	this.blocks[index] = null;
};

/* Function to determine whether the ball has collided with any of the blocks in the blocklist */
BlockList.prototype.checkBallIntersect = function(ball) {
	/* loop through each of the blocks to determine whether the ball has collided */
	for( var i=0; i<this.blocks.length; i++ ) {
		if( this.blocks[i] !== null ) {
			var collisionType = this.blocks[i].checkBallIntersect(ball);
			console.log(collisionType);
			if( collisionType != null ) {
				/* If collision has occurred, remove block from screen (by setting it to null)
				 * 	(null has been used here instead of removing it from the array altogether,
				 	* as removing it from the array would mess up the array's indexing system) */
				this.removeBlock(i);
				console.log("Collision, block index " + i);
				return collisionType;
			}
		}
	}
	return null;
};

/* Draw all of the blocks in the blocklist onto the canvas */
BlockList.prototype.drawBlocks = function() {
	for( var i=0; i<this.blocks.length; i++ ) {
		if( this.blocks[i] !== null )
			this.blocks[i].draw();
	}
};

/* Function to see if the game has been one - see if any blocks are remaining */
BlockList.prototype.checkGameWin = function() {
	for( var i=0; i<this.blocks.length; i++ ) {
		if( this.blocks[i] !== null )
			return false;
	}
	console.log("Game has been won.");
	return true;
};
/*====================================================================*/

/* Load additional resources required for the game to work, in this case the company's logo
 * on the splash screen */
function loadResources() {
	companyLogoImg.src = "images/logo_mini.png";
	companyLogoImg.onload = startRender;
	
	companyLogoImgWidth = companyLogoImg.width;
	companyLogoImgHeight = companyLogoImg.height;
}

function drawCompanyLogo(x, y) {
	//context.drawImage(companyLogoImg)
	context.drawImage(companyLogoImg, x - (companyLogoImgWidth/2), y - (companyLogoImgHeight/2));
}

/* Function to display a message on the canvas, i.e. splash screen, or game has been won or lost */
function displayMessage(message, centrepos, style, font) {
	context.fillStyle = style;
	context.font = font;
	context.fillText(message, SCREEN_WIDTH/centrepos, SCREEN_HEIGHT/2);
}

/* A function to determine what to do from one game 'state' to the next - start the game
 * if not started already, and restart if game is over. This is called by the onKeyDown function
   each time a key is pressed */
function handleState() {
	if( gameState == states.INITIAL )
		gameState = states.STARTED;
	else if( gameState == states.GAMEOVER || gameState == states.GAMEWIN ) {
		setInitial();
		gameState = states.STARTED;
	}
}

 /* A function to handle each of the key presses, when a key has first been pressed down.
  * Sets the relevant left and right key state variables to true if they are pressed. */
function onKeyDown(evt) {
	handleState();
	
	if( evt.keyCode == 39 ) rightDown = true;
	else if( evt.keyCode == 37 ) leftDown = true;
}

/* A function to handle each of the key releases - set relevant left and right key state variables
 * to false if they have been released */
function onKeyUp(evt) {
	if( evt.keyCode == 39 ) {
		//console.log("right arrow key released")
		rightDown = false;
	}
	else if( evt.keyCode == 37 ) {
		//console.log("left arrow key released")
		leftDown = false;
	}
}

/* Function called each time the mouse is moved, to update the paddle's coordinates accordingly */
function onMouseMove(evt) {
	if (evt.pageX > canvasMinX && evt.pageX < canvasMaxX) {

		/* x coordinate of paddle calculated by subtracting the canvas' top left corner x coordinate
		 * from the browser's top left corner coordinate, and then subtracting half the paddle's width */
		var xCoord = evt.pageX - canvasMinX - (playerPaddle.width/2);

		/* check to see if the x coordinate of where the paddle would move is in a sensible location,
		 * i.e. not going past the canvas' edges */
		if( xCoord > 0 && (xCoord + playerPaddle.width) < SCREEN_WIDTH )
			playerPaddle.x = xCoord;
	}
}

/* Function called each time the mouse has been clicked (pressed down and released).
 * Used in the splash screen to start the game, and the win / gameover screens to restart upon click */
function onMouseUp() {
	handleState();
}

/* bind each of the necessary callbacks triggered by events */
$(document).keydown(onKeyDown);
$(document).keyup(onKeyUp);
$(document).mousemove(onMouseMove);
$(document).mouseup(onMouseUp);

/* Function to clear the screen (uses clearrect to draw a blank rectangle), called by the render function */
function clear() {
	context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/* Function to spawn render method in a new thread, called at a given interval (in milliseconds) */
function startRender() {
	intervalID = setInterval(render, INTERVAL);
	console.log("Render() started, ID=" + intervalID);
}

/* Function to redraw each of the items and update their logic.
 * Also determines what to do if the game has been won or lost. */
function render() {
	if( gameState == states.INITIAL ) {
		clear();
		displayMessage("Press any key, or click...", 8, "rgb(0,0,0)", "bold 32px Arial");
		drawCompanyLogo(SCREEN_WIDTH/2, 400);
		return;
	}
	else if( gameState == states.STARTED ) {
		playerPaddle.update();
		ball.update();
		var collisionType = blocks.checkBallIntersect(ball);
		ball.processCollision(collisionType);
		
		if( blocks.checkGameWin() )
			gameState = states.GAMEWIN;
		

		//console.log(arr);
	}
	else if( gameState == states.GAMEOVER ) {
		clear();
		displayMessage("Game Over!", 8, "rgb(0,0,0)", "bold 64px Arial");
		return;
	}
	else if( gameState == states.GAMEWIN ) {
		clear();
		displayMessage("You Win!!!", 8, "rgb(0,0,0)", "bold 64px Arial");
		return;
	}
	
	clear();
	playerPaddle.draw();
	blocks.drawBlocks();
	ball.draw();
}

/* Function to set / reset each of the objects to their initial state, used to start
 * or restart the game. */
function setInitial() {
	gameState = states.INITIAL;

	playerPaddle = new Paddle(100, 25, 8, "rgb(0, 0, 0)");
	playerPaddle.centre();
	playerPaddle.draw();
	
	ball = new Ball(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 8, 4, "rgb(0, 0, 0)");
	
	blocks = new BlockList(200);
	blocks.addBlocks("rgb(0, 0, 0)");
}

/* Function called when the webpage is loaded */
function init() {
	context = $("#demo-canvas")[0].getContext("2d");
	canvasMinX = $('#demo-canvas').offset().left;
	canvasMaxX = canvasMinX + SCREEN_WIDTH;
	setInitial();
	companyLogoImg = new Image();

	loadResources();	
}	

$(document).ready(init);

