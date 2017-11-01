import React from "react";

export default class LeftBar extends React.Component {
	render() {
		return (
			<div class="LeftBar">
				<ul class="LeftBarLabels">	
					<a class="LeftBarLabel">
						<li>
							<p class="LeftBarLabelName">name1</p>
							<p class="LeftBarLabelCount">count1</p>
							</li>
					</a>
					<a class="LeftBarLabel">
						<li>
							<p class="LeftBarLabelName">name1</p>
							<p class="LeftBarLabelCount">count1</p>
							</li>
					</a>
					<a class="LeftBarLabel">
						<li>
							<p class="LeftBarLabelName">name1</p>
							<p class="LeftBarLabelCount">count1</p>
							</li>
					</a>
				</ul>
			</div>
		);
	}
}