import React from "react";

export default class Header extends React.Component {
	render() {
		return (
			<div class="Header">
				<img class="Logo" src="./interface/images/ea-white.png"/>
				<h1 class="Title">{this.props.title}</h1>
			</div>
		);
	}
}