import React from "react";
import axios from "axios";


import Canvas from "./Canvas";
import Header from "./Header";
import LabelStore from "../stores/LabelStore";
import LeftBar from "./LeftBar";
import TopBar from "./TopBar";

export default class Layout extends React.Component {
  constructor() {
    super();
    this.state = {
      title: "Tada Interface",
      labelData: {
        name: "Welcome"
      },
      selected: []
    };

    this.handleLabelData = this.handleLabelData.bind(this);
  }

  componentDidMount() {
    axios.get('http://localhost:3000/api/labels')
      .then(res => {
        this.setState({
          data : res.data.data.slice(0,50)
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  handleLabelData(data) {
    this.setState({
      labelData: data,
      selected: [...this.state.selected, data.name]
    })
  }

  render() {
    return (
      <div>
        <Header title={this.state.title} />
        <LeftBar data={this.state.data} handleLabelData={this.handleLabelData}/>
        <TopBar name={this.state.selected} />
        <Canvas labelData={this.state.labelData} />
      </div>
    );
  }
}