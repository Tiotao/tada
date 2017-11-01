import React from "react";
import axios from "axios";

import Header from "./Header";
import LeftBar from "./LeftBar";
import Canvas from "./Canvas";
import LabelStore from "../stores/LabelStore";

export default class Layout extends React.Component {
  constructor() {
    super();
    this.state = {
      title: "Tada Interface"
    };
  }

  componentDidMount() {
    axios.get('http://localhost:3000/api/labels')
      .then(res => {
        console.log(res.data)
        this.setState({
          data : res.data.data.slice(0,50)
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  render() {
    return (
      <div>
        <Header title={this.state.title} />
        <LeftBar data={this.state.data} />
        <Canvas />
      </div>
    );
  }
}