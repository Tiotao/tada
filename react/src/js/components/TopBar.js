import React from "react";
import Selected from "./Selected";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const selectedLabels = this.props.selected;
		
		let SelectedLabels

		if(selectedLabels.length > 0) {
			SelectedLabels = selectedLabels.map((labelObj, i) => {
				return <Selected key={labelObj.id} name={labelObj.name} id={labelObj.id} selected={this.props.selected} handleRemove={this.props.handleRemove}/>;
			});
		}

		return (
			<div class="TopBarLabels">
				<ul>{SelectedLabels}</ul>
			</div>
		);
	}
}