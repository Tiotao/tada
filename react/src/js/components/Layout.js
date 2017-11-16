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

    this.previewData = "";

    this.setVideos = this.setVideos.bind(this);
    this.addSelectedLabels = this.addSelectedLabels.bind(this);
    this.getSelectedLabelIds = this.getSelectedLabelIds.bind(this);
    this.removeSelectedLabel = this.removeSelectedLabel.bind(this);
    this.handleSwitch = this.handleSwitch.bind(this);
    this.handlePreviewUpdate = this.handlePreviewUpdate.bind(this);
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

  getSelectedLabelIds(){
      return this.state.selected.map(label =>
        label.id
    );
  }

  addSelectedLabels(id, name, label) {    
    let currSelectedLabels = this.getSelectedLabelIds();
    let isLabelSelected = !label.state.selected;



    if(isLabelSelected) { 
      //If currently selected label report that the label is ALREADY in selection
      if(currSelectedLabels.indexOf(id) > -1) { 
        console.warn('Label is selected but its already in selection.');
      }
      //Label is not in selection, so add it in.
      else { 
        this.state.selected.push({name: name, id: id, label: label});
        this.setState({selected: this.state.selected});
        //Reacts label state change might be slower than this function's completion. Hence purely UI change.
        label.setState({selected: isLabelSelected});
      }
    }
    //Label is unselected so remove it from topbar.
    else { 
      //Removed label state change handled in removeSelectedLabel function
      this.removeSelectedLabel(id);
    }
    
    return this.getSelectedLabelIds();
  }

  removeSelectedLabel(id) {
    let currSelectedLabels = this.getSelectedLabelIds();
    let removeIndex = currSelectedLabels.indexOf(id);
    let removedLabelObj = this.state.selected.splice(removeIndex, 1);
    //Deselects label from left bar (if disabled from top bar);
    removedLabelObj[0].label.setState({selected: false});
    this.setState({selected: this.state.selected});
    return this.getSelectedLabelIds();
  }

  setVideos(data) {
    this.setState({
      videos:data
    });
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
        <LeftBar labels={this.state.labels} addSelectedLabels={this.addSelectedLabels} setVideos={this.setVideos}
            selected={this.state.selected}/>
        <TopBar selected={this.state.selected} removeSelectedLabel={this.removeSelectedLabel} setVideos={this.setVideos}/>
        <Canvas videos={this.state.videos} x={this.state.x} y={this.state.y} time={this.state.time}/>
        <Timeline />
        <Switches handleSwitch={this.handleSwitch} />
        <Overlay />
      </div>
    );
  }
}