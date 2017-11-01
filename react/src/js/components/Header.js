import React from "react";

export default class Header extends React.Component {
	render() {
		return (
			<div>
				<h1 class="Title">{this.props.title}</h1>
				<img src="./interface/images/ea.png"/>
			</div>
		);
	}
}