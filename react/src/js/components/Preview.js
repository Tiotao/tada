import React from "react";

export default class Preview extends React.Component {
	constructor(props) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e) {
		e.preventDefault();

		console.log("click preview...")
	}

	render() {
		return (
			<div class="preview">{this.props.data}
			</div>
		);
	}
}