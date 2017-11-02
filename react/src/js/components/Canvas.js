import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js"

export default class Canvas extends React.Component {

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(100, 200);
		this.refs.canvas.appendChild(this.renderer.view);

		this.stage = new PIXI.Container();
		this.stage.height = 100;
		this.stage.width = 200;
	}

	render() {
		return (
			<div class="Canvas" ref="canvas">
			</div>
		);
	}
}