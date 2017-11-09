import React from "react";
import Selected from "./Selected";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const names = this.props.name;
		
		let Names

		if(names.length > 0) {
			Names = names.map((name, i) => {
				return <Selected key={name} name={name} />;
			});
		}

		return (
			<div class="TopBarLabels">
				<ul>{Names} </ul>
			</div>
		);
	}
}