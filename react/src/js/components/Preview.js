import React from "react";
import $ from "jquery";

export default class Preview extends React.Component {
	constructor(props) {
		super();
	}
 
	render() {
		return (
			<div class="Preview hidden">
				<img class="PreviewImg" />
				<div class="PreviewMeta">
					<p class="PreviewTitle" />
					<p class="PreviewViews" />
					<p class="PreviewLikes" />
				</div>
			</div>
		);
	}
}