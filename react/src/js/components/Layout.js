import React from "react";
import axios from "axios";

import Canvas from "./Canvas";
import Filters from "./Filters";
import Header from "./Header";
import LabelStore from "../stores/LabelStore";
import LeftBar from "./LeftBar";
import Overlay from "./Overlay";
import Preview from "./Preview";
import Switches from "./Switches";
import Timeline from "./Timeline";
import TopBar from "./TopBar";

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "Tada Interface",
      selected: [],
      x: "byPosted",
      y: "byViews",
      time: "3600",
      previewData: ""
    };

    this.handleLabelData = this.handleLabelData.bind(this);
    this.setVideos = this.setVideos.bind(this);
    this.addSelectedLabels = this.addSelectedLabels.bind(this);
    this.getSelectedLabelIds = this.getSelectedLabelIds.bind(this);
    this.removeSelectedLabel = this.removeSelectedLabel.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleSwitch = this.handleSwitch.bind(this);
    this.handlePreviewUpdate = this.handlePreviewUpdate.bind(this);
  }

  componentDidMount() {
    axios.get('/api/labels')
      .then(res => {
        this.setState({
          labels : res.data.data.slice(0,50)
        })

        return axios.post('/api/filter', {
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

  getSelectedLabelIds(){
      return this.state.selected.map(label =>
        label.id
    );
  }

  addSelectedLabels(id, name) {    
    let currSelectedLabels = this.getSelectedLabelIds();
    if(currSelectedLabels.indexOf(id) > -1){
      console.log("already selected");
    }
    else {
      this.state.selected.push({name: name, id: id});
      this.setState({selected: this.state.selected});
    }
    return this.getSelectedLabelIds();
  }

  removeSelectedLabel(id) {
    let currSelectedLabels = this.getSelectedLabelIds();
    let removeIndex = currSelectedLabels.indexOf(id);
    this.state.selected.splice(removeIndex, 1);
    this.setState({selected: this.state.selected});
    return this.getSelectedLabelIds();
  }

  setVideos(data) {
    this.setState({
      videos:data
    });
  }

  handleLabelData(name, id, data) {
    console.log(data)
    if(this.state.selected.indexOf(data.name) < 0) {
      this.setState({
        videos: data
      });
    }
  }

  handleRemove(index, data) {
    console.log(this.state.selected, data.name, data);
    //if(this.state.selected.indexOf(data.name) >= 0) {
      this.setState({
        videos: data,
        //selected: this.state.selected.splice(index, 1)
      });

    console.log(this.state.selected, data.name, data);
    //}
  }

  handleSwitch(axis, value) {
    if(axis == "x") {
      this.setState({
        x: value
      })
    }
    else if(axis == "y") {
      this.setState({
        y: value
      })
    }
    else {
      this.setState({
        time: value
      })
    }
  }

  handlePreviewUpdate(data) {
    this.previewData = data;
    console.log(data)
    // return data;
    this.setState({
      previewData: data
    })
  }

  render() {
    return (
      <div>
        <Filters />
        <LeftBar 
          labels={this.state.labels} 
          addSelectedLabels={this.addSelectedLabels} 
          setVideos={this.setVideos}
          handleLabelData={this.handleLabelData} 
          selected={this.state.selected}/>
        <TopBar 
          selected={this.state.selected} 
          removeSelectedLabel={this.removeSelectedLabel} 
          setVideos={this.setVideos} 
          handleRemove={this.handleRemove}/>
        <Canvas videos={this.state.videos} x={this.state.x} y={this.state.y} time={this.state.time} handlePreviewUpdate={this.handlePreviewUpdate}/>
        <Timeline />
        <Switches handleSwitch={this.handleSwitch} />
        <Preview />
        <Overlay />
      </div>
    );
  }
}