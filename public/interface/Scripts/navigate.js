var width = 2500
	, height =800;

var API_SERVER = 'http://localhost:3000/api';

var renderer = PIXI.autoDetectRenderer(width, height, {
	transparent: true,
	resolution: 1,
	antialias: true
});

document.getElementById('ChartStage').appendChild(renderer.view);
var stage = new PIXI.Container();
var oldData;

// $('.LastLabelName').html("Watermellon");

$('.CurrentLabelName').html("Welcome");

$(document).ready(function() {
	$('.LeftBarLabel').click(function(e) {
		var id = e.currentTarget.id;
		$.get(`${API_SERVER}/labels/`+id, function(data, status){
			console.log(data)
			$('.CurrentLabelName').html(data.name);
			for(var i = 0; i < 10; i++) {
				if(data.relations[i]) {
					$('.CurrentLabelRelations').children().eq(i).html(data.relations[i].name);
					$('.CurrentLabelRelations').children().eq(i).attr('id', data.relations[i]._id);
				}
			}

      if(!oldData) {
        drawDots(data);
      }
      else {
        $('.LastLabelName').html(oldData.name);
        // drawTwoSetDots(oldData, data);
        drawDots(data);
      }
      oldData = data;
		})
	})

	$('.CurrentLabelRelationsName').click(function(e) {
		var id = e.currentTarget.id;
		$.get(`${API_SERVER}/labels/`+id, function(data, status){
			console.log(data)
			$('.CurrentLabelName').html(data.name);
			for(var i = 0; i < 10; i++) {
				if(data.relations[i]) {
					$('.CurrentLabelRelations').children().eq(i).html(data.relations[i].name);
					$('.CurrentLabelRelations').children().eq(i).attr('id', data.relations[i]._id);
				}
			}
      if(!oldData) {
        drawDots(data);
      }
      else {
        $('.LastLabelName').html(oldData.name);
        // drawTwoSetDots(oldData, data);
        drawDots(data);
      }
      oldData = data;
		})
	})
})
var dataLast = {
  "name": "Label1",
  "id": "asdfasdfasd1",
  "video_count": 123300,
  "relations": [
    {
      "id": "asdfasdfasdf",
      "name": "Battlefront2",
      "is_meta": true,
      "count": 455
    },
    {
      "id": "asdfasdfasdf",
      "name": "Starwhat",
      "is_meta": false,
      "count": 450
    }
  ],
  "history": {
    "grouped_by": "hour",
    "videos": [
      [
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.2",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Darth Vador', 'Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        }
      ],[
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.1",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.2",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Darth Vador', 'Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        }
      ],[
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.1",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        }
      ],
      [
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.1",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.2",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        }
      ]
    ]
  }
}
var data = {
  "name": "Darth Vador",
  "id": "asdfasdfasdf",
  "video_count": 123343,
  "relations": [
    {
      "id": "asdfasdfasdf",
      "name": "Battlefront2",
      "is_meta": true,
      "count": 455
    },
    {
      "id": "asdfasdfasdf",
      "name": "Starwhat",
      "is_meta": false,
      "count": 450
    }
  ],
  "history": {
    "grouped_by": "hour",
    "videos": [
      [
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.2",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label1', 'Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        }
      ],[
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.1",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label1', 'Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.2",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label1', 'Label2', 'Label3']
        }
      ],[
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.1",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label1', 'Label2', 'Label3']
        }
      ],
      [
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.1",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label1', 'Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.2",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label2', 'Label3']
        },
        {
          "id": "asdfasdfasdfasfd",
          "href": "http://www.youtube.3",
          "title": "One Awesome Video",
          "views": 123123,
          "labels": ['Label1', 'Label2', 'Label3']
        }
      ]
    ]
  }
}

