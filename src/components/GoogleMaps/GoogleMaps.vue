<template>
    <h1>Google Maps</h1>
    <p>
      Google Maps, vector map. Use shift-drag to adjust tilt.
    </p>

  <div class="map-wrapper">
    <div id="map"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Loader } from "@googlemaps/js-api-loader";
import { onMounted } from 'vue'

export default defineComponent({
  name: "GoogleMaps",
  components: { },
  setup: () => {
     
    const loader = new Loader({
      apiKey: "AIzaSyBwoamHCxIZra4xaO1KyYtoXyZ587UNnio", 
      version: "beta",
      libraries: []
    });

    const mapOptions = {
      center: {
        lat: 53.7419315,
        lng: -0.3353508
      },
      zoom: 17,
      isFractionalZoomEnabled: true,
      tilt: 80,
      heading: 100,
      mapId: 'f0bb5282fe871931'
    };

    onMounted(() => {
      loader
        .load()
        .then((google) => {
          new google.maps.Map(document.getElementById("map"), mapOptions);
        })
        .catch(console.error);
    })

    return {
    }
    
  },
   
});
</script>

<style scoped>
.map-wrapper{ 
  position: relative;
  width:100%;
  height:500px;
  padding: 1em 1em;
}

#map{
  position: relative;
  width:100%;
  height:100%;
  box-shadow: 0px 0px 1em rgba(0, 0, 0, 0.5);
}
</style>
