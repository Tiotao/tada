import React from "react";

export default class Selected extends React.Component {
	constructor(props) {
		super(props);

		this.handleRemove = this.handleRemove.bind(this);
	}

	handleRemove(e) {
		e.preventDefault();

		e.currentTarget.parentNode.parentNode.removeChild(e.currentTarget.parentNode);
	}

	render() {

		return (
			<li class="TopBarLabel">
				<p class="TopBarLabelName">{this.props.name}</p>
				<div class="TopBarLabelRemove" onClick={this.handleRemove}></div>
			</li>
		);
	}
}