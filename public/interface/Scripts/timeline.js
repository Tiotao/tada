var width = 1000
	, height =550;

// var renderer2 = PIXI.autoDetectRenderer(width, height, {
// 	transparent: true,
// 	resolution: 1,
// 	antialias: true
// });

// document.getElementById('Footer').appendChild(renderer2.view);
// var stage = new PIXI.Container();


var lowerHandle = $('.TimelineHandleLower')
	, upperHandle = $('.TimelineHandleUpper')
	, slider = $('.TimelineSlider')
	, canvas = $('canvas');

addListeners();

function addListeners(){
	// lowerHandle.on('mousedown', lowerHandleMouseDown);
	// upperHandle.on('mousedown', upperHandleMouseDown);
	slider.on('mousedown', sliderMouseDown);
	window.addEventListener('mouseup', mouseUp, false);
}

function mouseUp()
{
	// window.removeEventListener('mousemove', lowerHandleMove, true);
	// window.removeEventListener('mousemove', upperHandleMove, true);
	window.removeEventListener('mousemove', sliderMove, true);
}

function sliderMouseDown(e) {
	sliderMove.mouseDown = e.clientX;
	sliderMove.oldX = parseInt(slider.css('right'))
	window.addEventListener('mousemove', sliderMove, true);
}

function sliderMove(e) {
	slider.css({right: sliderMove.mouseDown - e.clientX + sliderMove.oldX + 'px'});
	canvas.css({right: e.clientX - sliderMove.mouseDown - sliderMove.oldX + 'px'});
}

// function lowerHandleMouseDown(e){
// 	window.addEventListener('mousemove', lowerHandleMove, true);
// }

// function lowerHandleMove(e){
// 	lowerHandle.css({left: e.clientX + 'px'});
// }

// function upperHandleMouseDown(e){
// 	window.addEventListener('mousemove', upperHandleMove, true);
// }

// function upperHandleMove(e){
// 	upperHandle.css({left: e.clientX + 'px'});
// }