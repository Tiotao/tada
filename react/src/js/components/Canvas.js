import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js";
import axios from "axios";
import $ from "jquery";

import Overlay from "./Overlay";
import Preview from "./Preview";

const canvasWidth = 1920,
	canvasHeight = 1080;

const screenMarginX = 50,
	screenMarginY = 40;

const screenLeftOffset = 40;

const bigDotSize = 20,
	smallDotSize = 10;

const dotMarginX = (window.screen.width - (screenMarginX<<1)) / 30,
	smallDotSpacingY = 30,
	smallDotMarginY = 50;

const smallDotBotMargin = dotMarginX + bigDotSize;

export default class Canvas extends React.Component {
	constructor(props) {
		super(props);

		this.timeScale = '86400';
		this.currentDay = null;

		this.videoData = "";
		this.previewData = "";

		this.animate = this.animate.bind(this);
		this.resize = this.resize.bind(this);
		this.handleVideoPosition = this.handleVideoPosition.bind(this);
		this.drawDot = this.drawDot.bind(this);
		this.parseData = this.parseData.bind(this);
		this.drawBigDot = this.drawBigDot.bind(this);
		this.drawXLabel = this.drawXLabel.bind(this);
		this.drawXLabelDayView = this.drawXLabelDayView.bind(this);
		this.handleDayView = this.handleDayView.bind(this);
	}

	componentDidUpdate() {
		if(this.props.videos) {
			if(this.timeScale == '86400') {
				this.parseData(this.props.videos);
			}
			else {
				this.handleDayView(this.currentDay);
			}
		}
	}

