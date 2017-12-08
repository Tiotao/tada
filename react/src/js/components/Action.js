import React from "react";
import $ from "jquery";

export default class Action extends React.Component {
	constructor(props) {
		super();
	}

	/**
	 * Handle click actions in video overlay
	 * @param {Object} - mouse down event object
	 * @return {null}
	 */
	handleClick(e) {
		var action = $(e.target).parent().attr('id'); 

		//click Add button
		if(action == "Add") {
			$('.VideoActionAdd').removeClass('hidden').addClass('load');
			$(document).click(function(e) {
				if(!$(e.target).closest('.VideoActionAdd').length && !$(e.target).hasClass('ActionButtonIcon')) {
					if(!$('.VideoActionAdd').hasClass('hidden')) {
						$('.VideoActionAdd').addClass('hidden');
					}
				}
			})
		}

		//click Share button
		if(action == "Share") {
			$('.VideoActionShare').removeClass('hidden').addClass('load');
			// document.execCommand('copy');
			$(document).click(function(e) {
				if(!$(e.target).closest('.VideoActionShare').length && !$(e.target).hasClass('ActionButtonIcon')) {
					if(!$('.VideoActionShare').hasClass('hidden')) {
						$('.VideoActionShare').addClass('hidden');
					}
				}
			})
		}
	}

	render() {
		return (
			<li class="ActionButton" id={this.props.action}>
				<img class="ActionButtonIcon" src={this.props.icon} onMouseDown={this.handleClick}/>
			</li>
		);
	}
}