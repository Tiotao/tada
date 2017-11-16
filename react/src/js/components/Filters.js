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
				<div class="FilterLeft">
					<Filter id="FilterLeftCanvas" />
					<p class="FilterLabel">View count</p>
				</div>
				<div class="FilterRight">
					<Filter id="FilterRightCanvas" />
					<p class="FilterLabel">View/like %</p>
				</div>
			</div>
		);
	}
}