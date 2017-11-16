import React from "react";
import $ from "jquery";

export default class Filter extends React.Component {
	constructor(props) {
		super();
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

	render() {
		return (
				<div>
					<canvas id={this.props.id} class="FilterCanvas" onMouseDown={this.select}></canvas>
				</div>
		);
	}
}