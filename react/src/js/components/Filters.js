import React from "react";
import $ from "jquery";

export default class Filters extends React.Component {
	constructor(props) {
		super();
	}

	componentDidMount() {
	}

	handleDraggingLeft(e) {
		var sliderLeft = $('.FilterLeftSlider');

		sliderMove.mouseDown = e.clientX;
		sliderMove.oldX = parseInt(sliderLeft.css('right'))
		window.addEventListener('mousemove', sliderMove, true);
		window.addEventListener('mouseup', mouseUp, false);

		function sliderMove(e) {
			var xPosition = sliderMove.mouseDown - e.clientX + sliderMove.oldX;
			if(xPosition < 250 && xPosition > 0) {
				sliderLeft.css({right: xPosition + 'px'});
			}
		}

		function mouseUp()
		{
			window.removeEventListener('mousemove', sliderMove, true);
		}
	}

	handleDraggingRight(e) {
		var sliderRight = $('.FilterRightSlider');

		sliderMove.mouseDown = e.clientX;
		sliderMove.oldX = parseInt(sliderRight.css('right'))
		window.addEventListener('mousemove', sliderMove, true);
		window.addEventListener('mouseup', mouseUp, false);

		function sliderMove(e) {
			var xPosition = sliderMove.mouseDown - e.clientX + sliderMove.oldX;
			if(xPosition < 250 && xPosition > 0) {
				sliderRight.css({right: xPosition + 'px'});
			}
		}

		function mouseUp()
		{
			window.removeEventListener('mousemove', sliderMove, true);
		}
	}

	render() {
		return (
			<div class="Filters">
				<div class="FilterLeft">
					<div class="FilterLeftSlider" onMouseDown ={this.handleDraggingLeft}></div>
				</div>
				<p class="FilterLabel">View count</p>
				<div class="FilterRight">
					<div class="FilterRightSlider" onMouseDown={this.handleDraggingRight}></div>
				</div>
				<p class="FilterLabel">Like ratio</p>
			</div>
		);
	}
}