import React from "react";
import axios from "axios";
import $ from "jquery";

import Canvas from "./Canvas";
import Filters from "./Filters";
import Header from "./Header";
import LabelStore from "../stores/LabelStore";
import LeftBar from "./LeftBar";
import Overlay from "./Overlay";
import Preview from "./Preview";
import Switches from "./Switches";
import Timeline from "./Timeline";
import Tips from "./Tips";
import TopBar from "./TopBar";

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "Tada Interface",
      selected: [],
      x: Switches.getDefaultXAxis(),
      y: Switches.getDefaultYAxis(),
      time: "86400",
      previewData: "",
      graph: [],
      view: [0,100],
      vl_ratio: [0,100]
    };

    this.view = [0,100];
    this.vl_ratio = [0,100];

    this.previewData = "";
    this.setVideos = this.setVideos.bind(this);
    this.addSelectedLabels = this.addSelectedLabels.bind(this);
    this.getSelectedLabelIds = this.getSelectedLabelIds.bind(this);
    this.removeSelectedLabel = this.removeSelectedLabel.bind(this);
    this.handleSwitch = this.handleSwitch.bind(this);
    this.handlePreviewUpdate = this.handlePreviewUpdate.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
  }

  componentDidMount() {
    let videos;
    axios.get('/api/labels')
      .then(res => {
        console.log(res.data.data);
        this.state.labels = res.data.data;
        return axios.post('/api/filter', {
          "ids": [],
          "view_count_range": this.state.view,
          "like_ratio_range": this.state.vl_ratio
        });
      })
      .then(response => {
        console.log(response.data);
        this.setState({
          videos: response.data
        })
      })
      .catch(err => {
        console.log(err);
      });

    axios.get('/api/graph') 
      .then(res => {
        this.state.graph = res.data;
      })
      .catch(err => {
        console.log(err);
      });
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.view != prevState.view || 
      this.state.vl_ratio != prevState.vl_ratio) {
        axios.get('/api/labels')
        .then(res => {
          console.log(res.data);
          this.state.labels = res.data.data.slice(0,80);
          return axios.post('/api/filter', {
            "ids": [],
            "view_count_range": this.state.view,
            "like_ratio_range": this.state.vl_ratio
          })
        })
        .then(response => {
          console.log(response.data);
          this.setState({
            videos : response.data
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
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
        //Reacts label state change might be slower than this function's completion. Hence purely UI change.
        label.setState({selected: isLabelSelected});
      }
    }
    //Label is unselected so remove it from topbar.
    else { 
      //Removed label state change handled in removeSelectedLabel function
      return this.removeSelectedLabel(id);
    }
    
    return this.getSelectedLabelIds();
  }

  removeSelectedLabel(id) {
    let currSelectedLabels = this.getSelectedLabelIds();
    let removeIndex = currSelectedLabels.indexOf(id);
    let removedLabelObj = this.state.selected.splice(removeIndex, 1);
    //Deselects label from left bar (if disabled from top bar);
    removedLabelObj[0].label.setState({selected: false});
    return this.getSelectedLabelIds();
  }

  setVideos(data) {
    console.log("set videos triggered", data);
    this.setState({
      videos:data
    });
  }

  handleSwitch(axis, value) {
    console.log(value);
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

  //Doesn't do anything? Added return
  handlePreviewUpdate(data) {
    return;
    this.previewData = data;
    this.setState({
      previewData: data
    })
  }

  updateFilter(filter, start, end) {
    console.log("filter");
    if(filter == "view") {
      this.setState({
        view: [start, end]
      })
    }
    else if(filter == "vl_ratio") {
      this.setState({
        vl_ratio: [start, end]
      })
    }
    else {
      console.log("Can't identify the filter.")
    }
    console.log(filter, start, end)
  }

  render() {
    return (
      <div class="Layout">
        <Tips />
        <div class="TopbarContainer">
          <Filters graph={this.state.graph} handleUpdate={this.updateFilter}/>
          <LeftBar 
            labels={this.state.labels} 
            addSelectedLabels={this.addSelectedLabels} 
            setVideos={this.setVideos}
            handleLabelData={this.handleLabelData} 
            selected={this.state.selected}/>
          <TopBar 
            selected={this.state.selected} 
            removeSelectedLabel={this.removeSelectedLabel} 
            setVideos={this.setVideos}/>
        </div>
        <div class="CenterContainer">
          <Canvas videos={this.state.videos} x={this.state.x} y={this.state.y} time={this.state.time} handlePreviewUpdate={this.handlePreviewUpdate}/>
        </div>
        <div class="FooterContainer">
          <div class="FooterSwitch">
            <Switches handleSwitch={this.handleSwitch} />
          </div>
        </div>
        <Preview />
        <Overlay />
      </div>
    );
  }
}