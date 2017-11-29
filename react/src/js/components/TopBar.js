import React from "react";
import $ from "jquery";

import Selected from "./Selected";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			hidden: false
		}

		this.hideTopBar = this.hideTopBar.bind(this);
	}

	hideTopBar() {
		if(this.state.hidden == false) {
			$('.TopbarContainer').css("top", -310);
			$('.HideTopBarText').html("Show");
			$('.HideTopBarIcon').attr("src", "./interface/images/down.png");
			$('.CanvasHeaderTitle').css("top", 90);
			$('.CanvasHeatmapLegend').css("top", 90);
			$('.SwitchContainerY').css("top", -800);
			this.setState({
				hidden: true
			})
		}
		else {
			$('.TopbarContainer').css("top", 0);
			$('.HideTopBarText').html("Hide");
			$('.HideTopBarIcon').attr("src", "./interface/images/up.png");
			$('.CanvasHeaderTitle').css("top", 400);
			$('.CanvasHeatmapLegend').css("top", 400);
			$('.SwitchContainerY').css("top", -500);
			this.setState({
				hidden: false
			})
		}
	}

	render() {
		const selectedLabels = this.props.selected;
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
				<div class="HideTopBar" onMouseDown={this.hideTopBar}>
					<p class="HideTopBarText">Hide</p>
					<img class="HideTopBarIcon" src="./interface/images/up.png" />
				</div>
			</div>
		);
	}
}