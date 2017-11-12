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
      selected: ['test']
    };

    this.handleLabelData = this.handleLabelData.bind(this);
  }

  componentDidMount() {
    axios.get('http://localhost:3000/api/labels')
      .then(res => {
        this.setState({
          labels : res.data.data.slice(0,50)
        })

        return axios.post('http://localhost:3000/api/filter', {
          "ids": [],
          "view_count_range": ["0", "Infinity"],
          "like_ratio_range": ["0", "1"]
        })
      })
      .then(response => {
        this.setState({
          videos : response.data
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  handleLabelData(name, data) {
    console.log(data)
    if(this.state.selected.indexOf(data.name) < 0) {
      this.setState({
        data: data,
        selected: [...this.state.selected, name]
      })
    }
  }

  render() {
    return (
      <div>
        <Header title={this.state.title} />
        <LeftBar labels={this.state.labels} handleLabelData={this.handleLabelData}/>
        <TopBar name={this.state.selected} />
        <Canvas videos={this.state.videos} />
      </div>
    );
  }
}