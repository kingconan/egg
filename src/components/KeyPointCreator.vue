<template>
  <div id="app" style="width: 100%;position: relative">
    <div v-if="mode == 0">
      Load...
       <!--<input placeholder="server url" v-model="qurl" />-->
      <!--<button type="button" @click="set_by_qiniu">use qiniu url</button>-->
    </div>
    <div v-else style="width: 100%;position: relative;">
      <div style="float: left;width: 100%;position: relative;height: 100%;overflow-y: auto;">
        <div style="padding-left: 400px;">
          <div style="background-color: #FFF;padding: 0 8px">
            <div v-if="videoLoaded">
              <div style="height: 160px">
                <div style="font-size: 16px;font-weight: bold;padding: 8px 0">Create Key Points</div>
                <div style="font-size: 10px;">
                  <button type="button" @click="play2(-1)">/ 2</button>
                  <button type="button" @click="playVideo">{{btnPlay}}</button>
                  <button type="button" @click="play2(1)">x 2</button>
                  <div style="float: right;margin-right: 15px">
                    <span>Speed {{videoNode.playbackRate}}</span>
                    <span> | </span>
                    <span>{{sec2time(currentTime)}} / {{sec2time(videoNode.duration)}}s</span>
                  </div>

                </div>
                <div style="padding:32px;position: relative">

                  <vue-slider :clickable="false"
                              @callback="seek_callback"
                              @drag-end="seek_end"
                              @drag-start="seek_start"
                              ref="slider"
                              v-model="currentTime" :max="videoNode.duration"
                              v-bind="slider_setting"></vue-slider>
                <canvas id="buffered_canvas" :width="sliderWidth" height="6" ></canvas>

                </div>
              </div>
              <div style="height:30px"></div>
              <div :style="'overflow-y:auto;height:'+ (fullHeight-160) + 'px'">
                <div v-for="(point, index) in points" v-bind:key="index"
                     style="border:1px dashed #ccc;padding:16px 32px;margin: 12px 0">
                  <div style="text-align: left">Step {{index+1}}</div>
                  <div style="height: 40px"></div>
                  <vue-slider :clickable="false"
                              @currentChangeValue="currentChangeValue"
                              @drag-end="seek_range_end"
                              @callback="seek_range_callback"
                              ref="slider" :interval="0.01"
                              v-model="point.range" :max="videoNode.duration"
                              v-bind="slider_setting"></vue-slider>
                  <div style="text-align: left">
                    <textarea placeholder="add description here" v-model="point.description" rows="2" class="ta"></textarea>
                    <button type="button" @click="remove_point(index)">remove</button>
                    <button type="button" @click="play_point(index)">{{btnPlay}}</button>
                  </div>
                </div>
                <button type="button" @click="add_point">add a key point</button>
                <button type="button" @click="from_file">import from file</button>
                <input hidden type="file" id="uploader-srt" @change="src_change"/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style="float: left;width: 360px;padding: 8px;margin-left: -100%">
        <div style="width: 100%;height:300px;position: relative">
          <div v-if="fileUrl">
            <video crossorigin="anonymous" preload="auto" style="width:100%" :src="fileUrl" id="videoNode"></video>
            <div>
              <table style="font-size: 10px;text-align: left">
                <tr>
                  <td style="width: 50%">name</td>
                  <td>{{qVideo.title}}</td>
                </tr>
                <template v-if="videoLoaded">
                  <tr>
                    <td>width</td>
                    <td>{{videoNode.videoWidth}}</td>
                  </tr>
                  <tr>
                    <td>height</td>
                    <td>{{videoNode.videoHeight}}</td>
                  </tr>
                  <tr>
                    <td>size</td>
                    <td>{{size}}</td>
                  </tr>
                  <tr>
                    <td>duration</td>
                    <td>{{sec2time(videoNode.duration)}}s</td>
                  </tr>
                </template>
              </table>
            </div>
            <div style="height: 1px;background-color: #ccc;margin: 8px 0"></div>
            <div>
              <div style="text-align: left;">
                <input style="width: 300px" v-model="qVideo.title" placeholder="video title"/>
              </div>
              <div style="text-align: left;">
                <input style="width: 300px" v-model="qVideo.category" placeholder="category"/>
              </div>
              <div style="text-align: left;">
                <input style="width: 300px;" v-model="qVideo.tag" placeholder="tag"/>
              </div>

              <button type="button"
                      @click="setCover">set current frame as cover</button>
              <img :src="qVideo.coverUrl" style="width: 300px;object-fit: cover"/>
            </div>
            <div style="height: 1px;background-color: #ccc;margin: 8px 0"></div>
            <div>
              <button type="button" @click="send_points">create</button>
            </div>
          </div>
          <div v-else>
            NO VIDEO SELECTED
          </div>
        </div>
      </div>
      <div style="clear: both"></div>
    </div>

  </div>
