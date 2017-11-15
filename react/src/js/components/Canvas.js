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
		console.log("did update")
		
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

		if(xState == 'byPosted') {
			if(yState == 'byViews') {
				if(positions[0]) {
					var x = positions[0][0];
					var y = positions[0][1];
					this.drawDot(x, y, videoID);
				}
				else {
					return;
				}
			}
			else {
				if(positions[1]) {
					var x = positions[1][0];
					var y = positions[1][1];
					this.drawDot(x, y, videoID);
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
					this.drawDot(x, y, videoID);
				}
				else {
					return;
				}
			}
			else {
				if(positions[3]) {
					var x = positions[3][0];
					var y = positions[3][1];
					this.drawDot(x, y, videoID);
				}
				else {
					return;
				}
			}
		}
	}

	drawDot(x, y, id) {
		var canvasHight = 550;
		var dotMarginX = 45;
		var dotMarginY = 20;
		
			var box = new PIXI.Container();
			var dot = new PIXI.Graphics();
			box.x = x * dotMarginX;
			// box.y = - pos[i][1] * dotMargin + canvasHight;
			box.y = this.random();
			box.pivot.x = box.width / 2;
	    box.pivot.y = box.height / 2;
	    box.index = id;

	    var tweenY = new Tween(box, "y", - y * dotMarginY + canvasHight, 30, true);
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

	  		// var tweenH = new Tween(this, "height", 100, 5, true);
	    //   var tweenW = new Tween(this, "width", 100, 5, true);
	    //   tweenH.easing = Tween.outCubic;
	    //   tweenW.easing = Tween.outCubic;
	    	// this.height = 200;
	    	// this.width = 200;

	      axios.get('http://localhost:3000/api/videos/'+this.parent.index)
	      	.then(res => {
			    	var data = res.data;

			    	var previewData = {
			    		id: data.id,
			    		href: data.thumbnail,
			    		title: data.title,
			    		views: data.stats.view_count,
			    		likes: data.stats.like_count
			    	}
			    	_this.previewData = previewData;
			    	// _this.props.updatePreview(previewData);

			    	var viewportOffset = document.getElementById("canvas").getBoundingClientRect();

						var top = viewportOffset.top - 100;
						var left = viewportOffset.left - 100;

						var canvasPosition = new PIXI.Point(left, top);
						var elementPostion = this.parent.toGlobal(canvasPosition);

						var sliderMove = parseInt($('.TimelineSlider').css('right'), 10);

						// var $preview = $("<img>", {
						// 	id: this.parent.index,
						// 	class: "Preview",
						// 	src: data.thumbnail,
						// 	style: "left: " + this.parent.x + "px; top: " + this.parent.y + "px;"
						// });

						// $('.Canvas').append($preview);
						// $preview.addClass('load');

						// var i = document.createElement('IMG');
						// i.classList.add('Preview');
						// i.id = this.parent.index;
						// i.src = data.thumbnail;
						// i.style = "left: " + (elementPostion.x + sliderMove - (2000-window.screen.width)) + "px; top: " + elementPostion.y + "px;"
						
						// i.addEventListener('mouseout', function(e) {
						// 	this.outerHTML = "";
						// });
						// i.appendChild($area);
						

						// setTimeout(function() {
						// 	document.body.appendChild(i);
						// 	i.classList.add('load');
						// }, 50)
						
	      	})
	      	.catch(err => {
	      		console.log(err);
	      	})
	    }

	    function onButtonOut() {
	      // var tweenH = new Tween(this, "height", 5, 20, true);
	      // var tweenW = new Tween(this, "width", 5, 20, true);
	      // tweenH.easing = Tween.outCubic;
	      // tweenW.easing = Tween.outCubic;
	      this.height = 5;
	      this.width = 5;
	      // $('.Preview').remove();
	    }

	    this.stage.addChild(box);
	}

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(2000, 800, {
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
		// var w = window.innerWidth;
		// var h = window.innerHeight / 2;

		// this.renderer.resize(2000, h);
	}

	render() {

				
		return (
			<div>
				<div class="Canvas" ref="canvas" id="canvas">
				</div>
				<Preview previewData={this.previewData} />
			</div>
		);
	}
}

