import { EventEmitter } from "events";
import axios from "axios";

import dispatcher from "../dispatcher";

class LabelStore extends EventEmitter {
	constructor() {
		super();

		this.fakedata = "123";
		
	}

	
	getAll() {
		// console.log(this.state.data)
		// return this.state.data;
	}
}

const labelStore = new LabelStore;
// dispatcher.register(labelStore.handleActions.bind(labelStore));

export default labelStore;