</template>

<script>
import vueSlider from './vue2-slider'
import axios from 'axios'

export default {
  components: {
    vueSlider
  },
  name: 'App',
  data: function () {
    return {
      qVideo: {
      },
      points: [],
      qurl: 'http://p1pr3la28.bkt.clouddn.com/test.mp4',
      mode: 0,
      buffered: 0.0,
      fileUrl: '',
      //
      videoNode: null,//html video node
      videoLoaded: false,
      currentTime: 0.0,
      //loop for watching one step
      loop_start: 0,
      loop_end: 0,
      isPlaying: false,
      fullHeight: 0,
      slider_setting: {
        interval: 1,
        tooltipStyle: {
          'backgroundColor': '#666',
          'borderColor': '#666',
          'font-size': "10px"
        },
        processStyle: {
          'backgroundColor': '#999'
        },
        formatter: function (value) {
          var minutes = Math.floor(value / 60);
          var seconds = value - minutes * 60;
          var hours = Math.floor(value / 3600);
          seconds = seconds.toFixed(2)
          if (hours < 10) {
            hours = '0' + hours
          }
          if (minutes < 10) {
            minutes = '0' + minutes
          }
          if (seconds < 10) {
            seconds = '0' + seconds
          }
          return hours + ':' + minutes + ':' + seconds
        }
      },
      canvas: undefined
    }
  },
  created: function () {
    //request data here
    console.log("created")
    console.log(this.$route.params.id)
    var self = this
    this.autoLogin(function () {
      self.getDraft(self.$route.params.id)
    })

  },
  updated: function () {
    if (this.videoNode !== undefined && this.videoNode === null) {
      this.videoNode = document.querySelector('video')
      if (this.videoNode !== null) {
        console.log('video node init')
        this.videoNode.addEventListener('durationchange', this.videoNodeDurationChange)
        this.videoNode.addEventListener('loadedmetadata', this.videoNodeLoadedMetaData)
        this.videoNode.addEventListener('timeupdate', this.videoTimeUpdated)
      } else {
        // console.log('video node is null')
      }
    }
  },
  methods: {
    send_points: function() {
      var points = []
      for(var i=0;i<this.points.length;i++){
        var p = this.points[i]
        console.log(p)
        points.push({
          description: p.description,
          start: p.range[0]*1000,
          end: p.range[1]*1000
        })
      }
      points.sort(function(a, b){
        return a.start - b.start
      })

      var d = {
        id: this.qVideo.id,
        pointData: JSON.stringify(points)
      }
      var self = this
      var token = localStorage.getItem("token")
      console.log("reqeust token = "+token)
      let config = {
        headers: {
          "x-kmvc-user-token": token
        }
      }
      axios.post('http://localhost:8080/admin/v1/tutorial/draft/updatePoint',
        d,
        config
      ).then(function (response) {
        console.log(response);
        if(response.status === 200){
          var d = response.data;
          if(d.ok === 0){
            console.log(d.obj)
          }
        }
      }).catch(function (error){
        console.log(error)
      })
      console.log()
    },
    getDraft: function(id){
      //http://localhost:8080/admin/v1/tutorial/ticket/list
      var self = this
      var token = localStorage.getItem("token")
      console.log("reqeust token = "+token)
      let config = {
        headers: {
          "x-kmvc-user-token": token
        }
      }
      axios.post('http://localhost:8080/admin/v1/tutorial/draft/get',
        {id:id},
        config
      ).then(function (response) {
        console.log(response);
        if(response.status === 200){
          var d = response.data;
          if(d.ok === 0){
            console.log(d.obj)
            self.qVideo = d.obj
            if(d.obj.pointData){
              var ps = JSON.parse(d.obj.pointData)
              var pointD = []
              for(var i=0;i<ps.length;i++){
                pointD.push({
                  description: ps[i].description,
                  range:[ (ps[i].start / 1000).toFixed(2), (ps[i].end/1000).toFixed(2)]
                })
              }
            }
            self.mode = 1
            self.points = pointD
            self.fileUrl = "http://paz3rk3if.bkt.clouddn.com/"+self.qVideo.videoKey
          }
        }
      }).catch(function (error){
        console.log(error)
      })
    },
    autoLogin: function(callback) {
      var token = localStorage.getItem("token")
      console.log(token)
      if(token === undefined || token === null || token === "") {
        console.log("has already login")
        callback()
        return
      }
      axios.post('http://localhost:8080/admin/v1/self/login',
        {email: "zhangyh@eggvi.com", password: "Pgmq3p"}
      ).then(function (response) {
        console.log(response);
        if(response.status === 200){
          var d = response.data;
          if(d.ok === 0){
            var user = d.obj;
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('token', user.token)
            console.log('login ok')
            callback()
          }
        }
      }).catch(function (error){
        console.log(error)
      })
    },
    from_file: function () {
      document.getElementById("uploader-srt").click()
    },
    src_change: function (e) {
       // console.log(event.target.files)
       var self = this
      if (event.target.files.length > 0) {
        var f = event.target.files[0]
        console.log(f)
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
          return function(e) {
            console.log(e.target.result) //here is the script
          };
        })(f);

        reader.readAsText(f);
      }
    },
    setCover: function () {
      var canvas = document.createElement('canvas')
      canvas.height = this.videoNode.videoHeight
      canvas.width = this.videoNode.videoWidth
      var ctx = canvas.getContext('2d')
      ctx.drawImage(this.videoNode, 0, 0, canvas.width, canvas.height)
      var img = new Image()
      this.qVideo.coverUrl = canvas.toDataURL()
      this.$forceUpdate()
    },
    sec2time: function (value) {
      var minutes = Math.floor(value / 60);
      var seconds = value - minutes * 60;
      var hours = Math.floor(value / 3600);
      seconds = seconds.toFixed(2)
      if (hours < 10) {
        hours = '0' + hours
      }
      if (minutes < 10) {
        minutes = '0' + minutes
      }
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      return hours + ':' + minutes + ':' + seconds
    },
    add_point: function () {
      var d = this.qVideo.videoDuration / 5 || 60;
      var point = {
        description: '',
        range: [0, d]
      }

      if (this.points.length > 0) {
        var start = this.points[this.points.length - 1].range[1]
        point = {
          description: '',
          range: [start, start + d]
        }
      }
      this.points.push(point)
    },
    play_point: function (index) {
      var p = this.points[index]
      this.loop_start = p.range[0]
      this.loop_end = p.range[1]
      this.videoNode.currentTime = this.loop_start
      this.playVideo()
    },
    play2: function (d) {
      if (d > 0){
        this.videoNode.playbackRate = this.videoNode.playbackRate * 2
      } else {
        this.videoNode.playbackRate = this.videoNode.playbackRate / 2
      }
    },
    get_video_buffer: function () {
      var self = this
      if(!self.canvas){
        self.canvas = document.getElementById("buffered_canvas")
        if(!self.canvas){
            setTimeout(self.get_video_buffer, 1000)
            return
          }
      }
      var canvas = self.canvas
      var ctx = canvas.getContext('2d');
      var vid = this.videoNode
      var b = vid.buffered,
          i = b.length,
          w = canvas.width,
          h = canvas.height,
          vl = vid.duration,
          x1, x2;

      ctx.fillStyle = '#999';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d00';
      var f = false
      while (i--) {
        if (b.end(i) >= vl && i === 1){
          f = true
        }
          x1 = b.start(i) / vl * w;
          x2 = b.end(i) / vl * w;
          ctx.fillRect(x1, 0, x2 - x1, h);
      }
      ctx.fillStyle = '#fff';

      if(f){
        console.log("buffered finished")
        return
      }
      setTimeout(self.get_video_buffer, 1000)
    },
    videoTimeUpdated: function () {

      // this.buffered = this.videoNode.buffered.end(0);
      this.currentTime = this.videoNode.currentTime.toFixed(2)
      if (this.loop_end > 0) {
        if (this.loop_end <= this.currentTime) {
          console.log('videoTimeUpdated')
          console.log(this.currentTime)
          this.pauseVideo()
          var self = this
          // this.videoNode.currentTime = this.loop_start
          setTimeout(function () {
            self.videoNode.currentTime = self.loop_start
          }, 1000)
          setTimeout(function () {
            self.playVideo()
          }, 2000)
        }
      }
    },
    pauseVideo: function () {
      clearTimeout( );
      this.videoNode.pause()
    },
    remove_point: function (index) {
      this.points.splice(index, 1)
    },
    seek_callback: function (n) {
      // console.log('callback')
      // console.log(n)
    },
    currentChangeValue: function (val) {
      this.videoNode.currentTime = val
    },
    seek_range_callback: function (event) {
      // console.log('seek range callback')
      // console.log(event)
    },
    seek_range_end: function (event) {
      // console.log('seek_range_end')
      // var start = event.currentValue[0]
      // var end = event.currentValue[1]
      // console.log(start)
      // console.log(end)
    },
    seek_end: function (event) {
      this.videoNode.currentTime = event.currentValue
      this.playVideo()
    },
    seek_start: function (event) {
    },
    playVideo: function () {
      if (this.isPlaying) {
        // this.videoNode.playbackRate = 1
        this.pauseVideo()
        this.isPlaying = false
      } else {
        this.videoNode.play()
        this.isPlaying = true
      }
    },
    videoNodeLoadedMetaData: function () {
      console.log("on video loaded")
      this.videoLoaded = true
      this.get_video_buffer()
      console.log('loaded meta data')
    },
    videoNodeDurationChange: function () {
      console.log('duration chagned')
    },
    set_by_qiniu: function () {
        this.fileUrl = this.qurl
        this.mode = 1
    },
    handleResize: function (event) {
      var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      this.fullHeight = height
      var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
      this.sliderWidth = width - 400 - 64 - 16 -16
    }
  },
  computed: {
    size: function () {
      let s = this.qVideo.videoSize
      if (s < 1024) {
        return s + 'bytes'
      } else if (s < 1024 * 1024) {
        return (s / 1024.0).toFixed(2) + 'KB'
      } else {
        return (s / (1024 * 1024.0)).toFixed(2) + 'MB'
      }
    },
    btnPlay: function () {
      return this.isPlaying ? 'pause' : 'play'
    }
  },
  // bind event handlers to the `handleResize` method (defined below)
  mounted: function () {
    console.log('ready')
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style>
html, body{
  padding: 0;
  margin: 0;
  background-color: #f0f0f0;
  width: 100%;
  height: 100%;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.seek{
  width:10px;
  height: 10px;
  border-radius: 20px;
  background-color: lightgreen;
}
.ta {
  border: 1px solid #f0f0f0;
  padding: 8px;
  width: 60%;
  outline: none;
}
input{
  padding: 6px;
  outline: none;
  margin: 0;
}
button{
  background-color: #f0f0f0;
  padding: 8px;
  outline: none;
  margin: 8px;
  border: 1px solid #ccc;
}
button:active{
  box-shadow: none;
  border: 1px solid #909090;
}
.ytable td{
  border-bottom:1px solid #ccc;
  padding:8px 3px;
}
</style>
