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

/**
 * Main component
 */
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

    //Request for labels data
    axios.get('/api/labels')
      .then(res => {
        this.state.labels = res.data.data;
        return axios.post('/api/filter', {
          "ids": [],
          "view_count_range": this.state.view,
          "like_ratio_range": this.state.vl_ratio
        });
      })
      .then(response => {
        this.setState({
          videos: response.data
        })
      })
      .catch(err => {
        console.log(err);
      });

    //Request for filter graph data
    axios.get('/api/graph') 
      .then(res => {
        this.state.graph = res.data;
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Get selected label IDs
   * @return {Array} - selected label IDs
   */
  getSelectedLabelIds(){
      return this.state.selected.map(label =>
        label.id
    );
  }

  /**
   * Add selected labels
   * @param {String} - id
   * @param {String} - name
   * @param {React Component} - label
   * @return {Function} - get or remove selected label IDs
   */
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

  /**
   * Remove selected labe
   * @param {String} - id
   * @return {Function} - getSelectedLabelIds
   */
  removeSelectedLabel(id) {
    let currSelectedLabels = this.getSelectedLabelIds();
    let removeIndex = currSelectedLabels.indexOf(id);
    let removedLabelObj = this.state.selected.splice(removeIndex, 1);
    //Deselects label from left bar (if disabled from top bar);
    removedLabelObj[0].label.setState({selected: false});
    return this.getSelectedLabelIds();
  }

  /**
   * Set videos
   * @param {Object} - data
   * @return {null}
   */
  setVideos(data) {
    this.setState({
      videos:data
    });
  }

  /**
   * Handle switch 
   * @param {String} - axis
   * @param {String} - switch name/value
   * @return {null}
   */
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

  /**
   * Update filter
   * @param {String} - filter name
   * @param {Number} - start position
   * @param {Number} - end position
   * @return {null}
   */
  updateFilter(filter, start, end) {
    if(filter === null) {
      this.state.view = [0, 100];
      this.state.vl_ratio = [0, 100];
    }
    else if(filter == "view") {
      this.state.view = [start, end];
    }
    else if(filter == "vl_ratio") {
      this.state.vl_ratio = [start, end];
    }
    else {
      console.log("Can't identify the filter.")
    }
    this.updateVideosAfterFilter();
  }

  /**
   * Update videos after filter
   * @return {null}
   */
  updateVideosAfterFilter() {
    axios.get('/api/labels').then(res => {
        this.state.labels = res.data.data.slice(0,80);
        return axios.post('/api/filter', {
          "ids": this.getSelectedLabelIds(),
          "view_count_range": this.state.view,
          "like_ratio_range": this.state.vl_ratio
        });
    }).then(response => {
      this.setState({
        videos : response.data
      });
    }).catch(err => {
      console.log(err);
    });
  };

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