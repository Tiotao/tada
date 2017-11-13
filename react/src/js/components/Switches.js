import React from "react";
import $ from "jquery";

export default class Switches extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			x: "byPosted",
			y: "byViews",
			time: "3600"
		}

		this.handleSwitchX = this.handleSwitchX.bind(this);
		this.handleSwitchY = this.handleSwitchY.bind(this);
		this.handleSwitchTime = this.handleSwitchTime.bind(this);
	}

	handleSwitchX(e) {
		e.preventDefault();

		if(this.state.x == e.target.id) return;
		else {
			this.setState({
				x: e.target.id
			})
			$(e.target).addClass('active');
			$(e.target).siblings().removeClass('active');

			this.props.handleSwitch("x", this.state.x);
		}
	}

	handleSwitchY(e) {
		e.preventDefault();
		
		if(this.state.y == e.target.id) return;
		else {
			this.setState({
				y: e.target.id
			})
			$(e.target).addClass('active');
			$(e.target).siblings().removeClass('active');

			this.props.handleSwitch("y", this.state.y);
		}
	}

	handleSwitchTime(e) {
		e.preventDefault();

		if(this.state.time == e.target.id) return;
		else {
			this.setState({
				time: e.target.id
			})
			$(e.target).addClass('active');
			$(e.target).siblings().removeClass('active');

			this.props.handleSwitch("time", e.target.id);
		}
	}

	render() {
		return (
			<div>
				<div class="SwitchContainerX">
					<h1 class="SwitchTitleX" data="byPosted">X</h1>
					<button type="button" id="byPosted" class="Switch active" onClick={this.handleSwitchX}>By posted time</button>
					<button type="button" id="byMentioned" class="Switch" onClick={this.handleSwitchX}>By mentioned time</button>
				</div>
				<div class="SwitchContainerY">
					<h1 class="SwitchTitleY" data="byViews">Y</h1>
					<button type="button" id="byViews" class="Switch active" onClick={this.handleSwitchY}>By views</button>
					<button type="button" id="byLikes" class="Switch" onClick={this.handleSwitchY}>By likes</button>
				</div>
				<div class="SwitchTimeline">
					<button type="button" id="3600" class="Switch active" onClick={this.handleSwitchTime}>Every 1 h</button>
					<button type="button" id="21600" class="Switch" onClick={this.handleSwitchTime}>Every 6 h</button>
					<button type="button" id="43200" class="Switch" onClick={this.handleSwitchTime}>Every 12 h</button>
				</div>
			</div>
		);
	}
}