import React from "react";
import $ from "jquery";

const xPostedId = "byPosted",
	xPostedText = "X: By Posted Time",
	xMentionedId = "byMentioned",
	xMentionedText = "X: By Mentioned Time";

const yViewId = "byViews",
	yViewText = "Y: By Views",
	yLikeViewId = "byLikeViewRatio",
	yLikeViewText = "Y: By Like/Views";

export default class Switches extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			x: xPostedId,
			y: yViewId,
			time: "86400"
		}

		this.handleSwitchX = this.handleSwitchX.bind(this);
		this.handleSwitchY = this.handleSwitchY.bind(this);
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
			if(e.target.id === xPostedId)
				$('.SwitchXDropdown').html(xPostedText);
			else if(e.target.id === xMentionedId)				
				$('.SwitchXDropdown').html(xMentionedText);

			this.props.handleSwitch("x", this.state.x);
		}
	}

	getAxisName(id){
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
			if(e.target.id === yViewId)
				$('.SwitchYDropdown').html(yViewText);
			else if(e.target.id === yLikeViewId)
				$('.SwitchYDropdown').html(yLikeViewText);

			this.props.handleSwitch("y", this.state.y);
		}
	}

	render() {
		return (
			<div>
				<div class="SwitchContainerX">
					<div class="UpArrow"></div>
					<div class="DropdownButtons">
						<button type="button" id={xPostedId} class="Switch active" onClick={this.handleSwitchX}>{xPostedText}</button>
						<button type="button" id={xMentionedId} class="Switch" onClick={this.handleSwitchX}>{xMentionedText}</button>
					</div>
					<button class="SwitchXDropdown">{xPostedText}</button>
				</div>
				<div class="SwitchContainerY">
					<div class="DownArrow"></div>
					<button class="SwitchYDropdown">{yViewText}</button>
					<div class="DropdownButtons">
						<button type="button" id={yViewId} class="Switch active" onClick={this.handleSwitchY}>{yViewText}</button>
						<button type="button" id={yLikeViewId} class="Switch" onClick={this.handleSwitchY}>B{yLikeViewText}</button>
					</div>
				</div>
			</div>
		);
	}
}