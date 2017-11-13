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

		e.currentTarget.parentNode.parentNode.removeChild(e.currentTarget.parentNode);
		var id = e.target.id;
		// console.log(id)

		var selectedLabels = this.props.selected;

		

		function findToRemove(id, labels) {
			for(var j=0; j<labels.length; j++) {
				// console.log(labels[j])
				if(labels[j].id.match(id)) return j;
			}
			return -1;
		}

		var i = findToRemove(id, selectedLabels);
		// console.log("i: ", i)

		selectedLabels.splice(i, 1);
		var ids = selectedLabels.map(function(label) {
			return label.id;
		})

		// console.log(selectedLabels)

		axios.post('http://localhost:3000/api/filter', {
	      "ids": ids,
	      "view_count_range": ["0", "Infinity"],
	      "like_ratio_range": ["0", "1"]
	    })
	    .then(res => {
	      this.props.handleRemove(i, res.data)
	    })
	    .catch(err => {
	      console.log(err);
	    })
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