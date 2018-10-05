var access_token = '';

var mobile = (/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent);
var local = window.location.host.indexOf('localhost') > -1;
var internal = window.location.host.indexOf('spotify.net') > -1;
var showCache = location.search.indexOf('cache') > -1;

var width = window.innerWidth, height = window.innerHeight;
var fadeInTime = 500;
var fadeOutTime = 500;
var moveTime = mobile ? 0 : 1000;
var updateTime = 3000;
var eventQueueMaxSize = 16;
var infoMaxLength = mobile ? 30 : 60;
var blurRadius = 4;
var zoom;

function updateZoom() {
  zoom = width / 4;
}
updateZoom();
var projection = d3.geo.stereographic()
  .scale(zoom / 3)
  .rotate([-35, -15])
  .clipAngle(160)

var svg = d3.select('#labels');
var canvas = d3.select('#world');

function updateWindow(){
  width = window.innerWidth;
  height = window.innerHeight;
  svg.attr("width", width).attr("height", height);
  canvas.attr("width", width).attr("height", height);
  projection
    .translate([width / 2, height / 2])
    .clipExtent([[0,0],[width,height]])
  redrawMap();
  updateCityPositions();
  updateZoom();
}
window.onresize = updateWindow;
updateWindow();

var ctx = canvas.node().getContext("2d");
var pathCanvas = d3.geo.path()
  .projection(projection)
  .context(ctx);

var land;
d3.json('data/world-110m.json', function(error, world) {
  land = topojson.feature(world, world.objects.land);
  if(!mobile) {
    rotateTo([-180, 0], 6000, zoom / 2);
  }
  redrawMap();
})

function redrawMap() {
  if(land) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    pathCanvas(land);
    ctx.fill();
  }
}

function fadeOut(cb) {
  d3.select('#overlay').transition()
    .ease('linear')
    .duration(fadeOutTime)
    .style('opacity', 0);
  setTimeout(cb, fadeOutTime);
}

function rotateTo(target, duration, scale, cb) {
  d3.transition()
    .duration(duration)
    .tween("rotate", function() {
      var p = target,
          r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]), // .geo goes over the poles too much
          s = d3.interpolate(projection.scale(), scale);
      return function(t) {
        projection
          .rotate(r(t))
          .scale(s(t));
        redrawMap();
      }
    })
    .each('end', cb)
}

function changeView(locations, cb) {
  var a = locations[0], b = locations[1];
  var target = d3.geo.interpolate(a, b)(0.5); // midpoint
  var distance = d3.geo.distance(a, b); // in radians
  var scale = zoom / (distance + .01); // need a better way to avoid NaNs when distance = 0...
  rotateTo(target, moveTime, scale, cb);
}

var radio = [new Audio(), new Audio()];
var radioSide = true;
function queueSong(url) {
  // console.log(url);
  radio[radioSide ? 0 : 1].src = url;
}
function swapSongs() {
  var a, b;
  if(radioSide) {
    a = radio[0], b = radio[1];
  } else {
    a = radio[1], b = radio[0];
  }
  // console.log(a, b);
  a.play();
  b.pause();
  radioSide = !radioSide;
}

var volume = true;
function toggleVolume() {
  volume = !volume;
  radio[0].volume = volume ? 1 : 0;
  radio[1].volume = volume ? 1 : 0;
  d3.select('#volume-icon')
    .style('opacity', volume ? 1 : .5);
}

var playing = true;
function togglePlaying() {
  playing = !playing;
  d3.select('#playing-icon')
    .attr('src', playing ? 'images/pause.png' : 'images/play.png');
}

function showMenu() {
  d3.select('#menu').transition()
    .ease('linear')
    .duration(100)
    .style('opacity', 1)
    .transition()
    .ease('linear')
    .delay(3000)
    .duration(1000)
    .style('opacity', 0);
}

d3.select('body')
  .on('keydown', function() {
    if(d3.event.keyCode == 32) { // ' '
      showMenu();
      togglePlaying();
    } else if(d3.event.keyCode == 77) { // 'm'
      showMenu();
      toggleVolume();
    }
  })
  .on('mousemove', function() {
    showMenu();
  })

var curUrl;
d3.select('#playing-icon').on('click', togglePlaying);
d3.select('#volume-icon').on('click', toggleVolume);
d3.select('#overlay').on('click', function() {
  if(!mobile) {
    window.open(curUrl);
  }
});

function joinArtists(obj) {
  var artists = [];
  obj.artists.forEach(function(artist) {
    artists.push(artist.name);
  });
  return artists.join(', ');
}

