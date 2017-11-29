import React from "react";
import axios from "axios";

export default class Label extends React.Component {
	constructor(props) {
		super(props);
		this.state = {selected: false };

		this.handleClick = this.handleClick.bind(this);
		this.drawHeatmap = this.drawHeatmap.bind(this);
		this.createLabelElement = this.createLabelElement.bind(this);
	}

	handleClick(e) {
		event.stopPropagation();

  	let name = this.props.name;
  	let id = this.props._id;
    let selectedLabelIds = this.props.addSelectedLabels(id, name, this);

    axios.post('/api/filter', {
	      "ids": selectedLabelIds,
	      "view_count_range": ["0", "100"],
	      "like_ratio_range": ["0", "100"] 
    })
    .then(res => {
      this.props.setVideos(res.data);
    })
    .catch(err => {
      console.log(err);
    });
	}
	
	createLabelElement(isSelected) {
		let heatmapElement, labelNameElement, labelCountElement, labelContainerElement;
		heatmapElement = React.createElement(
			'div',
			{ className: 'LeftBarLabelHeatmap'},
			this.drawHeatmap()
		);
		labelNameElement = React.createElement(
			'p',
			{ className: 'LeftBarLabelName', id: this.props._id},
			this.props.name
		);
		labelCountElement = React.createElement(
			'p',
			{ className: 'LeftBarLabelCount'},
			this.props.count + " vids"
		);
		labelContainerElement = React.createElement(
			'div',
			{ className: this.getSelectedLabelClassName(isSelected), onClick: this.handleClick, 'data-name': name, 'data-id': this.props._id},
			heatmapElement,
			labelNameElement,
			labelCountElement
		)
		return labelContainerElement;
	}
	
	getSelectedLabelClassName(isSelected) {
		if(isSelected)
			return 'LeftBarLabel Selected';
		else
			return 'LeftBarLabel';
	}

	drawHeatmap() {
		var days = [];
		var history = this.props.history;
		var strokeWidth = 5;
		for(var i = 0; i < history.length; i++){                                         
			let rgb = [];
			rgb.push(255-parseInt(Math.log(history[i]+0.1)/4*255));
			rgb.push(255-parseInt(Math.log(history[i]+0.1)/7*255));
			rgb.push(255-parseInt(Math.log(history[i]+0.1)/10*255));

			let styles = {
				strokeWidth: strokeWidth,
				stroke: `rgb(${rgb})`
			}

			days.push(
				<line key={i}
                    x1={i*strokeWidth} x2={i*strokeWidth} y1="0" y2="40" 
					style={styles} 
				/>)
		}
		return <svg class="LeftBarLabelHeatmapSVG">{days}</svg>
	}

	render() {
		let element = this.createLabelElement(this.state.selected);
		return element;/*(
			<li class="LeftBarLabel" onClick={this.handleClick} data-name={name} data-id={this.props._id}>
                <div class="LeftBarLabelHeatmap">{this.drawHeatmap()}</div>
                <p class="LeftBarLabelName" id={this.props._id}>{name}</p>
                <p class="LeftBarLabelCount">{count}</p>
            </li>
		);*/
	}
}