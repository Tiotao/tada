import React from "react";
import $ from "jquery";

export default class Overlay extends React.Component {
	constructor(props) {
		super();

		// console.log(props)

		// this.href = props.videoData.href;
		// this.title = props.videoData.title;
		// this.chanel = props.videoData.chanel;
		// this.postedTime = props.videoData.postedTime;
		// this.views = props.videoData.views;
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

	// componentWillReceiveProps(nextProps) {
	// 	// document.getElementsByClassName("Overlay").classList.remove('hidden');
	// }

	// componentDidUpdate() {
		
	// 	document.getElementsByClassName("Overlay")[0].classList.remove('hidden');
	// 	document.getElementsByClassName("Overlay")[0].classList.add('load');
	// 	document.getElementsByClassName("OverlayVideo")[0].classList.add('load');
	// 	document.getElementsByClassName("OverlayVideo")[0].setAttribute('src', this.href);
	// }

// 	render() {
// 		return (
// 			<div class="Overlay hidden">
// 				<div class="OverlayClose" />
// 				<iframe class="OverlayVideo" />
// 				<div class="OverlayInfo">
// 					<h1 class="VideoTitle">{this.title}</h1>
// 					<div class="VideoDescription">
// 						<p class="VideoChannel">Posted on {this.chennel}</p>
// 						<p class="VideoPostedTime">at {this.postedTime}</p>
// 						<p class="VideoView">views: {this.views}</p>
// 					</div>
// 					<ul class="VideoLabels"></ul>
// 				</div>
// 			</div>
// 		);
// 	}
// }
 
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
					<ul class="VideoLabels"></ul>
				</div>
			</div>
		);
	}
}