"use_strict";
import React from "react";
import axios from "axios";

export default class Selected extends React.Component {
	constructor(props) {
		super(props);
		// console.log(props)

		this.handleRemove = this.handleRemove.bind(this);
	}

	handleRemove(e) {
		e.preventDefault();

		var id = this.props.id;
		var selectedLabels = this.props.selected;
		var ids = this.props.removeSelectedLabel(id);

		axios.post('/api/filter', {
	      "ids": ids,
	      "view_count_range": ["0", "Infinity"],
	      "like_ratio_range": ["0", "1"]
	    })
	    .then(res => {
	    	this.props.setVideos(res.data);
	    })
	    .catch(err => {
	    	console.log(err);
	    });
	}

	render() {

		return (
			<li class="TopBarLabel">
				<p class="TopBarLabelName" id={this.props.id}>{this.props.name}</p>
				<div class="TopBarLabelRemove" id={this.props.id} onClick={this.handleRemove}></div>
			</li>
		);
	}
}