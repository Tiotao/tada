import React from "react";
import axios from "axios";

import Label from "./Label";

export default class LeftBar extends React.Component {
	constructor(props) {
		super();
	}

	render() {
		const labels = this.props.labels;

		let Labels 

		if(labels) {
			Labels = labels.map((label) => {
				return <Label key={label._id} {...label} handleLabelData={this.props.handleLabelData} selected={this.props.selected}/>;
			});
		}

		return (
			<div class="LeftBar">
				<ul class="LeftBarLabels">{Labels} </ul>
			</div>
		);
	}
}