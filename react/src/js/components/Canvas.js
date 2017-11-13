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

		this.animate = this.animate.bind(this);
		this.updateChart = this.updateChart.bind(this);
		this.resize = this.resize.bind(this);
		this.handleVideoPosition = this.handleVideoPosition.bind(this);
		this.drawDot = this.drawDot.bind(this);
	}

	componentDidUpdate() {
		console.log("did update")
		
		if(this.props.videos) {
			var positions = this.props.videos.positions;
			var videoIDs = Object.keys(positions);

			videoIDs.map(this.handleVideoPosition);
		}
	}

	handleVideoPosition(videoID) {
		var positions = this.props.videos.positions[videoID]['3600'];
		
		if(positions[0]) {
			var x = positions[0][0];
			var y = positions[0][1];
			this.drawDot(x, y, videoID);
		}
		else {
			return;
		}
	}

	drawDot(x, y, id) {
		var canvasHight = 400;
		var dotMargin = 15;
		
			var box = new PIXI.Container();
			var dot = new PIXI.Graphics();
			box.x = x * dotMargin;
			// box.y = - pos[i][1] * dotMargin + canvasHight;
			box.y = this.random();
			box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2;
	    box.index = id;

	    var tweenY = new Tween(box, "y", - y * dotMargin + canvasHight, 30, true);
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

	  		var tweenH = new Tween(this, "height", 300, 10, true);
	      var tweenW = new Tween(this, "width", 300, 10, true);
	      tweenH.easing = Tween.outCubic;
	      tweenW.easing = Tween.outCubic;

	      axios.get('http://localhost:3000/api/videos/'+this.parent.index)
	      	.then(res => {
			    	var data = res.data;

			    	var viewportOffset = document.getElementById("canvas").getBoundingClientRect();

						var top = viewportOffset.top - 150;
						var left = viewportOffset.left - 150;

						var canvasPosition = new PIXI.Point(left, top);
						var elementPostion = this.parent.toGlobal(canvasPosition);

						var i = document.createElement('IMG');
						i.classList.add('Preview');
						i.id = this.parent.index;
						i.src = data.thumbnail;
						i.style = "left: " + elementPostion.x + "px; top: " + elementPostion.y + "px;"
						i.addEventListener('mouseout', function(e) {
							this.outerHTML = "";
						});
						i.addEventListener('click', function(e) {
							//parse video url
							var href;
							var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
					    var match = data.href.match(regExp);
					    if (match && match[2].length == 11) {
					        href = match[2];
					    } else {
					        console.log(error);
					    }
					    href = 'https://www.youtube.com/embed/'+ href +'?autoplay=1';

					    console.log(href);
					    console.log(data);
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

						setTimeout(function() {
							document.body.appendChild(i);
							i.classList.add('load');
						}, 150)
						
	      	})
	      	.catch(err => {
	      		console.log(err);
	      	})
	    }

	    function onButtonOut() {
	      var tweenH = new Tween(this, "height", 5, 30, true);
	      var tweenW = new Tween(this, "width", 5, 30, true);
	      tweenH.easing = Tween.outCubic;
	      tweenW.easing = Tween.outCubic;
	    }

	    this.stage.addChild(box);
	}

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(1000, 800, {
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

	// shouldComponentUpdate(nextProps, nextState) {
	// 	return nextProps.data !== this.props.data;
	// }

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
		var w = window.innerWidth;
		var h = window.innerHeight / 2;

		this.renderer.resize(w, h);
	}

	updateChart(props) {
		var data = props.labelData;
		var width = 2500
			, height =800;
		if(data.history) {
			for(var j = 0; j < data.history.videos.length; j++) {
				for(var k = 0; k < data.history.videos[j].length; k++) {
					console.log(j, k)
					var dot = new PIXI.Graphics();
					dot.beginFill(16777215);
					dot.drawRoundedRect(0, 0, 15, 15, 8);
					dot.x = width - 20*(j+1);
					dot.y = height - 20*(k+1);
					dot.interactive = true;
					dot.buttonMode = true;
					dot.index = [j,k];

					// dot.on('mousedown', (e) => {
		   //      var videoId = data.history.videos[e.target.index[0]][e.target.index[1]].id;

		   //      $.get('http://localhost:3000/api/videos/'+videoId, function(data, status){
		   //        showVideo(data);
		   //      })
					// })
					this.stage.addChild(dot); 
				}
			}
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

