import React from "react";
import Selected from "./Selected";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const selectedLabels = this.props.selected;
		console.log("Selected labels ", selectedLabels);
		let selectedLabelElements;

		if(selectedLabels.length > 0) {
			selectedLabelElements = selectedLabels.map((labelObj, i) => {
				return <Selected key={labelObj.id} name={labelObj.name} id={labelObj.id} selected={this.props.selected} setVideos={this.props.setVideos}
						removeSelectedLabel={this.props.removeSelectedLabel} handleRemove={this.props.handleRemove}/>;
			});
		}
		return (
			<div class="TopBarLabels">
				<ul>{selectedLabelElements}</ul>
			</div>
		);
	}
}