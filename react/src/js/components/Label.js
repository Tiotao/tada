import React from "react";
import axios from "axios";

export default class Label extends React.Component {
	constructor(props) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e) {
		e.preventDefault();

		axios.get('http://localhost:3000/api/labels/'+e.target.id)
      .then(res => {
        this.props.handleLabelData(res.data)
        console.log(res.data)
      })
      .catch(err => {
        console.log(err);
      })
	}

	render() {
		const { id, name, is_meta, score, count } = this.props;

		return (
			<li>
				<a class="LeftBarLabel">
					<p class="LeftBarLabelName" id={this.props._id} onClick={this.handleClick}>{name}</p>
					<p class="LeftBarLabelCount">{count}</p>
				</a>
			</li>
		);
	}
}