<template>
  <div id="app">
    <div v-if="mode == 0">
      <input type="file" id="uploader-input" accept="video/mp4,video/*,image/*"
             @change="file_change">
    </div>
    <div v-else>
        <h2>Key Points Create</h2>
        <div style="width:30%;float: left;">
          <div style="width: 100%;height:300px;position: relative">
            <div v-if="fileUrl">
              <video style="width:100%" :src="fileUrl" id="videoNode"></video>
              <div>
                <div>{{video.name}}</div>
                <div>{{size}}</div>
              </div>
            </div>
            <div v-else>
              NO VIDEO SELECTED
            </div>
          </div>
          <div>
            <button type="button" @click="create">create</button>
          </div>
        </div>
        <div style="position:relative;width:70%;float: left; ">
          <div v-if="videoLoaded">
            <div>{{sec2time(currentTime)}} / {{sec2time(videoNode.duration)}}s</div>
            <div>SPEED {{videoNode.playbackRate}}</div>
            <button type="button" @click="play2(-1)">/ 2</button>
            <button type="button" @click="playVideo">{{btnPlay}}</button>
            <button type="button" @click="play2(1)">x 2</button>
            <div style="padding:16px">
              <vue-slider :clickable="false" @callback="seek_callback" @drag-end="seek_end" @drag-start="seek_start" ref="slider"
               v-model="currentTime" :max="videoNode.duration"
               v-bind="slider_setting"></vue-slider>
            </div>
            <!--<div style="position:relative;width:600px;height:10px;background-color: aliceblue;margin-left: 10px">-->
              <!--<div class="seek" :style="currentProgress"></div>-->
            <!--</div>-->
            <div>
              <div v-for="(point, index) in points" v-bind:key="index" style="border:1px dashed #F0F0F0;padding:16px;margin: 12px 0">
                <div>#{{index+1}}</div>

                <vue-slider :clickable="false"
                            @currentChangeValue="currentChangeValue"
                            @drag-end="seek_range_end"
                            @callback="seek_range_callback"
                            ref="slider" :interval="0.01"
                            v-model="point.range" :max="videoNode.duration"
                            v-bind="slider_setting"></vue-slider>
                <div style="text-align: left">
                  <textarea placeholder="add description here" v-model="point.description" rows="3" class="ta"></textarea>
                  <button type="button" @click="remove_point(index)">remove</button>
                  <button type="button" @click="play_point(index)">{{btnPlay}}</button>
                </div>

              </div>
              <button type="button" @click="add_point">add a key point</button>
            </div>
          </div>
        </div>
        <div style="clear: both"></div>
    </div>

  </div>
</template>

<script>
import vueSlider from './components/vue2-slider'
// var fs = require('fs')

export default {
  components: {
    vueSlider
  },
  name: 'App',
  data: function () {
    return {
      mode: 0,
      video: null,
      fileUrl: '',
      videoNode: null,
      videoLoaded: false,
      currentTime: 0.0,
      videoDuration: 0.0,
      points: [],
      loop_start: 0,
      loop_end: 0,
      isPlaying: false,
      slider_setting: {
        interval: 1,
        tooltipStyle: {
          "backgroundColor": "#666",
          "borderColor": "#666"
        },
        processStyle: {
          "backgroundColor": "#999"
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
      }
    }
  },
  created: function () {

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
        console.log('video node is null')
      }
    }
  },
  methods: {
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
    create: function() {
      var json = JSON.stringify(this.$data)
      console.log(json)
    },
    add_point: function () {
      var point = {
        description: '',
        range: [0, 1]
      }
      if (this.points.length > 0) {
        var start = this.points[this.points.length - 1].range[1]
        point = {
          description: '',
          range: [start, start + 1]
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
    videoTimeUpdated: function () {
      // console.log(this.videoNode.buffered.end(0))
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
      console.log('end')
      console.log(event.currentValue)
      this.videoNode.currentTime = event.currentValue
      this.playVideo()
    },
    seek_start: function (event) {
      // console.log('start')
      // console.log(event.currentValue)
    },
    playVideo: function () {
      if (this.isPlaying) {
        this.videoNode.playbackRate = 1
        this.pauseVideo()
        this.isPlaying = false
      } else {
        this.videoNode.play()
        this.isPlaying = true
      }

    },
    videoNodeLoadedMetaData: function () {
      this.videoLoaded = true
      console.log('loaded meta data')
    },
    videoNodeDurationChange: function () {
      console.log('duration chagned')
    },
    file_change: function (event) {
      console.log(event.target.files)
      if (event.target.files.length > 0) {
        this.video = event.target.files[0]
        // console.log(video.name)
        // console.log(video.size)
        // console.log(video.type)
        var testUrl = 'https://r5---sn-nx57ynls.googlevideo.com/videoplayback?mime=video%2Fmp4&itag=22&sparams=dur%2Cei%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpl%2Cratebypass%2Crequiressl%2Csource%2Cexpire&signature=9C75983B6D4C249904320FD21F1A92614AA95B66.6CEC8923BB82EC10DBB37339A8C11B37BF587963&mt=1529996261&lmt=1527480889563522&ratebypass=yes&source=youtube&ip=108.160.138.170&dur=831.715&requiressl=yes&ms=au%2Conr&ei=WuQxW-yuKJKV4AKhnYL4CA&mv=m&pl=25&ipbits=0&initcwndbps=398750&fexp=23709359&id=o-AMRTzeqc6expOWSQojLQGkpY2FEmQ9y5ii6c0Lg_HkgD&mn=sn-nx57ynls%2Csn-a5mekney&key=yt6&mm=31%2C26&fvip=5&expire=1530017978&c=WEB&title=EXTREMELY%20GRAPHIC-%20Live%20Maine%20Lobster%20For%20Sashimi%20Part%201%20-%20How%20To%20Make%20Sushi%20Series'
        this.fileUrl = URL.createObjectURL(this.video)
        this.mode = 1
      }
    }
  },
  computed: {
    size: function () {
      let s = this.video.size
      if (s < 1024) {
        return s + 'bytes'
      } else if (s < 1024 * 1024) {
        return (s / 1024.0).toFixed(2) + 'KB'
      } else {
        return (s / (1024 * 1024.0)).toFixed(2) + 'MB'
      }
    },
    currentProgress: function () {
      var width = 600 * this.currentTime / this.videoNode.duration
      return 'margin-left:' + width + 'px'
    },
    btnPlay: function () {
      return this.isPlaying ? "pause" : "play"
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
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
  width: 400px;
  outline: none;
}
</style>
