import React from "react";
import axios from "axios";

export default class Label extends React.Component {
	constructor(props) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
		this.drawHeatmap = this.drawHeatmap.bind(this);
	}

	handleClick(e) {
		e.preventDefault();

  	var name = e.target.innerHTML;
  	var id = e.target.id;

		var selectedLabels = this.props.selected.map(function(labelObj) {
			return labelObj.id;
		})
		selectedLabels.push(id)

    axios.post('http://localhost:3000/api/filter', {
	      "ids": selectedLabels,
	      "view_count_range": ["0", "Infinity"],
	      "like_ratio_range": ["0", "1"]
	    })
	    .then(res => {
	      this.props.handleLabelData(name, id, res.data)
	    })
	    .catch(err => {
	      console.log(err);
	    })
	}

	drawHeatmap() {
		var days = [];
		var history = this.props.history;
		var strokeWidth = 5;
		for(var i = 0; i < history.length; i++){
			let rgb = [];
			rgb.push(parseInt(Math.log(history[i]+0.1)/5*255));
			rgb.push(36);
			rgb.push(52);

			let styles = {
				strokeWidth: strokeWidth,
				stroke: `rgb(${rgb})`
			}

			days.push(
				<line key={i}
					x1={i*strokeWidth} x2={i*strokeWidth} y1="0" y2="100" 
					style={styles} 
				/>)
		}
		return <svg class="LeftBarLabelHeatmapSVG">{days}</svg>
	}

	render() {
		const { id, name, is_meta, score, count } = this.props;

		return (
			<li class="LeftBarLabel">
				<a>
					<div class="LeftBarLabelHeatmap">{this.drawHeatmap()}</div>
					<p class="LeftBarLabelName" id={this.props._id} onClick={this.handleClick}>{name}</p>
					<p class="LeftBarLabelCount">{count}</p>
				</a>
			</li>
		);
	}
}