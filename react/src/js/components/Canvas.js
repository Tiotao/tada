import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js";

export default class Canvas extends React.Component {
	constructor(props) {
		super(props);

		this.animate = this.animate.bind(this);
		this.updateChart = this.updateChart.bind(this);
		this.resize = this.resize.bind(this);
		this.handleVideoPosition = this.handleVideoPosition.bind(this);
		this.drawDots = this.drawDots.bind(this);
		this.drawDot = this.drawDot.bind(this);
	}

	componentDidUpdate() {
		
		if(this.props.videos) {
			var positions = this.props.videos.positions;
			var videoIDs = Object.keys(positions);

			// var pos3600 = videoIDs.map(this.handleVideoPosition)
			videoIDs.map(this.handleVideoPosition);

			//3600 timeframe
			this.drawDots(pos3600);
		}
	}

	handleVideoPosition(videoID) {
		var positions = this.props.videos.positions[videoID]['3600'];
		
		if(positions[0]) {
			var x = positions[0][0];
			var y = positions[0][1];
			this.drawDot(x, y, videoID);
		}
		else {
			return;
		}
	}

	drawDot(x, y, id) {
		var canvasHight = 300;
		var dotMargin = 15;
		
			var box = new PIXI.Container();
			var dot = new PIXI.Graphics();
			box.x = x * dotMargin;
			// box.y = - pos[i][1] * dotMargin + canvasHight;
			box.y = this.random();
			box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2;
	    box.index = id;

	    var tweenY = new Tween(box, "y", - y * dotMargin + canvasHight, 60, true);
	    tweenY.easing = Tween.outCubic;

	    box.addChild(dot);
	    dot.beginFill(3093046);
	    dot.drawCircle(0, 0, 5);

	    dot.interactive = true;
	    dot.buttonMode = true;

	    dot
	      .on('pointerdown', onButtonDown)
	      .on('pointerover', onButtonOver)
	      .on('pointerout', onButtonOut);

	    function onButtonDown() {
	    	// var videoID = 
	    	console.log(this)
	    }

	  	function onButtonOver() {
	  		var stage = this.parent.parent;

				var viewportOffset = document.getElementById("canvas").getBoundingClientRect();

				var top = viewportOffset.top;
				var left = viewportOffset.left;

				var canvasPosition = new PIXI.Point(left, top);

				var elementPostion = this.parent.toGlobal(canvasPosition);

				var i = document.createElement('IMG');
				i.id = "preview";
				i.src = './interface/images/ea-white.png'
				i.width = 50;
				i.height = 50;
				i.style = "position: absolute; left: " + elementPostion.x + "px; top: " + elementPostion.y + "px;"
				document.body.appendChild(i);
	    }

	    function onButtonOut() {
	    	document.getElementById('preview').outerHTML = "";
	    }
	    this.stage.addChild(box);

	}

	drawDots(pos) {
		var canvasHight = 300;
		var dotMargin = 15;
		for(var i = 0; i < pos.length; i++) {
			var box = new PIXI.Container();
			var dot = new PIXI.Graphics();
			box.x = pos[i][0] * dotMargin;
			// box.y = - pos[i][1] * dotMargin + canvasHight;
			box.y = this.random();
			box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2;
	    box.index = 

	    var tweenY = new Tween(box, "y", - pos[i][1] * dotMargin + canvasHight, 60, true);
	    tweenY.easing = Tween.outCubic;

	    box.addChild(dot);
	    dot.beginFill(3093046);
	    dot.drawCircle(0, 0, 5);

	    dot.interactive = true;
	    dot.buttonMode = true;

	    dot
	      .on('pointerdown', onButtonDown)
	      .on('pointerover', onButtonOver)
	      .on('pointerout', onButtonOut);

	    function onButtonDown() {
	    	// var videoID = 
	    	console.log(this)
	    }

	  	function onButtonOver() {
	  		var stage = this.parent.parent;

				var viewportOffset = document.getElementById("canvas").getBoundingClientRect();

				var top = viewportOffset.top;
				var left = viewportOffset.left;

				var canvasPosition = new PIXI.Point(left, top);

				var elementPostion = this.parent.toGlobal(canvasPosition);

				var i = document.createElement('IMG');
				i.id = "preview";
				i.src = './interface/images/ea-white.png'
				i.width = 50;
				i.height = 50;
				i.style = "position: absolute; left: " + elementPostion.x + "px; top: " + elementPostion.y + "px;"
				document.body.appendChild(i);
	    }

	    function onButtonOut() {
	    	document.getElementById('preview').outerHTML = "";
	    }
	    this.stage.addChild(box);
		}
	}

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(1000, 800, {
			transparent: true,
			resolution: 1,
			antialias: true
		});

		this.refs.canvas.appendChild(this.renderer.view);

		window.addEventListener("resize", this.resize);
		this.resize();

		this.stage = new PIXI.Container();

		this.animate();
	}

	random() {
    var min = -500, max = 500;
    return Math.floor(Math.random()*(max-min+1)+min);
  }


	// shouldComponentUpdate(nextProps, nextState) {
	// 	return nextProps.data !== this.props.data;
	// }

	// componentWillReceiveProps(nextProps) {
	// 	this.updateChart(nextProps);
	// }

	animate() {
		Tween.runTweens();
		this.renderer.render(this.stage);
		this.frame = requestAnimationFrame(this.animate);
	}

	resize() {
		var w = window.innerWidth;
		var h = window.innerHeight / 2;

		this.renderer.resize(w, h);
	}

	updateChart(props) {
		var data = props.labelData;
		var width = 2500
			, height =800;
		if(data.history) {
			for(var j = 0; j < data.history.videos.length; j++) {
				for(var k = 0; k < data.history.videos[j].length; k++) {
					console.log(j, k)
					var dot = new PIXI.Graphics();
					dot.beginFill(16777215);
					dot.drawRoundedRect(0, 0, 15, 15, 8);
					dot.x = width - 20*(j+1);
					dot.y = height - 20*(k+1);
					dot.interactive = true;
					dot.buttonMode = true;
					dot.index = [j,k];

					// dot.on('mousedown', (e) => {
		   //      var videoId = data.history.videos[e.target.index[0]][e.target.index[1]].id;

		   //      $.get('http://localhost:3000/api/videos/'+videoId, function(data, status){
		   //        showVideo(data);
		   //      })
					// })
					this.stage.addChild(dot); 
				}
			}
		}
	}

	render() {
		return (
			<div class="Canvas" ref="canvas" id="canvas">
			</div>
		);
	}
}

