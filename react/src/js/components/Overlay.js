import React from "react";

export default class Overlay extends React.Component {
	constructor(props) {
		super();

		this.title = props.videoData.title;
		this.chanel = props.videoData.chanel;
		this.postedTime = props.videoData.postedTime;
		this.views = props.videoData.views;
	}

	render() {
		return (
			<div class="Overlay hidden">
				<div class="OverlayClose" />
				<iframe class="OverlayVideo" />
				<div class="OverlayInfo">
					<h1 class="VideoTitle">{this.title}</h1>
					<div class="VideoDescription">
						<p class="VideoChannel">Posted on {this.chennel}</p>
						<p class="VideoPostedTime">at {this.postedTime}</p>
						<p class="VideoView">views: {this.views}</p>
					</div>
					<ul class="VideoLabels"></ul>
				</div>
			</div>
		);
	}
}