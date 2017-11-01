import React from "react";
import axios from "axios";

import Label from "./Label";

export default class LeftBar extends React.Component {
	render() {
		const labels = this.props.data;

		let Labels 

		if(labels) {
			Labels = labels.map((label) => {
				return <Label key={label._id} {...label}/>;
			});
			console.log(labels)
		}

		return (
			<div class="LeftBar">
				<ul class="LeftBarLabels">{Labels}</ul>
			</div>
		);
	}
}