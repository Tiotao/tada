import React from "react";
import $ from "jquery";

import Action from "./Action";

export default class Overlay extends React.Component {
	constructor(props) {
		super();

		this.showNewListInput = this.showNewListInput.bind(this);
		this.createNewList = this.createNewList.bind(this);
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

	addToList(e) {
		if($(e.target).hasClass('added')) {
			$(e.target).removeClass('added');
		}
		else {
			$(e.target).addClass('added');
		}
	}

	showNewListInput() {
		if($('.VideoActionAddNewList').find('input').length == 0) {
			$('.VideoActionAddNewListText').hide();
			$('.VideoActionAddNewList').prepend(
				$('<input>').attr('class', 'VideoActionAddNewListInput'));
			$('.VideoActionAddNewList').css('cursor', 'initial');
		}
	}

	createNewList() {
		if($('.VideoActionAddNewList').find('input').length != 0) {
			var newList = $('.VideoActionAddNewListInput').val();
			$('.AddTo').append(
				$('<li>').attr('class', 'AddToItem').html(newList).on('click', this.addToList));

			$('.VideoActionAddNewListInput').val("");
		}
		else {
			$('.VideoActionAddNewListText').hide();
			$('.VideoActionAddNewList').prepend(
				$('<input>').attr('class', 'VideoActionAddNewListInput'));
			$('.VideoActionAddNewList').css('cursor', 'initial');
		}
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
						<div class="VideoActionAdd hidden">
							<p class="VideoActionAddTitle">Add to</p>
							<ul class="AddTo">
								<li class="AddToItem" onMouseDown={this.addToList}>Promote</li>
								<li class="AddToItem" onMouseDown={this.addToList}>Good for experts</li>
								<li class="AddToItem" onMouseDown={this.addToList}>For beginers</li>
							</ul>
							<div class="VideoActionAddNewList" onMouseDown={this.showNewListInput}>
								<img class="VideoActionAddNewListIcon" src="/interface/images/add-dark.png" onMouseDown={this.createNewList}/>
								<p class="VideoActionAddNewListText">Create a new list</p>
							</div>
						</div>
						<div class="VideoActionShare hidden">
							<p class="VideoActionShareTitle">Share this video</p>
							<form class="ShareTo">
								<input class="ShareURL" type="text" name="shareURL" />
								<button type="button" class="ShareButton" value="Copy">Share</button>
							</form>
						</div>
					</ul>
				</div>
			</div>
		);
	}
}