	parseData(data) {
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
		console.log(data);
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
			// else {
			// 	console.log(positions[video]['86400'])
			// 	count2++;
			// }
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


	getMaxVideosPerCol(bucket){
		//let max = 0;
		//console.log(bucket);
		return bucket.reduce((prev, curr) => {
			return Math.max(prev, curr.length);
		}, 0);
		//console.log("max videos", max);
		return max;
	}
	/*
	 * Draw labels on x axis in month view
	 * @ x {int} column index
	 * @ canvasHeight {int} canvas height
	 * return {null}
	 */
	drawXLabel(x, canvasHeight) {
		var date = new Date();
		var labelText = new PIXI.Text();
		if(x == 29) {
			labelText.text = "Today";
		}
		else if(x == 24) {
			labelText.text = "1 week ago";
		}
		else if(x == 0) {
			labelText.text = "1 month ago";
		}
		else {
			date.setDate(date.getDate() - (29 - x));
			labelText.text = (date.getMonth()+1) + "/" + date.getDate();
		}
		labelText.style = {fontSize:"12px", fill:"#333"};
		labelText.x = this.getDotPosition(x);
		labelText.anchor.x = 0.5;
		labelText.align = "right";
		labelText.y = canvasHeight - screenMarginY;
		this.stage.addChild(labelText);
	}

	/* 
	 * Draw labels on x axis in day view
	 * return {null}
	 */
	drawXLabelDayView() {
		var col = 24;
		var canvasHeight = document.getElementById("canvas").childNodes[0].clientHeight - 30;

		for(var i = 1; i <= col; i++) {
			var labelText = new PIXI.Text();
			labelText.style = {fontSize:"12px", fill:"#333"};
			labelText.x = this.getDotPosition(i+2);
			labelText.anchor.x = 0.5;
			labelText.align = "right";
			labelText.y = canvasHeight - screenMarginY - 40;
			if(i < 12) {
				labelText.text = i + " am";
			}
			else if(i ==12) {
				labelText.text = i + " pm";
			}
			else if(i < 24){
				labelText.text = (i-12) + " pm";
			}
			else {
				labelText.text = (i-12) + " am"; 
			}
			this.stage.addChild(labelText);
		}
	}
  drawBigDot(x, count) {
	var box = new PIXI.Container();
	var dot = new PIXI.Graphics();
	box.x = this.getDotPosition(x);
	box.y = document.getElementById("canvas").childNodes[0].clientHeight - 30;
    box.pivot.y = screenMarginY; //margin bottom
    box.index = x;

    box.addChild(dot);
    dot.beginFill(87963);
    dot.drawCircle(0, 0, bigDotSize);

    dot.interactive = true;
    dot.buttonMode = true;

    var hiddenCount = new PIXI.Text("+"+count);
    hiddenCount.style = {fontSize: "10px", fill: "white"};
    hiddenCount.x = -10;
    hiddenCount.y = -5;
    box.addChild(hiddenCount);

    dot
      .on('pointerdown', onButtonDown)
      // .on('pointerover', onButtonOver)

    var _this = this;
    function onButtonDown() {
  		_this.timeScale = '3600';
  		_this.currentDay = this.parent.index;
  		_this.handleDayView(this.parent.index)
	  }

    this.stage.addChild(box);
  }

  handleDayView(index) {
  	var canvasHeight = document.getElementById("canvas").childNodes[0].clientHeight - 30;
  	this.stage.destroy();
		this.stage = new PIXI.Container();

  	var positions = this.props.videos.positions;

  	this.drawXLabelDayView();

  	var xState = this.props.x;
		var yState = this.props.y;
		var _this = this;

		if(xState == 'byPosted') {
			if(yState == 'byViews') {
				console.log("by posted, by views")
				this.buckets0[index].forEach(function(videoID, i) {
					if(positions[videoID]) {
						var x = positions[videoID]['3600'][0][0];
			  		var y = positions[videoID]['3600'][0][1];
			  		var colorLevel = positions[videoID].heatmap[0];
			  		_this.drawDot(x+3, y+2, videoID, colorLevel, canvasHeight);
					}
		  		});
			}
			else {
				console.log("by posted, by likes")
				this.buckets1[index].forEach(function(videoID, i) {
					if(positions[videoID]) {
						var x = positions[videoID]['3600'][1][0];
			  		var y = positions[videoID]['3600'][1][1];
			  		var colorLevel = positions[videoID].heatmap[1];
			  		_this.drawDot(x+3, y+2, videoID, colorLevel, canvasHeight);
					}
		  		});
			}
		}
		else {
			if(yState == 'byViews') {
				console.log("by mentioned, by views")
				this.buckets2[index].forEach(function(videoID, i) {
					if(positions[videoID]) {
						var x = positions[videoID]['3600'][2][0];
			  		var y = positions[videoID]['3600'][2][1];
			  		var colorLevel = positions[videoID].heatmap[0];
			  		_this.drawDot(x+3, y+2, videoID, colorLevel, canvasHeight);
					}
		  	})
			}
			else {
				console.log("by mentioned, by likes")
				this.buckets3[index].forEach(function(videoID, i) {
					if(positions[videoID])  {
						var x = positions[videoID]['3600'][3][0];
			  		var y = positions[videoID]['3600'][3][1];
			  		var colorLevel = positions[videoID].heatmap[1];
			  		_this.drawDot(x+3, y+2, videoID, colorLevel, canvasHeight);
					}
		  	})
			}
		}

		var box = new PIXI.Container();
		var dot = new PIXI.Graphics();
		box.x = document.getElementById("canvas").childNodes[0].clientWidth / 2;
		box.y = document.getElementById("canvas").childNodes[0].clientHeight;
		//box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2 + 40; //margin bottom
	    box.index = index;

	    box.addChild(dot);
	    dot.beginFill(87963);
	    dot.drawCircle(0, 0, bigDotSize);

	    dot.interactive = true;
	    dot.buttonMode = true;

	    var meta = new PIXI.Text((30-index-1) + " days ago");
	    meta.style = {fontSize: "16px", fill: "#333"};
	    meta.x = 30;
	    meta.y = -5;
	    box.addChild(meta);

	    var hiddenCount = new PIXI.Text("Back");
	    hiddenCount.style = {fontSize: "10px", fill: "white"};
	    hiddenCount.x = -10;
	    hiddenCount.y = -5;
	    box.addChild(hiddenCount);

	    dot
	      .on('pointerdown', onButtonDown)

	    var _this = this;
	    function onButtonDown() {
	  		_this.timeScale = '86400';
	  		_this.currentDay = null;
	  		_this.handleVideoPosition();
		  }

	    this.stage.addChild(box);
  }

	handleVideoPosition() {
		this.stage.destroy();
		this.stage = new PIXI.Container();

		var xState = this.props.x;
		var yState = this.props.y;

		var canvasHeight = document.getElementById("canvas").childNodes[0].clientHeight;

		if(xState == 'byPosted') {
			if(yState == 'byViews') {
				console.log("by posted, by views")
				var buckets0 = this.buckets0;
				var _this = this;
				var maxVids = this.getMaxVideosPerCol(buckets0);
				var quotient = Math.max(1, Math.floor(maxVids/10));
				buckets0.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = Math.floor(bucket.length/quotient);

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							var colorLevel = _this.props.videos.positions[show[i]].heatmap[0];
							_this.drawDot(index, i+2, show[i], colorLevel, canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							var colorLevel = _this.props.videos.positions[bucket[i]].heatmap[0];
							_this.drawDot(index, i+1, bucket[i], colorLevel, canvasHeight);
						}
					}
				})
			}
			else {
				console.log("by posted, by likes")
				var buckets1 = this.buckets1;
				var _this = this;
				var maxVids = this.getMaxVideosPerCol(buckets1);
				var quotient = Math.max(1, Math.floor(maxVids/10));
				buckets1.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = Math.floor(bucket.length/quotient);

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							var colorLevel = _this.props.videos.positions[show[i]].heatmap[1];
							_this.drawDot(index, i+2, show[i], colorLevel, canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							var colorLevel = _this.props.videos.positions[bucket[i]].heatmap[1];
							_this.drawDot(index, i+1, bucket[i], colorLevel, canvasHeight);
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
				var maxVids = this.getMaxVideosPerCol(buckets2);
				var quotient = Math.max(1, Math.floor(maxVids/10));
				buckets2.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = Math.floor(bucket.length/quotient);

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							var colorLevel = _this.props.videos.positions[show[i]].heatmap[0];
							_this.drawDot(index, i+2, show[i], colorLevel, canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							var colorLevel = _this.props.videos.positions[bucket[i]].heatmap[0];
							_this.drawDot(index, i+1, bucket[i], colorLevel, canvasHeight);
						}
					}
				})
			}
			else {
				console.log("by mentioned, by likes")
				var buckets3 = this.buckets3;
				var _this = this;
				var maxVids = this.getMaxVideosPerCol(buckets3);
				var quotient = Math.max(1, Math.floor(maxVids/10));
				buckets3.forEach(function(bucket, index) {

					_this.drawXLabel(index, canvasHeight);
					if(bucket.length > 10) {
						var showCount = Math.floor(bucket.length/quotient);

						_this.drawBigDot(index, bucket.length-showCount);
						var show = bucket.slice(bucket.length-showCount-1, bucket.length-1);
						for(var i=0; i<showCount; i++) {
							var colorLevel = _this.props.videos.positions[show[i]].heatmap[1];
							_this.drawDot(index, i+2, show[i], colorLevel, canvasHeight);
						}
					}
					else {
						for(var i=0; i<bucket.length; i++) {
							var colorLevel = _this.props.videos.positions[bucket[i]].heatmap[1];
							_this.drawDot(index, i+1, bucket[i], colorLevel, canvasHeight);
						}
					}
				})
			}
		}
	}

	getDotPosition(x){
		return x * dotMarginX + screenLeftOffset + screenMarginX;
	}

	drawDot(x, y, id, colorLevel, canvasHeight) {
		var box = new PIXI.Container();
		var dot = new PIXI.Graphics();
		box.x = this.getDotPosition(x);
		// box.y = - pos[i][1] * dotMargin + canvasHeight;
		box.y = this.random();
		//box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2;
	    box.index = id;

	    var tweenY = new Tween(box, "y", - y * smallDotSpacingY + canvasHeight - smallDotMarginY, 30, true);
		tweenY.easing = Tween.outCubic;

	    box.addChild(dot);

	    var color = [];
	    switch(colorLevel) {
	    	case 0:
	    		color = [250,159,181];
	    		break;
	    	case 1:
	    		color = [247,104,161];
	    		break;
	    	case 2: 
	    		color = [221,52,151];
	    		break;
	    	case 3:
	    		color = [174,1,126];
	    		break;
	    	case 4:
	    		color = [122,1,119];
	    		break;
	    	case 5: 
	    		color = [73,0,106];
	    		break;
	    	defult:
	    		color = [250,159,181];
	    }
	    color = (color[0] << 16) + (color[1] << 8) + (color[2]);
	    dot.beginFill(color);
	    dot.drawCircle(0, 0, smallDotSize);

	    dot.interactive = true;
	    dot.buttonMode = true;

	    dot
	      .on('pointerover', onButtonOver)
	      .on('pointerout', onButtonOut);

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

						$('.Preview').removeClass("hidden");
						if(x == 0) {
							$('.Preview').css("left", elementPostion.x - (canvasWidth-window.screen.width) + 100);
						}
						else if(x >= 27) {
							$('.Preview').css("left", elementPostion.x - (canvasWidth-window.screen.width) - 200);
						}
						else {
							$('.Preview').css("left", elementPostion.x - 20);
						}
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
						  $('.VideoPostedTime').html("at " + _this.parseDate(data.timestamp));
						  $('.VideoView').html("Views: " + data.stats.view_count);
						  $('.VideoComment').html("Comments: " + data.stats.comment_count);
						  $('.VideoDislike').html("Dislikes: " + data.stats.dislike_count);
						  $('.VideoLike').html("Likes: " + data.stats.like_count);
						  $('.VideoFav').html("Favorite: " + data.stats.fav_count);
						  $('.VideoVLRatio').html("Like/view ratio: " + (data.stats.vl_ratio*100).toFixed(1) + "%");
						  $('.VideoCaption').html(data.description);
						  $('.ShareURL').val(data.href);

						  $('.VideoLabels').empty();
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
	      this.height = 12;
	      this.width = 12;
	    }

	    this.stage.addChild(box);
	}

	parseDate(timestamp) {
		var date = new Date(timestamp * 1000);
		var year = date.getFullYear()
			, month = date.getMonth() + 1
			, day = date.getDay();
		return year + "/"+ month + "/" + day
	}

	componentDidMount() {

		var canvasHeight = document.getElementById("canvas").clientHeight;
		this.renderer = PIXI.autoDetectRenderer(1920, canvasHeight, {
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
		//console.log("props", nextProps);
		this.stage.destroy();
		this.stage = new PIXI.Container();
	}

	animate() {
		Tween.runTweens();
		this.renderer.render(this.stage);
		this.frame = requestAnimationFrame(this.animate);
	}

	resize() {
		var canvasHeight = document.getElementById("canvas").clientHeight;
		if (this.renderer.height < canvasHeight) {
			this.renderer.resize(1920, canvasHeight);
			// this.componentDidUpdate();
		}
	}

	render() {				
		return (
			<div>
				<h1 class="CanvasHeaderTitle">Videos</h1>
				<div class="CanvasHeatmapLegend">
					<img class="CanvasHeatmapLegendImg" src="./interface/images/heatmap2.png" />
					<p class="CanvasHeatmapLegendText">Fewer</p>
					<p class="CanvasHeatmapLegendText">views or like/view</p>
					<p class="CanvasHeatmapLegendText">More</p>
				</div>
				<div class="Canvas" ref="canvas" id="canvas">
				</div>
			</div>
		);
	}
}