var locations;
function updateCityPositions() {
  if(locations) {
    // projected locations
    var screen0 = projection(locations[0]);
    var screen1 = projection(locations[1]);

    // position impact circles
    d3.select('#impact0')
      .attr('cx', screen0[0])
      .attr('cy', screen0[1])
    d3.select('#impact1')
      .attr('cx', screen1[0])
      .attr('cy', screen1[1])

    // position impact points
    d3.select('#point0')
      .attr('cx', screen0[0])
      .attr('cy', screen0[1])
    d3.select('#point1')
      .attr('cx', screen1[0])
      .attr('cy', screen1[1])

    // position city names
    d3.select('#city0')
      .style('left', screen0[0]+'px')
      .style('top', screen0[1]+'px')
    d3.select('#city1')
      .style('left', screen1[0]+'px')
      .style('top', screen1[1]+'px')
  }
}

function formatInfo(str) {
  if(str.length > infoMaxLength) {
    str = str.substr(0, infoMaxLength);
    str = str.replace(/[^\w\]\)\}\>\.]+\w*$/, '...');
  }
  return str.toUpperCase();
}

function fadeIn(msg, json, img) {
  curUrl = json.external_urls.spotify;

  // track, artists, album info
  var artists = joinArtists(json);
  d3.select('#artists').text(formatInfo(artists));
  d3.select('#album').text(formatInfo(json.album.name));
  d3.select('#track').text(formatInfo(json.name));
  var boringAlbumName = json.album.name == json.name || json.album.name == artists;
  d3.select('#album').style('display', boringAlbumName ? 'none' : null);

  // update locations
  locations = msg.locations;
  updateCityPositions();

  // update city names
  d3.select('#city0')
    .text(msg.cities[0].toUpperCase())
  d3.select('#city1')
    .text(msg.cities[1].toUpperCase())

  // update cover image
  var cover = d3.select('#cover').node();
  stackBlurCanvasImage(img, cover, blurRadius);

  // start transitions
  d3.selectAll('.impact')
    .style('opacity', 1)
    .attr('r', '0px')
    .transition()
    .duration(2000)
    .ease('linear')
    .attr('r', '300px')
    .style('opacity', 0)

  d3.select('#overlay')
    .transition()
    .duration(fadeInTime)
    .ease('linear')
    .style('opacity', 1)
}

function loadImage(url, cb) {
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
      cb(img);
  };
  img.src = url;
}

var firstRender = true;
function render(msg, json, img) {
  if(firstRender) {
    firstRender = false;
    d3.select('#title')
      .transition()
      .duration(500)
      .style('opacity', 0)
      .each('end', function() {
        d3.select('#info')
          .style('opacity', 1);
        d3.select('#splash')
          .remove();
      })
  }
  if(playing) {
    if(!mobile) {
      queueSong(json.preview_url);
    }
    fadeOut(function() {
      changeView(msg.locations, function() {
        fadeIn(msg, json, img);
        swapSongs();
      })
    })
  }
}

var eventQueue = [];
function queueEvent(e) {
  eventQueue.push(e);
}
function unqueueEvent() {
  if(eventQueue.length) {
    eventQueue.shift()();
  }
}
setInterval(unqueueEvent, updateTime);

function parse(msg) {
  var cur = msg.split('\t');
  return {
    track_id: cur[0],
    cities: [cur[1], cur[2]],
    locations: [
      [parseFloat(cur[3]), parseFloat(cur[4])],
      [parseFloat(cur[5]), parseFloat(cur[6])]
    ]
  };
}

function messageHandler(msg) {
  // this can still queue up too many because there is a delay
  // between the check and the queueEvent, but it just means
  // it will queue up more consecutive results than evenly spaced
  if(eventQueue.length < eventQueueMaxSize) {
    msg = parse(msg);
    // console.log(msg); // has cities, locations, trackid
    var apiUrl = 'https://api.spotify.com/v1/tracks/' + msg.track_id;
    d3.json(apiUrl)
    .header('Authorization', 'Bearer ' + access_token)
    .get(function(error, json) {
      // console.log(json); // sometimes preview_url: null
      var coverUrl = json.album.images.pop().url;
      loadImage(coverUrl, function(img) {
        queueEvent(function() {
          render(msg, json, img);
        })
      })
    })
  } else {
    // ignore too many messages
  }
}

function setIntervalImmediate(func, delay) {
  (function interval() {
    func();
    setTimeout(interval, delay);
  })();
}

d3.json('data/cache.json', function(error, cache) {
  cache = _.shuffle(cache);
  var index = 0;
  setIntervalImmediate(function readMessage() {
    messageHandler(cache[index]);
    index++;
    if(index == cache.length) {
      index = 0;
    }
  }, updateTime);
})

// turn off unused elements on mobile
if(mobile) {
  d3.selectAll('#icons')
    .style('display', 'none');
}

// turn volume off when running locally
if(local) {
  toggleVolume();
}