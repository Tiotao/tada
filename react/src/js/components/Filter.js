import React from "react";
import $ from "jquery";
import TopBar from "./TopBar";

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

		var _this = this;

		function mouseDown(e) {
			if(TopBar.getVisibility() === 'hidden')
				return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			rect.startX = e.pageX - this.getBoundingClientRect().x;
			rect.startY = this.getBoundingClientRect().y - this.getBoundingClientRect().top;
			drag = true;
			//first value of selection
			_this.startFilter = Math.floor((e.pageX - this.getBoundingClientRect().x) /3);

			//update x label
			if(e.target.id == 'view') {
				_this.startLabel = _this.parseViewCountRange([_this.startFilter, 100], _this.props.max)[0];
				$('.view .FilterXStartLabel').html(Math.floor(_this.startLabel));
				$('.view .FilterXStartLabel').css('left', e.pageX - this.getBoundingClientRect().x)
			}
			else {
				_this.startLabel = _this.parseViewLikeRatioRange([_this.startFilter, 100])[0];
				$('.vl_ratio .FilterXStartLabel').html((_this.startLabel * 100).toFixed(1) + "%");
				$('.vl_ratio .FilterXStartLabel').css('left', e.pageX - this.getBoundingClientRect().x)
			}
		}

		function mouseUp(e) {
			drag = false;

			//second value of selection
			var endFilter = Math.floor((e.pageX - this.getBoundingClientRect().x) /3);

			//won't update if selection area is empty
			if(endFilter != _this.startFilter) {
				_this.endFilter = endFilter;

				//update x label
				if(e.target.id == "view") {
					_this.endLabel = _this.parseViewCountRange([0, _this.endFilter], _this.props.max)[1];
					$('.view .FilterXEndLabel').html(Math.floor(_this.endLabel));
					$('.view .FilterXEndLabel').css('left', e.pageX - this.getBoundingClientRect().x);
				}
				else {
					_this.endLabel = _this.parseViewLikeRatioRange([0, _this.endFilter])[1];
					$('.vl_ratio .FilterXEndLabel').html((_this.endLabel * 100).toFixed(1) + "%");
					$('.vl_ratio .FilterXEndLabel').css('left', e.pageX - this.getBoundingClientRect().x)
				}
				
				//make sure End is greater than Start
				if(_this.endFilter < _this.startFilter) {
					var temp = _this.endFilter;
					_this.endFilter = _this.startFilter;
					_this.startFilter = temp;
				}
				_this.props.handleUpdate(this.id, _this.startFilter, _this.endFilter);
			}
		}
		var i = 0;
		function mouseMove(e) {
			if(drag) {

				//update x label
				var endFilter = Math.floor((e.pageX - this.getBoundingClientRect().x) /3);
				if(e.target.id == "view") {
					_this.endLabel = _this.parseViewCountRange([0, endFilter], _this.props.max)[1];
					$('.view .FilterXEndLabel').html(Math.floor(_this.endLabel));
					$('.view .FilterXEndLabel').css('left', e.pageX - this.getBoundingClientRect().x);
				}
				else {
					_this.endLabel = _this.parseViewLikeRatioRange([0, endFilter])[1];
					$('.vl_ratio .FilterXEndLabel').html((_this.endLabel * 100).toFixed(1) + "%");
					$('.vl_ratio .FilterXEndLabel').css('left', e.pageX - this.getBoundingClientRect().x);
				}

				rect.w = (e.pageX - this.getBoundingClientRect().x) - rect.startX;
				rect.y = (e.pageY - this.getBoundingClientRect().y) - rect.startY;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				draw();
			}
		}

		function draw() {
      ctx.lineWidth = 1;
			ctx.strokeStyle = '#333';
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
					<line key={i} id={i}
	          x1={i*strokeWidth} x2={i*strokeWidth} y1="144" y2={y}
						style={styles} 
					/>)
			}
			return <svg class="FilterGraph">{x}</svg>
		}
	}

	/**
	 * Denormalize relative view count range into absolute range
	 * @param {Array<Number>} range - a pair of number represent the relative range [0-100, 0-100]
	 * @param {Number} max_view - max view count ever recorded
	 * @return {Array<Number>} a pair of number represent absolute range of view counts [0-max_view, 0-max_view]
	 *
	 */
	parseViewCountRange(range, max_view) {
		range = range.map((r)=>{
			return (Math.pow(10, r/100 * Math.log10(max_view))-1) ;
		});
		return range;
	}

	/**
	 * Denormalize relative like view ratio range into absolute range
	 * @param {Array<Number>} range - a pair of number represent the relative range [0-100, 0-100]
	 * @return {Array<Number>} a pair of number represent absolute range of like view ratio [0-1, 0-1]
	 *
	 */
	parseViewLikeRatioRange(range) {
		const log101 = 2.0043213737826426;
		range = range.map((r)=>{
			return ((Math.pow(10, r/100 * log101)-1)) / 100 ;
		});
		return range;
	}

	render() {
		return (
				<div class={this.props.id}>
					<div class="FilterYLabels">
						<p class="FilterYLabel">More</p>
						<p class="FilterYLabel">number of videos</p>
						<p class="FilterYLabel">Fewer</p>
					</div>
					<div>{this.drawFilterGraph()}</div>
					<canvas id={this.props.id} class="FilterCanvas" onMouseDown={this.select}></canvas>
					<div class="FilterXLabels">
						<p class="FilterXLabel FilterXStartLabel">0</p>
						<p class="FilterXLabel FilterXEndLabel">100</p>
					</div>
				</div>
		);
	}
}