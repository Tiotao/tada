import React from "react";
import $ from "jquery";

export default class Action extends React.Component {
	constructor(props) {
		super();

		this.handleClick = this.handleClick.bind(this);
	}

	handleClick() {
		alert(this.props.action);
	}

	render() {
		return (
				<li class="ActionButton" id={this.props.action}>
					<img class="ActionButtonIcon" src={this.props.icon} onMouseDown={this.handleClick}/>
				</li>
		);
	}
}