var width = 1200
	, height = 600;

var renderer = PIXI.autoDetectRenderer(width, height, {
	transparent: true,
	resolution: 1,
	antialias: true
});

document.getElementById('ChartStage').appendChild(renderer.view);

var stage = new PIXI.Container();

function drawDot() {
	var dot = new PIXI.Graphics();
	dot.beginFill(898989);
	dot.drawRoundedRect(0, 0, 15, 15, 5);
	dot.x = 0;
	dot.y = 0;
	stage.addChild(dot);
}

drawDot();

renderer.render(stage);
