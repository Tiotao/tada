import React from "react";
import $ from "jquery";

import Selected from "./Selected";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			visibility: 'shown'
		}

		this.hideTopBar = this.hideTopBar.bind(this);
		this.hideBottom = this.hideBottom.bind(this);
	}

	hideTopBar() {
		if(this.state.visibility == 'shown') {
			$('.TopbarContainer').css("top", -300);
			$('.HideTop').css("opacity", 0.3).css('cursor', 'inherit');
			$('.HideTopBarText').html("Show");
			$('.CanvasHeaderTitle').css("top", 90);
			$('.CanvasHeatmapLegend').css("top", 90);
			$('.SwitchContainerY').css("top", -200);
			this.setState({
				visibility: 'hidden'
			})
		}
		else if(this.state.visibility == 'full'){
			$('.LeftBar').css("height", 250);
			$('.HideBottom').css("opacity", 1).css('cursor', 'pointer');
			this.setState({
				visibility: 'shown'
			})
		}
	}

	hideBottom() {
		if(this.state.visibility == 'hidden') {
			$('.TopbarContainer').css("top", 0);
			$('.HideTopBarText').html("Hide");
			$('.CanvasHeaderTitle').css("top", 400);
			$('.CanvasHeatmapLegend').css("top", 400);
			$('.SwitchContainerY').css("top", -500);
			$('.HideTop').css("opacity", 1).css('cursor', 'pointer');
			this.setState({
				visibility: 'shown'
			})
		}
		else if(this.state.visibility == 'shown') {
			$('.LeftBar').css("height", $(window).height() - 100);
			$('.HideBottom').css("opacity", 0.3).css('cursor', 'inherit');
			this.setState({
				visibility: 'full'
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
				<div class="HideTop" onMouseDown={this.hideTopBar}>
					<img class="HideTopBarIcon" src="./interface/images/up.png" />
				</div>
				<div class="HideBottom" onMouseDown={this.hideBottom}>
					<img class="HideTopBarIcon" src="./interface/images/down.png" />
				</div>
			</div>
		);
	}
}