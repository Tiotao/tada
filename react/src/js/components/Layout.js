import React from "react";
import axios from "axios";

import Canvas from "./Canvas";
import Filters from "./Filters";
import Header from "./Header";
import LabelStore from "../stores/LabelStore";
import LeftBar from "./LeftBar";
import Overlay from "./Overlay";
import Switches from "./Switches";
import Timeline from "./Timeline";
import TopBar from "./TopBar";

export default class Layout extends React.Component {
  constructor() {
    super();
    this.state = {
      title: "Tada Interface",
      selected: []
    };

    this.handleLabelData = this.handleLabelData.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
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
        console.log(response.data)
        this.setState({
          videos : response.data
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  handleLabelData(name, id, data) {
    console.log(data)
    if(this.state.selected.indexOf(data.name) < 0) {
      this.setState({
        videos: data,
        selected: [...this.state.selected, {
          name: name,
          id: id
        }]
      })
    }
  }

  handleRemove(index, data) {
    console.log(data, index)
    if(this.state.selected.indexOf(data.name) >= 0) {
      this.setState({
        videos: data,
        selected: this.state.selected.splice(index, 1)
      })
    }
  }

  render() {
    return (
      <div>
        <Header title={this.state.title} />
        <Filters />
        <LeftBar labels={this.state.labels} handleLabelData={this.handleLabelData} selected={this.state.selected}/>
        <TopBar selected={this.state.selected} handleRemove={this.handleRemove}/>
        <Canvas videos={this.state.videos} />
        <Timeline />
        <Switches />
        <Overlay />
      </div>
    );
  }
}