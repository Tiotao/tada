import React from "react";
import Selected from "./Selected";

export default class TopBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const names = this.props.name;
		
		let Selected

		if(names.length == 0) {
			console.log("emotyyy")
		}
		console.log(names)
		if(names.length > 0) {
			Selected = names.map((name, index) => {

				// console.log(<Selected key={index} name={name} />)
				return <Selected key={index} />;
			});
		}

		return (
			<div class="TopBarLabels">
				<ul class="TopBarLabels">
					{Selected}
				</ul>
			</div>
		);
	}
}