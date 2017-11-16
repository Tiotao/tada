import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js";
import axios from "axios";
import $ from "jquery";

import Overlay from "./Overlay";
import Preview from "./Preview";

export default class Canvas extends React.Component {
	constructor(props) {
		super(props);

		this.videoData = "";
		this.previewData = "";

		this.animate = this.animate.bind(this);
		this.resize = this.resize.bind(this);
		this.handleVideoPosition = this.handleVideoPosition.bind(this);
		this.drawDot = this.drawDot.bind(this);
	}

	componentDidUpdate() {
		if(this.props.videos) {
			var positions = this.props.videos.positions;
			var videoIDs = Object.keys(positions);

			videoIDs.map(this.handleVideoPosition);
		}
	}

	handleVideoPosition(videoID) {
		let positions;
		switch(this.props.time) {
			case "3600":
				positions = this.props.videos.positions[videoID]['3600'];
				break;
			case "21600":
				positions = this.props.videos.positions[videoID]['21600'];
				break;
			case "43200":
				positions = this.props.videos.positions[videoID]['43200'];
				break;
			default:
				positions = this.props.videos.positions[videoID]['3600'];
		}

		var xState = this.props.x;
		var yState = this.props.y;

		var canvasHeight = document.getElementById("canvas").childNodes[0].clientHeight - 30;

		if(xState == 'byPosted') {
			if(yState == 'byViews') {
				if(positions[0]) {
					var x = positions[0][0];
					var y = positions[0][1];
					this.drawDot(x, y, videoID, canvasHeight);
				}
				else {
					return;
				}
			}
			else {
				if(positions[1]) {
					var x = positions[1][0];
					var y = positions[1][1];
					this.drawDot(x, y, videoID, canvasHeight);
				}
				else {
					return;
				}
			}
		}
		else {
			if(yState == 'byViews') {
				if(positions[2]) {
					var x = positions[2][0];
					var y = positions[2][1];
					this.drawDot(x, y, videoID, canvasHeight);
				}
				else {
					return;
				}
			}
			else {
				if(positions[3]) {
					var x = positions[3][0];
					var y = positions[3][1];
					this.drawDot(x, y, videoID, canvasHeight);
				}
				else {
					return;
				}
			}
		}
	}

	drawDot(x, y, id, canvasHeight) {
		
		var dotMarginX = 45;
		var dotMarginY = 20;
		
		var box = new PIXI.Container();
		var dot = new PIXI.Graphics();
		box.x = x * dotMarginX;
		// box.y = - pos[i][1] * dotMargin + canvasHeight;
		box.y = this.random();
		box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2;
	    box.index = id;

	    var tweenY = new Tween(box, "y", - y * dotMarginY + canvasHeight, 30, true);
		
		tweenY.easing = Tween.outCubic;

	    box.addChild(dot);
	    // dot.beginFill(3093046);
	    dot.beginFill(12369084);
	    dot.drawCircle(0, 0, 5);

	    dot.interactive = true;
	    dot.buttonMode = true;

	    dot
	      .on('pointerdown', onButtonDown)
	      .on('pointerover', onButtonOver)
	      .on('pointerout', onButtonOut);

	    function onButtonDown() {
	    	console.log(this.parent.index)
	    }
	    var _this = this;
	  	function onButtonOver() {
	  		var stage = this.parent.parent;

	      axios.get('/api/videos/'+this.parent.index)
	      	.then(res => {
			    	var data = res.data;

			    	var previewData = {
			    		id: data.id,
			    		href: data.thumbnail,
			    		title: data.title,
			    		views: data.stats.view_count,
			    		likes: data.stats.like_count
			    	}

			    	var viewportOffset = document.getElementById("canvas").getBoundingClientRect();

						var top = viewportOffset.top - 100;
						var left = viewportOffset.left - 100;

						var canvasPosition = new PIXI.Point(left, top);
						var elementPostion = this.parent.toGlobal(canvasPosition);

						var sliderMove = parseInt($('.TimelineSlider').css('right'), 10);

						$('.Preview').removeClass("hidden");
						$('.Preview').css("left", elementPostion.x + sliderMove - (2000-window.screen.width));
						$('.Preview').css("top", elementPostion.y);
						$('.PreviewImg').attr("src", previewData.href);
						$('.PreviewTitle').html(previewData.title);
						$('.Preview').addClass("load");
						$('.PreviewViews').html("Views: " + previewData.views);
						$('.PreviewLikes').html("Likes: " + previewData.likes);

						$('.Preview').mouseout(function() {
							$('.Preview').addClass("hidden");
						})

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
	      	})
	      	.catch(err => {
	      		console.log(err);
	      	})
	    }

	    function onButtonOut() {
	      this.height = 8;
	      this.width = 8;
	    }

	    this.stage.addChild(box);
	}

	componentDidMount() {

		var canvasHeight = document.getElementById("canvas").clientHeight - 30;
		this.renderer = PIXI.autoDetectRenderer(2000, canvasHeight, {
			transparent: true,
			resolution: 1,
			antialias: true
		});

		this.refs.canvas.appendChild(this.renderer.view);

		window.addEventListener("resize", this.resize);
		this.resize();

		this.stage = new PIXI.Container();

		this.animate();
	}

	random() {
    var min = -500, max = 500;
    return Math.floor(Math.random()*(max-min+1)+min);
  }

	componentWillReceiveProps(nextProps) {
		this.stage.destroy();
		this.stage = new PIXI.Container();
	}

	animate() {
		Tween.runTweens();
		this.renderer.render(this.stage);
		this.frame = requestAnimationFrame(this.animate);
	}

	resize() {
		var canvasHeight = document.getElementById("canvas").clientHeight - 30;
		if (this.renderer.height < canvasHeight) {
			this.renderer.resize(2000, canvasHeight);
			// this.componentDidUpdate();
		}
	}

	render() {

				
		return (
			<div>
				<div class="Canvas" ref="canvas" id="canvas">
				</div>
			</div>
		);
	}
}

