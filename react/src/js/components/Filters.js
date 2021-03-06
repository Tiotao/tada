import React from "react";
import $ from "jquery";

import Filter from "./Filter";

export default class Filters extends React.Component {
	constructor(props) {
		super();

		this.resetFilters = this.resetFilters.bind(this);
	}

	/**
	 * Reset filters
	 * @return {null}
	 */
	resetFilters() {
		var canvasLeft = document.getElementById('view');
		var canvasRight = document.getElementById('vl_ratio');
		var ctxLeft = canvasLeft.getContext('2d');
		var ctxRight = canvasRight.getContext('2d');

		ctxLeft.clearRect(0, 0, canvasLeft.width, canvasLeft.height);
		ctxRight.clearRect(0, 0, canvasRight.width, canvasRight.height);

		this.props.handleUpdate(null);
	}

	render() {
		return (
			<div class="Filters">
				<h1 class="FiltersHeaderTitle">Filters</h1>
				<p class="FiltersReset" onMouseDown={this.resetFilters}>Reset</p>
				<div class="FilterLeft">
					<Filter 
						id="view" 
						data={this.props.graph.view}
						max={this.props.graph.max_view}
						handleUpdate={this.props.handleUpdate}/>
					<p class="FilterLabel">View count</p>
				</div>
				<div class="FilterRight">
					<Filter 
						id="vl_ratio"
						data={this.props.graph.vl_ratio}
						handleUpdate={this.props.handleUpdate}/>
					<p class="FilterLabel">Like/View %</p>
				</div>
			</div>
		);
	}
}