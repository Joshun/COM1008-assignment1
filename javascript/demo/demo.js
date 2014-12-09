	/* HTML5 Canvas Demo
	 * Jmoey Web Design (2014)
	 */

(function($){
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
		else {
			gameState = states.GAMEOVER;
		}
	}
	
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
	}

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

	BlockList.prototype.retrieveBlock = function(x, y) {
			if( y < this.rows ) {
				console.log("found");
				// need to set this to null
				return (y * BLOCKS_PER_ROW) + x;
			}
			else
				return null;
	
	}
	
	BlockList.prototype.checkBallIntersect = function(ball) {
		for( var i=0; i<this.blocks.length; i++ ) {
			if( this.blocks[i] != null ) {
				var collisionType = this.blocks[i].checkBallIntersect(ball);
				if( collisionType != null ) {
					this.blocks[i] = null;
					return collisionType;
				}
			}
		}
		return null;
	}

	BlockList.prototype.drawBlocks = function() {
		for( var i=0; i<this.blocks.length; i++ ) {
			if( this.blocks[i] != null )
				this.blocks[i].draw();
		}
	}
	
	BlockList.prototype.computeBallPosition = function(ball) {
		var ballColumn = Math.round(ball.x / BLOCK_SIZE);
		var ballRow = Math.round(ball.y / BLOCK_SIZE);

		return [ballColumn, ballRow];
	}
	
	BlockList.prototype.checkGameWin = function() {
		for( var i=0; i<this.blocks.length; i++ ) {
			if( this.blocks[i] != null )
				return false;
		}
		return true;
	}
	/*====================================================================*/

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

	function displayMessage(message, centrepos, style, font) {
		context.fillStyle = style;
		context.font = font;
		context.fillText(message, SCREEN_WIDTH/centrepos, SCREEN_HEIGHT/2);
	}

	function handleState() {
		if( gameState == states.INITIAL )
			gameState = states.STARTED;
		else if( gameState == states.GAMEOVER || gameState == states.GAMEWIN ) {
			setInitial();
			gameState = states.STARTED;
		}
	}

	function onKeyDown(evt) {
		handleState();
		
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

	function onMouseMove(evt) {
		if (evt.pageX > canvasMinX && evt.pageX < canvasMaxX) {
			var xCoord = evt.pageX - canvasMinX - (playerPaddle.width/2);
			if( xCoord > 0 && (xCoord + playerPaddle.width) < SCREEN_WIDTH )
				playerPaddle.x = evt.pageX - canvasMinX - (playerPaddle.width/2);
		}
    }
    
    function onMouseUp() {
		handleState();
	}

	$(document).keydown(onKeyDown);
	$(document).keyup(onKeyUp);
	$(document).mousemove(onMouseMove);
	$(document).mouseup(onMouseUp);

	function clear() {
		context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	}

	function startRender() {
		intervalID = setInterval(render, INTERVAL);
	}

	function render() {
		if( gameState == states.INITIAL ) {
			clear();
			displayMessage("Press any key, or click...", 8, "rgb(0,0,0)", "bold 32px Arial");
			drawCompanyLogo(SCREEN_WIDTH/2, 400)
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
		//testBlock.draw();

		ball.draw();
	}

	function setInitial() {
		gameState = states.INITIAL;

		playerPaddle = new Paddle(100, 25, 8, "rgb(0, 0, 0)");
		playerPaddle.centre();
		playerPaddle.draw();
		
		ball = new Ball(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 8, 4, "rgb(0, 0, 0)");
		
		blocks = new BlockList(200);
		blocks.addBlocks("rgb(0, 0, 0)");
	}

	function init() {
		context = $("#demo-canvas")[0].getContext("2d");
		canvasMinX = $('#demo-canvas').offset().left;
		canvasMaxX = canvasMinX + SCREEN_WIDTH;
		setInitial();
		companyLogoImg = new Image();

		loadResources();
		
		/* intervalID = setInterval(render, INTERVAL);	*/
	}	

	$(document).ready(init);
})(jQuery);
