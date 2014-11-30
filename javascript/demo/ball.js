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
