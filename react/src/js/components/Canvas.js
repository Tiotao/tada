import React, {Component, PropTypes} from "react";
import * as PIXI from "pixi.js"

export default class Canvas extends React.Component {
	constructor(props) {
		super();

		this.state = {
			data: props.labelData
		}
	}

	componentDidMount() {
		this.renderer = PIXI.autoDetectRenderer(2500, 800, {
			transparent: true,
			resolution: 1,
			antialias: true
		});
		this.refs.canvas.appendChild(this.renderer.view);

		this.stage = new PIXI.Container();

		console.log(this.state.data)
	}

	render() {
		return (
			<div class="Canvas" ref="canvas">
			</div>
		);
	}
}

