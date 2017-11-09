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
      selected: ['test']
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

    axios.post('http://localhost:3000/api/filter-videos', {
        'ids':['59e1570ec7e0c22a00d7648e', '59e92e81dc4aaf47c4e09871'],
        'view_count_range': ["0", "Infinity"],
        'like_ratio_range': ["0", "1"]
      })
      .then(res => {
        console.log(res);
        this.setState({
          videos : res.data
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  handleLabelData(data) {
    if(this.state.selected.indexOf(data.name) < 0) {
      this.setState({
        labelData: data,
        selected: [...this.state.selected, data.name]
      })
    }
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