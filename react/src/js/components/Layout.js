import React from "react";

import Header from "./Header";
import LeftBar from "./LeftBar";

export default class Layout extends React.Component {
  constructor() {
    super();
    this.state = {
      title: "Tada Interface",
    };
  }

  render() {
    return (
      <div>
        <Header title={this.state.title} />
        <LeftBar />
      </div>
    );
  }
}