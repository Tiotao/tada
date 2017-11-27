import React from "react";
import $ from "jquery";

import Filter from "./Filter";

export default class Filters extends React.Component {
	constructor(props) {
		super();
	}
	
	render() {
		return (
			<div class="Filters">
				<h1 class="FiltersHeaderTitle">Filters</h1>
				<div class="FilterLeft">
					<Filter id="FilterLeftCanvas" data={this.props.graph.view}/>
					<p class="FilterLabel">View count</p>
				</div>
				<div class="FilterRight">
					<Filter id="FilterRightCanvas" data={this.props.graph.vl_ratio}/>
					<p class="FilterLabel">View/like %</p>
				</div>
			</div>
		);
	}
}