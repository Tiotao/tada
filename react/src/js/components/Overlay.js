import React from "react";
import $ from "jquery";

import Action from "./Action";

export default class Overlay extends React.Component {
	constructor(props) {
		super();
	}

	componentDidMount() {
		$('.OverlayClose').click(function() {
			$('.Overlay').removeClass('reveal').removeClass('load');
			$('.OverlayVideo').removeClass('load');
			setTimeout(function() {
				$('.Overlay').addClass('hidden');
			}, 1000);

			$('.OverlayVideo').removeAttr('src');
		})
	}

	addNewLabel() {
		var newLabel = $(".VideoAddNewLabelInput").val();

		$('.VideoLabels').append(
			$('<li>').attr('class', 'VideoLabelsNameCustomized').append(
			$('<a>').append(newLabel)));
		
		$(".VideoAddNewLabelInput").val('');
	}
 
	render() {
		return (
			<div class="Overlay hidden">
				<div class="OverlayClose" />
				<iframe class="OverlayVideo" />
				<div class="OverlayInfo">
					<h1 class="VideoTitle"></h1>
					<div class="VideoDescription">
						<p class="VideoChannel"></p>
						<p class="VideoPostedTime"></p>
						<p class="VideoView"></p>
						<p class="VideoComment"></p>
						<p class="VideoDislike"></p>
						<p class="VideoLike"></p>
						<p class="VideoFav"></p>
						<p class="VideoVLRatio"></p>
						<p class="VideoCaption"></p>
					</div>
					<p class="VideoLabelsTitle">Labels:</p>
					<ul class="VideoLabels"></ul>
					<form class="VideoAddNewLabel">
						<input class="VideoAddNewLabelInput" type="text" name="addNewLabel" />
						<button class="VideoAddNewLabelButton" type="button" value="Add" onMouseDown={this.addNewLabel}>Add</button>
					</form>
					<ul class="VideoActions">
						<Action icon="/interface/images/share.png" action="Share"/>
						<Action icon="/interface/images/add.png" action="Add"/>
					</ul>
				</div>
			</div>
		);
	}
}