function drawTwoSetDots(data1, data2) {
	var stage = new PIXI.Container();

	var label1 = data1._id;
	var history1 = data1.history.videos;
	var history2 = data2.history.videos;

	for(var j = 0; j < history1.length; j++) {
		var currentY = height/2 + 20;

    if(history2[j].length > history1[j].length) {
      for(var k = 0; k < history1[j].length; k++) {
        // console.log(j, k)
        // console.log(history2[j][k])
        if(!include(history2[j][k].labels, label1)) {
          console.log("not shared")
          var dot = new PIXI.Graphics();
          dot.beginFill(6777822);
          dot.drawRoundedRect(0, 0, 15, 15, 5);
          dot.x = width - 20*(j+1);
          dot.y = currentY - 20;
          currentY -= 20;
          dot.interactive = true;
          dot.buttonMode = true;
          dot.index = [j,k];

          dot.on('mousedown', (e) => {
            // showVideo(data.history.videos[e.target.index[0]][e.target.index[1]]);
            showVideo({
              href: 'adsfasdfadsf'
            })
          })
          stage.addChild(dot); 
        }
        console.log("shared")
      }
    }
		
	}

	// for(var j = 0; j < history2.length; j++) {
	// 	var middleCount = [];
	// 	var lowerCount = [];

	// 	for(var k = 0; k < history2[j].length; k++) {
	// 		var dot = new PIXI.Graphics();
	// 		if(include(history2[j][k].labels, label1)) {
	// 			dot.beginFill(11824011);
	// 			dot.index = [j,k];
	// 			middleCount.push(dot);
	// 		}
	// 		else {
	// 			dot.beginFill(16777215);
	// 			dot.index = [j,k];
	// 			lowerCount.push(dot);
	// 		}
	// 		dot.drawRoundedRect(0, 0, 15, 15, 5);
	// 		dot.x = width - 20*(j+1);
	// 		dot.interactive = true;
	// 		dot.buttonMode = true;

	// 		dot.on('mousedown', (e) => {
	// 			// showVideo(data.history.videos[e.target.index[0]][e.target.index[1]]);
	// 			showVideo({
	// 				href: 'adsfasdfadsf'
	// 			})
	// 		})
	// 		stage.addChild(dot); 
	// 	}
	// 	// console.log(middleCount, lowerCount);
	// 	// console.log("one loop")

	// 	var currentY = height/2;
	// 	for(var i = 0; i < middleCount.length; i++) {
	// 		console.log(currentY)
	// 		middleCount[i].y = currentY + 20;
	// 		currentY += 20;
	// 	}
	// 	for(var i = 0; i < lowerCount.length; i++) {
	// 		lowerCount[i].y = currentY + 20;
	// 		currentY += 20;
	// 	}

	// }
	renderer.render(stage);
}

// drawTwoSetDots(dataLast, data);
// drawDots(data);

function drawDots(data) {
  var width = 2500;
	var stage = new PIXI.Container();
	for(var j = 0; j < data.history.videos.length; j++) {
		for(var k = 0; k < data.history.videos[j].length; k++) {
			var dot = new PIXI.Graphics();
			dot.beginFill(16777215);
			dot.drawRoundedRect(0, 0, 15, 15, 8);
			dot.x = width - 20*(j+1);
			dot.y = height - 20*(k+1);
			dot.interactive = true;
			dot.buttonMode = true;
			dot.index = [j,k];

			dot.on('mousedown', (e) => {
        var videoId = data.history.videos[e.target.index[0]][e.target.index[1]].id;

        $.get(`${API_SERVER}/videos/`+videoId, function(data, status){
          showVideo(data);
        })
			})
			stage.addChild(dot); 
		}
	}
	renderer.render(stage);
}

function showVideo(data) {
  var href = 'https://www.youtube.com/embed/'+ getId(data.href) +'?autoplay=1';
	$('.Overlay').removeClass('hidden').addClass('reveal');
	$('.OverlayVideo').attr('src', href);
	$('.Overlay').addClass('load');
	$('.OverlayVideo').addClass('load');

  $('.VideoTitle').attr('href', href).html(data.title);
  $('.VideoChannel').html("Posted on " + data.channel);
  $('.VideoPostedTime').html("at " + formatTimestamp(data.timestamp));
  $('.VideoView').html("Views: " + data.views);

  for(var i = 0; i < data.labels.length; i++) {
    $('.VideoLabels').append(
      $('<li>').attr('class', 'VideoLabelsName').append(
        $('<a>').append(data.labels[i].name)));
  }
}

function getId(url) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);

    if (match && match[2].length == 11) {
        return match[2];
    } else {
        return 'error';
    }
}

$('.OverlayClose').click(function() {
	$('.Overlay').removeClass('reveal').removeClass('load');
	$('.OverlayVideo').removeClass('load');
	setTimeout(function() {
		$('.Overlay').addClass('hidden');
	}, 1000);
})

function include(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

function formatTimestamp(timestamp) {
  var date = new Date(timestamp*1000);

  var day = date.getDate()
    , month = date.getMonth()
    , year = date.getFullYear()
    , hours = date.getHours()
    , minutes = "0" + date.getMinutes();

  var formattedTime = year + '/' + month + '/' + day + '/' + hours + ':' + minutes.substr(-2) ;

  return formattedTime
}