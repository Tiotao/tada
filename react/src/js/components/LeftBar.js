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
				return <Label key={label._id} {...label} addSelectedLabels={this.props.addSelectedLabels} setVideos={this.props.setVideos}
				selected={this.props.selected}/>;
			});
		}

		return (
			<div class="LeftBar">
				<div class="LeftBarHeader">
					<h1 class="LeftBarHeaderTitle">Labels</h1>
					<form class="SearchContainer">
						<input class="SearchField" type="text" name="search" />
						<button class="SearchButton" type="submit" />
					</form>
				</div>
				<ul class="LeftBarLabels">{Labels} </ul>
			</div>
		);
	}
}