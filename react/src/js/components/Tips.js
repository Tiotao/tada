import React from "react";
import $ from "jquery";

import Action from "./Action";

export default class Tips extends React.Component {
	constructor(props) {
		super();

		this.state = {
			open: false
		}

		this.openTips = this.openTips.bind(this);
		this.closeTips = this.closeTips.bind(this);
	}

	closeTips() {
		$(".Tips").addClass("mini");
		$(".TipsTable").addClass("hidden");
		$(".TipsClose").addClass("hidden");
		this.setState({
			open: false
		})
	}

	openTips() {
		if(!this.state.open) {
			$(".Tips").removeClass("mini");
			$(".TipsTable").removeClass("hidden");
			$(".TipsClose").removeClass("hidden");
			this.setState({
				open: true
			})
		}
	}
 
	render() {
		return (
			<div class="Tips mini" onMouseDown={this.openTips}>
				<div class="TipsClose hidden" onMouseDown={this.closeTips}/>
				<table class="TipsTable hidden">
					<tbody>
						<tr>
							<td class="TipsImage"><img src="./interface/images/label.png" /></td>
							<td class="TipsText">
								Each vertical stripe represents the label’s popularity for a day.
								The stripe’s color intensity increases as popularity increases.
								The right-most stripe shows yesterday’s label’s popularity, the left-most stripe is 30 days ago.
							</td>
						</tr>
						<tr>
							<td class="TipsImage"><img src="./interface/images/filter.png" /></td>
							<td class="TipsText">
								To filter the labels and videos by view/like ratio or view count, drag the vertical edges of the highlighted area.
							</td>
						</tr>
						<tr>
							<td class="TipsImage"><img src="./interface/images/video.png" /></td>
							<td class="TipsText">
								The number on the dot at the bottom represents the number of remaining videos for the day. Click on it to zoom in on the day.
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}
}