import React from "react";
import $ from "jquery";

import Selected from "./Selected";

export default class TopBar extends React.Component {
	static visibility = 'shown';

	constructor(props) {
		super(props);

		this.removeSelectedLabel = props.removeSelectedLabel;
		this.hideTopBar = this.hideTopBar.bind(this);
		this.hideBottom = this.hideBottom.bind(this);
	}

	/**
	 * Hide label section
	 * @return {null}
	 */
	hideTopBar() {
		if(TopBar.visibility == 'shown') {
			$('.TopbarContainer').css("top", -300);
			$('.HideTop').css("opacity", 0.3).css('cursor', 'inherit');
			$('.HideTopBarText').html("Show");
			$('.CanvasHeaderTitle').css("top", 90);
			$('.CanvasHeatmapLegend').css("top", 90);
			$('.SwitchContainerY').css("bottom", 800);
			TopBar.visibility = 'hidden';
		}
		else if(TopBar.visibility == 'full'){
			$('.LeftBar').css("height", 250);
			$('.HideBottom').css("opacity", 1).css('cursor', 'pointer');
			TopBar.visibility = 'shown';
		}
	}

	/**
	 * Hide video dots section
	 * @return {null}
	 */
	hideBottom() {
		if(TopBar.visibility == 'hidden') {
			$('.TopbarContainer').css("top", 0);
			$('.HideTopBarText').html("Hide");
			$('.CanvasHeaderTitle').css("top", 345);
			$('.CanvasHeatmapLegend').css("top", 345);
			$('.SwitchContainerY').css("bottom", 550);
			$('.HideTop').css("opacity", 1).css('cursor', 'pointer');
			TopBar.visibility = 'shown';
		}
		else if(TopBar.visibility == 'shown') {
			$('.LeftBar').css("height", $(window).height() - 100);
			$('.HideBottom').css("opacity", 0.3).css('cursor', 'inherit');
			TopBar.visibility = 'full';
		}
	}

	static getVisibility() {
		return TopBar.visibility;
	}

	render() {
		const selectedLabels = this.props.selected;
		let selectedLabelElements;
		if(selectedLabels.length > 0) {
			selectedLabelElements = selectedLabels.map((labelObj, i) => {
				return <Selected key={labelObj.id} name={labelObj.name} id={labelObj.id} selected={this.props.selected} setVideos={this.props.setVideos}
						removeSelectedLabel={this.removeSelectedLabel}/>;
			});
		}
		return (
			<div class="TopBarLabels">
				<ul>{selectedLabelElements}</ul>
				<div class="HideTop" onClick={this.hideTopBar.bind(this)}>
					<img class="HideTopBarIcon" src="./interface/images/up.png" />
				</div>
				<div class="HideBottom" onClick={this.hideBottom.bind(this)}>
					<img class="HideTopBarIcon" src="./interface/images/down.png" />
				</div>
			</div>
		);
	}
}