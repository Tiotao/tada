import React from "react";
import Label from "./Label";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<ul class="TopBarLabels">
				<li class="TopBarLabel">
					<p class="TopBarLabelName">{this.props.name}</p>
					<div class="TopBarLabelRemove"></div>
				</li>
			</ul>
		);
	}
}