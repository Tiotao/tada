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
					<Filter 
						id="view" 
						data={this.props.graph.view}
						handleUpdate={this.props.handleUpdate}/>
					<p class="FilterLabel">View count</p>
				</div>
				<div class="FilterRight">
					<Filter 
						id="vl_ratio"
						data={this.props.graph.vl_ratio}
						handleUpdate={this.props.handleUpdate}/>
					<p class="FilterLabel">View/like %</p>
				</div>
			</div>
		);
	}
}