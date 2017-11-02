import React from "react";
import Label from "./Label";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div class="TopBarLabels">
				<div class="CurrentLabel">
					<p class="CurrentLabelName">{this.props.name}</p>
					<ul class="CurrentLabelRelations">
					</ul>
				</div>
			</div>
		);
	}
}