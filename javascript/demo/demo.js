	/* HTML5 Canvas Demo
	 * Jmoey Web Design (2014)
	 */

(function($){
	var SCREEN_WIDTH = 500;
	var SCREEN_HEIGHT = 500;
	var BLOCK_SIZE = 50;
	var FPS = 30;

	var NUM_LIVES = 3;

	var context;

	var leftDown, rightDown;
	var playerPaddle;
	var ball;
	var blocks;

	var testBlock;

	var gameStarted;
	var gameover;

	/* Ball object definition ============================================*/
	function Ball(x, y, r, speed, style) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.dx = speed;
		this.dy = speed;
		this.style = style;
		this.livesLeft = NUM_LIVES;
	}

	Ball.prototype.draw = function() {
		context.fillStyle = this.style;
		context.beginPath();
		context.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		context.closePath();
		context.fill();
	}

	Ball.prototype.centre = function() {
		this.x = SCREEN_WIDTH / 2;
		this.y = SCREEN_HEIGHT / 2;
	}

	Ball.prototype.dead = function() {
		this.livesLeft--;
		this.centre();
		if( this.livesLeft > 0 ) {
			playerPaddle.width /= 2;
			playerPaddle.centre();
		}
		else
			gameover = true;
	}

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
	}

	/*====================================================================*/

	/* Paddle object definition ==========================================*/
	function Paddle(width, height, speed, style) {
		this.x = (SCREEN_WIDTH / 2) - (width / 2);
		this.y = SCREEN_HEIGHT - height;
		this.width = width;
		this.height = height;
		this.style = style;
		this.speed = speed;
	}

	Paddle.prototype.draw = function() {
		context.fillStyle = this.style;
		context.beginPath();
		context.rect(this.x, this.y, this.width, this.height);
		context.closePath();
		context.fill();
	}

	Paddle.prototype.centre = function() {
		this.x = (SCREEN_WIDTH / 2) - (this.width / 2);
	}

	Paddle.prototype.moveLeft = function() {
		if( (this.x - this.speed) > 0)
			this.x -= this.speed;
	}

	Paddle.prototype.moveRight = function() {
		if( ((this.x + this.width) + this.speed) < SCREEN_WIDTH )
			this.x += this.speed;
	}

	Paddle.prototype.checkBallIntersect = function(ball) {
		if( ((ball.x - ball.r) > this.x) && ((ball.x + ball.r) < (this.x + this.width)) && ((ball.y + ball.r) >= this.y) )
			return true;
		else
			return false;
	}

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
	}
	/*====================================================================*/

	/* Block object definition ===========================================*/
	function Block(x, y, width, height, sstyle, fstyle) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.sstyle = sstyle;
		this.fstyle = fstyle;
	}

	Block.prototype.draw = function() {
		context.strokeStyle = this.sstyle;
		context.fillStyle = this.fstyle;
		context.beginPath();
		context.rect(this.x, this.y, this.width, this.height);
		context.closePath();
		context.stroke();
		context.fill();
	}

	Block.prototype.checkBallIntersect = function(ball) {
		if( ((ball.x - ball.r) > this.x) && ((ball.x + ball.r) < (this.x + this.width)) ) {
			/* Bottom edge of block */
			if( ((ball.y - ball.r) < (this.y + this.height)) && ((ball.y - ball.r) > this.y) )
				return true;
			/* Top edge of block */
			if( ((ball.y + ball.r) > this.y) && ((ball.y + this.r) < (this.y + this.height)) )
				return true;
		}
		else
			return false;
	}
	/*====================================================================*/

	/* Block list object definition ======================================*/
	function BlockList(freePx) {
		this.rows = ( SCREEN_HEIGHT - freePx ) / BLOCK_SIZE;
		this.columns = SCREEN_WIDTH / BLOCK_SIZE;
		this.blocks = [];
	}
		

	BlockList.prototype.addBlocks = function(style) {
		var fstyle;
		for(var row=0; row<this.rows; row++) {
			for( var column=0; column<this.columns; column++ ) {
				if( row % 2 == 0 ) {
					if( column % 2  == 0 )
						fstyle = "rgb(0,0,0)";
					else
						fstyle = "rgb(255,255,255)";
				}
				else {
					if( column % 2  == 0 )
						fstyle = "rgb(255,255,255)";
					else
						fstyle = "rgb(0,0,0)";
				}
					
				this.blocks[(row * this.columns) + column] = new Block(column*BLOCK_SIZE, row*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, style, fstyle);
			}
		}
	}

	BlockList.prototype.drawBlocks = function() {
		for( var i=0; i<this.blocks.length; i++ ) {
			this.blocks[i].draw();
		}
	}
	
	BlockList.prototype.computeBallPosition = function(ball) {
		var ballColumn = Math.round(ball.x / BLOCK_SIZE);
		var ballRow = Math.round(ball.y / BLOCK_SIZE);

		return [ballColumn, ballRow];
	}
	/*====================================================================*/

	function gameOver(style, font) {
		context.fillStyle = style;
		context.font = font;
		context.fillText("Game Over!", SCREEN_WIDTH/8, SCREEN_HEIGHT/2);
	}

	function gameMenu(style, font) {
		context.fillStyle = style;
		context.font = font;
		context.fillText("Press any key to start...", SCREEN_WIDTH/8, SCREEN_HEIGHT/2);
	}

	function onKeyDown(evt) {
		if( ! gameStarted) gameStarted = true;
		if( evt.keyCode == 39 ) rightDown = true;
		else if( evt.keyCode == 37 ) leftDown = true;
	}

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

	$(document).keydown(onKeyDown);
	$(document).keyup(onKeyUp);

	function clear() {
		context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	}

	function render() {
		if( ! gameStarted ) {
			clear();
			gameMenu("rgb(0,0,0)", "bold 32px Arial");
			return;
		}
		else if( ! gameover ) {
			playerPaddle.update();
			ball.update();
			if( testBlock.checkBallIntersect(ball) )
				console.log("COLLISION!");
			console.log(blocks.computeBallPosition(ball));
		}
		else {
			clear();
			gameOver("rgb(0,0,0)", "bold 64px Arial");
			return;
		}
		
		clear();
		playerPaddle.draw();
		blocks.drawBlocks();
		//testBlock.draw();

		ball.draw();
	}

	function init() {
		context = $("#demo-canvas")[0].getContext("2d");
		gameStarted = false;
		gameover = false;

		playerPaddle = new Paddle(100, 25, 8, "rgb(0, 0, 0)");
		playerPaddle.centre();
		playerPaddle.draw();
		
		ball = new Ball(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 8, 4, "rgb(0, 0, 0)");
		
		blocks = new BlockList(200);
		blocks.addBlocks("rgb(0, 0, 0)");
		
		testBlock = new Block(250, 250, 100, 100, "black", "white");

		intervalID = setInterval(render, FPS);		
	}	

	$(document).ready(init);
})(jQuery);
