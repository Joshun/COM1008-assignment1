/* HTML5 Canvas Demo
 * Jmoey Web Design (2014)
 */

var SCREEN_WIDTH = 500;
var SCREEN_HEIGHT = 500;
var FPS = 30;

var context;

var leftDown, rightDown;
var playerPaddle;
var ball;

/* Ball object definition ============================================*/
function Ball(x, y, r, speed, style) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.dx = speed;
	this.dy = speed;
	this.style = style;
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

Ball.prototype.update = function() {
	if( (this.x - this.r) < 0 || (this.x + this.r) > SCREEN_WIDTH ) {
		this.dx = -this.dx;
	}
	if( (this.y - this.r) < 0 ) {
		this.dy = -this.dy;
	}
	else if( (this.y + this.r) > SCREEN_HEIGHT ) {
		this.centre();
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

function onKeyDown(evt) {
 	if( evt.keyCode == 39 ) rightDown = true;
 	else if( evt.keyCode == 37 ) leftDown = true;
}

function onKeyUp(evt) {
	if( evt.keyCode == 39 ) {
		console.log("right arrow key released")
		rightDown = false;
	}
	else if( evt.keyCode == 37 ) {
		console.log("left arrow key released")
		leftDown = false;
	}
}

$(document).keydown(onKeyDown);
$(document).keyup(onKeyUp);

function clear() {
	context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function render() {
	playerPaddle.update();
	ball.update();
	
	clear();
	playerPaddle.draw();
	ball.draw();
}

function init() {
	context = $("#demo-canvas")[0].getContext("2d");

	playerPaddle = new Paddle(100, 25, 8, "rgb(0, 0, 0)");
	playerPaddle.centre();
	playerPaddle.draw();
	
	ball = new Ball(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 8, 4, "rgb(0, 0, 0)");

	intervalID = setInterval(render, FPS);		
}	

$(document).ready(init);

