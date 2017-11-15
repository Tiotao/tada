import React from "react";
import $ from "jquery";

export default class Preview extends React.Component {
	constructor(props) {
		super();
		console.log("preview: ", props)
	}

	componentDidMount() {
		var data = this.props.previewData;

		$('.Preview').click(function(){
			var href;
			var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	    var match = data.href.match(regExp);
	    if (match && match[2].length == 11) {
	        href = match[2];
	    } else {
	        console.log(error);
	    }
	    href = 'https://www.youtube.com/embed/'+ href +'?autoplay=1';

	    //yes. that's right. i'm just gonna rander the video popup here. i can't react today.
	    $('.Overlay').removeClass('hidden').addClass('reveal');
			$('.OverlayVideo').attr('src', href);
			$('.Overlay').addClass('load');
			$('.OverlayVideo').addClass('load');

		  $('.VideoTitle').attr('href', href).html(data.title);
		  $('.VideoChannel').html("Posted on " + data.channel);
		  $('.VideoPostedTime').html("at " + data.timestamp);
		  $('.VideoView').html("Views: " + data.stats.view_count);
		  $('.VideoComment').html("Commnets: " + data.stats.comment_count);
		  $('.VideoDislike').html("Dislikes: " + data.stats.dislike_count);
		  $('.VideoLike').html("Likes: " + data.stats.like_count);
		  $('.VideoFav').html("Favorite: " + data.stats.fav_count);
		  $('.VideoVLRatio').html("View/Like ratio: " + data.stats.vl_ratio);
		  $('.VideoCaption').html(data.description);

			for(var i = 0; i < data.labels.length; i++) {
				$('.VideoLabels').append(
					$('<li>').attr('class', 'VideoLabelsName').append(
						$('<a>').append(data.labels[i].name)));
			}
		})
	}
 
	render() {
		return (
			<div class="Preview">
				<img class="PreviewImg" src={this.props.previewData.href}/>
				<p class="PreviewMeta">{this.props.previewData.mata}</p>
				<p>asdfasdf</p>
			</div>
		);
	}
}