import React from "react";
import $ from "jquery";

export default class Timeline extends React.Component {
	constructor(props) {
		super();
	}

	componentDidMount() {
		var lowerHandle = $('.TimelineHandleLower')
			, upperHandle = $('.TimelineHandleUpper')
			, slider = $('.TimelineSlider')
			, canvas = $('canvas');

		addListeners();

		function addListeners(){
			slider.on('mousedown', sliderMouseDown);
			window.addEventListener('mouseup', mouseUp, false);
		}

		function mouseUp()
		{
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
	}

	render() {
		return (
			<div class="Timeline">
				<div class="TimelineSlider">
					<div class="TimelineHandleLower"></div>
					<div class="TimelineHandleUpper"></div>
				</div>
			</div>
		);
	}
}