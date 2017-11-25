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
		this.parseData = this.parseData.bind(this);
		this.drawBigDot = this.drawBigDot.bind(this);
		this.drawXLabel = this.drawXLabel.bind(this);
		this.handleDayView = this.handleDayView.bind(this);
	}

	componentDidUpdate() {
		if(this.props.videos) {
			this.parseData(this.props.videos)
		}
	}

	parseData(data) {
		console.log("asdfasdfsdf",data.positions)
		let buckets0 = new Array(30),
			buckets1 = new Array(30),
			buckets2 = new Array(30),
			buckets3 = new Array(30);

		for(var i = 0; i < 30; i++) {
			buckets0[i] = new Array();
			buckets1[i] = new Array();
			buckets2[i] = new Array();
			buckets3[i] = new Array();
		}

		let positions = data.positions;

		for(var video in positions) {
			let x, y;
			if(positions[video]['86400'][0]) {
				x = positions[video]['86400'][0][0];
				buckets0[x].push(video);
			}
			if(positions[video]['86400'][1]) {
				x = positions[video]['86400'][1][0];
				buckets1[x].push(video);
			}
			if(positions[video]['86400'][2]) {
				x = positions[video]['86400'][2][0];
				buckets2[x].push(video);
			}
			if(positions[video]['86400'][3]) {
				x = positions[video]['86400'][3][0];
				buckets3[x].push(video);
			}
		}

		this.buckets0 = buckets0;
		this.buckets1 = buckets1;
		this.buckets2 = buckets2;
		this.buckets3 = buckets3;

		this.handleVideoPosition();
	}

	drawXLabel(x, canvasHeight) {
		var dotMarginX = window.screen.width / 30;
		var labelText = new PIXI.Text();
		if(x == 29) {
			labelText.text = "Today";
		}
		else if(x == 22) {
			labelText.text = "1 week ago";
		}
		else if(x == 0) {
			labelText.text = "1 month ago";
		}
		else {
			labelText.text = (30-x-1)+" d";
		}
		labelText.style = {fontSize:"15px", fill:"white"};
		labelText.x = x * dotMarginX + 100;
		labelText.y = canvasHeight - 20;
		labelText.rotation = 0.5;
		this.stage.addChild(labelText);
	}

  drawBigDot(x, count) {
  	var dotMarginX = window.screen.width / 30;
		
		var box = new PIXI.Container();
		var dot = new PIXI.Graphics();
		box.x = x * dotMarginX + 100;
		box.y = document.getElementById("canvas").childNodes[0].clientHeight - 30;
		box.pivot.x = box.width / 2;
    box.pivot.y = box.height / 2 + 40; //margin bottom
    box.index = x;

    box.addChild(dot);
    dot.beginFill(12369084);
    dot.drawCircle(0, 0, 20);

    dot.interactive = true;
    dot.buttonMode = true;

    var hiddenCount = new PIXI.Text(count);
    hiddenCount.style = {fontSize: "10px", fill: "black"};
    hiddenCount.x = -5;
    hiddenCount.y = -5;
    box.addChild(hiddenCount);

    dot
      .on('pointerdown', onButtonDown)
      // .on('pointerover', onButtonOver)

    var _this = this;
    function onButtonDown() {
  		var stage = this.parent.parent;
  		_this.handleDayView(this.parent.index)
	  }

    this.stage.addChild(box);
  }

  handleDayView(index) {
  	var canvasHeight = document.getElementById("canvas").childNodes[0].clientHeight - 30;
  	this.stage.destroy();
		this.stage = new PIXI.Container();

  	var positions = this.props.videos.positions;
  	console.log(index)
  	console.log(this.buckets0[index])
  	var _this = this;
  	this.buckets0[index].forEach(function(videoID, i) {
  		var x = positions[videoID]['3600'][0][0];
  		var y = positions[videoID]['3600'][0][1];
  		_this.drawDot(x+3, y+2, videoID, canvasHeight);
  	})
  }

	handleVideoPosition() {

		var xState = this.props.x;
		var yState = this.props.y;

		var canvasHeight = document.getElementById("canvas").childNodes[0].clientHeight - 30;

		if(xState == 'byPosted') {
			if(yState == 'byViews') {
				console.log("by posted, by views")
				var buckets0 = this.buckets0;
				var _this = this;
				buckets0.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = bucket.length%10;

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							_this.drawDot(index, i+2, show[i], canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							_this.drawDot(index, i+1, bucket[i], canvasHeight);
						}
					}
				})
			}
			else {
				console.log("by posted, by likes")
				var buckets1 = this.buckets1;
				var _this = this;
				buckets1.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = bucket.length%10;

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							_this.drawDot(index, i+2, show[i], canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							_this.drawDot(index, i+1, bucket[i], canvasHeight);
						}
					}
				})
			}
		}
		else {
			if(yState == 'byViews') {
				console.log("by mentioned, by views")
				var buckets2 = this.buckets2;
				var _this = this;
				buckets2.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = bucket.length%10;

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							_this.drawDot(index, i+2, show[i], canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							_this.drawDot(index, i+1, bucket[i], canvasHeight);
						}
					}
				})
			}
			else {
				console.log("by mentioned, by likes")
				var buckets3 = this.buckets3;
				var _this = this;
				buckets3.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = bucket.length%10;

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							_this.drawDot(index, i+2, show[i], canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							_this.drawDot(index, i+1, bucket[i], canvasHeight);
						}
					}
				})
			}
		}
	}

	drawDot(x, y, id, canvasHeight) {
		
		var dotMarginX = window.screen.width / 30;
		var dotMarginY = 40;
		
		var box = new PIXI.Container();
		var dot = new PIXI.Graphics();
		box.x = x * dotMarginX + 100;
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
    dot.drawCircle(0, 0, 10);

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

					var top = viewportOffset.top;
					var left = viewportOffset.left + 80;

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
				<h1 class="CanvasHeaderTitle">Videos</h1>
				<div class="Canvas" ref="canvas" id="canvas">
				</div>
			</div>
		);
	}
}

