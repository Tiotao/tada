import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js"

export default class Canvas extends React.Component {
	constructor(props) {
		super(props);

		this.animate = this.animate.bind(this);
		this.updateChart = this.updateChart.bind(this);
		this.resize = this.resize.bind(this);
	}

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(1000, 800, {
			transparent: false,
			resolution: 1,
			antialias: true
		});

		this.refs.canvas.appendChild(this.renderer.view);

		window.addEventListener("resize", this.resize);
		this.resize();

		this.stage = new PIXI.Container();

		var box = new PIXI.Container();
    var dot = new PIXI.Graphics();
    box.x = 300;
    box.y = 200;
    box.pivot.x = box.width / 2;
    box.pivot.y = box.height / 2;

    box.addChild(dot);

    dot.beginFill(3093046);
    dot.drawCircle(0, 0, 50);

    dot.interactive = true;
    dot.buttonMode = true;

  //   var onButtonDown = function() {
  //   	console.log("asdfasdf")
		// 	var x = this.x;
		// 	var y = this.y;
		// 	var gx = this.toGlobal(this.stage.position);
		// 	console.log(x, y, gx)
		// }

    dot
      // .on('pointerdown', onButtonDown)
      .on('pointerover', onButtonOver)
      .on('pointerout', onButtonOut);

    function onButtonOver() {
    	var stage = this.parent.parent;

			var viewportOffset = document.getElementById("canvas").getBoundingClientRect();

			var top = viewportOffset.top;
			var left = viewportOffset.left;

			var canvasPosition = new PIXI.Point(left, top);

			var elementPostion = this.parent.toGlobal(canvasPosition);
			console.log(elementPostion)

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

		this.animate();
	}


	// shouldComponentUpdate(nextProps, nextState) {
	// 	return nextProps.data !== this.props.data;
	// }

	// componentWillReceiveProps(nextProps) {
	// 	this.updateChart(nextProps);
	// }

	animate() {
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

