import React from "react";
import axios from "axios";
import Fuse from "fuse.js";
import $ from "jquery";

import Label from "./Label";

export default class LeftBar extends React.Component {
	constructor(props) {
		super();

		this.state = {
			labels : []
		}

		this.handleSearch = this.handleSearch.bind(this);
	}

	componentDidUpdate() {
		var options = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        "name"
      ]
    };

    this.fuse = new Fuse(this.props.labels, options);
	}

	handleSearch() {
		var query = $('.SearchField').val();

		this.setState({
			labels : this.fuse.search(query).slice(0, 80)
		})
	}

	render() {
		let labels;

		if(this.state.labels.length != 0) {
			labels = this.state.labels;
		}
		else if(this.props.labels) {
			labels = this.props.labels.slice(0, 80);
		}

		let Labels; 

		if(labels) {
			Labels = labels.map((label) => {
				return <Label key={label._id} {...label} addSelectedLabels={this.props.addSelectedLabels} setVideos={this.props.setVideos}
				selected={this.props.selected}/>;
			});
		}

		return (
			<div class="LeftBar">
				<div class="LeftBarHeader">
					<h1 class="LeftBarHeaderTitle">Labels</h1>
					<div class="LeftBarHeatmapLegend">
						<img class="LeftBarHeatmapLegendImg" src="./interface/images/heatmap1.png" />
						<p class="LeftBarHeatmapLegendText">Fewer</p>
						<p class="LeftBarHeatmapLegendText">number of videos</p>
						<p class="LeftBarHeatmapLegendText">More</p>
					</div>
					<form class="SearchContainer">
						<p class="SearchTitle">Search</p>
						<input class="SearchField" type="text" name="search" onChange={this.handleSearch}/>
					</form>
				</div>
				<ul class="LeftBarLabels">{Labels} </ul>
			</div>
		);
	}
}