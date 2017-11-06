import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js"

export default class Canvas extends React.Component {
	constructor(props) {
		super(props);

		this.animate = this.animate.bind(this);
		this.updateChart = this.updateChart.bind(this);
	}

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(1000, 700, {
			transparent: false,
			resolution: 1,
			antialias: true
		});
		this.refs.canvas.appendChild(this.renderer.view);

		this.stage = new PIXI.Container();

		var dot = new PIXI.Graphics();
		dot.beginFill(16777215);
		dot.drawRoundedRect(0, 0, 40, 40, 8);
		dot.finalX = 20;
		dot.finalY = 20;
		dot.x = Math.random() * 10;
		dot.y = Math.random() * 10;
		dot.interactive = true;
		dot.on('pointerdown', ()=> {
			console.log("yooooo");
		})
		
		this.dot = dot;
		this.stage.addChild(this.dot);

		// this.animate();
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	return nextProps.data !== this.props.data;
	// }

	// componentWillReceiveProps(nextProps) {
	// 	this.updateChart(nextProps);
	// }

	animate() {
		// var data = this.props.labelData;
		// this.dot.x += 1;

		this.renderer.render(this.stage);
		this.frame = requestAnimationFrame(this.animate);
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
			<div class="Canvas" ref="canvas">
			</div>
		);
	}
}

