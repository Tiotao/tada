import React from "react";
import $ from "jquery";

export default class Filter extends React.Component {
	constructor(props) {
		super();

		this.drawFilterGraph = this.drawFilterGraph.bind(this);
	}

	componentDidMount() {

		var canvas = document.getElementById(this.props.id);
		var rect = {};
		var ctx = canvas.getContext('2d');
		var drag = false;

		canvas.addEventListener('mousedown', mouseDown, false);
		canvas.addEventListener('mouseup', mouseUp, false);
		canvas.addEventListener('mousemove', mouseMove, false);

		rect.h = $('.FilterLeft').height();

		function mouseDown(e) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			rect.startX = e.pageX - this.getBoundingClientRect().x;
			rect.startY = this.getBoundingClientRect().y - this.getBoundingClientRect().top;
			drag = true;
		}

		function mouseUp(e) {
			drag = false;
		}

		function mouseMove(e) {
			if(drag) {
				rect.w = (e.pageX - this.getBoundingClientRect().x) - rect.startX;
				rect.y = (e.pageY - this.getBoundingClientRect().y) - rect.startY;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				draw();
			}
		}

		function draw() {
      ctx.lineWidth = 1;
			ctx.strokeStyle = '#fff';
			ctx.setLineDash([6]);
			ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
		}
	}

	drawFilterGraph() {
		if(this.props.data) {
			var data = this.props.data;

			var x = []; //x axis

			var strokeWidth = 3;
			for(var i = 0; i < data.length; i++){
				let rgb = [59, 86, 130];

				var strokeHeight = data[i]/2;
				var y = 144 - strokeHeight;

				let styles = {
					strokeWidth: strokeWidth,
					stroke: `rgb(${rgb})`
				}

				x.push(
					<line key={i}
	          x1={i*strokeWidth} x2={i*strokeWidth} y1="144" y2={y}
						style={styles} 
					/>)
			}
			return <svg class="FilterGraph">{x}</svg>
		}
	}

	render() {
		return (
				<div>
					<div>{this.drawFilterGraph()}</div>
					<canvas id={this.props.id} class="FilterCanvas" onMouseDown={this.select}></canvas>
				</div>
		);
	}
}