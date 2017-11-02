import React from "react";

export default class Label extends React.Component {
	constructor(props) {
		super();
	}

	render() {
		const { id, name, is_meta, score, count } = this.props
		console.log(this.props)
		return (
			<a class="LeftBarLabel">
				<li>
					<p class="LeftBarLabelName">{name}</p>
					<p class="LeftBarLabelCount">{count}</p>
					</li>
			</a>
		);
	}
}