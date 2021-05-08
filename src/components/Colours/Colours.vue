<template>
  <section fluid class="colours">
    <h1>Colours</h1>
    <p>
      Here is a a bubble chart showing all the HTML Colour names. It was created
      just as an experiment using <a href="https://d3js.org/">d3.js</a> for
      rendering.
    </p>
    <label
      >Charge
      <input
        v-model="charge"
        type="number"
        required
        @change="updateSimulation"
      />
    </label>
    {{ " " }}
    <button type="button" @click="save">Save</button>
    {{ " " }}
    <button type="button" @click="reset">Reset</button>
    <div id="bubble-chart" />
  </section>
</template>
<script>
import * as d3 from "d3";
import namedColors from "./namedColors";
import { ref } from "vue";

export default {
  name: "Colours",
  setup() {
    const data = [];
    return {
      windowWidth: 0,
      offset: ref({
        x: 0,
        y: 0,
      }),
      width: 600,
      height: 400,
      charge: ref(-20),
      minSize: 10,
      maxSize: 30,
      data: [],
    };
  },
  watch: {
    windowWidth(_newWidth, _oldWidth) {
      this.updateNodes();
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener("resize", () => {
        this.windowWidth = window.innerWidth;
      });
    });
    this.load();
  },
  beforeUnmount() {
    d3.select("#bubble-chart > *").remove();
  },
  methods: {
    load() {
      this.data = JSON.parse(JSON.stringify(namedColors));
      const loadedData = localStorage.getItem("bubbles");
      if (loadedData) {
        var parsed = JSON.parse(loadedData);
        this.data = parsed.data;
        this.charge = parsed.charge;
      }
      this.initBubbleChart();
    },
    save() {
      localStorage.setItem(
        "bubbles",
        JSON.stringify({
          data: this.data,
          charge: this.charge,
        })
      );
    },
    reset() {
      localStorage.removeItem("bubbles");
      this.charge = -20;
      this.svg.node().remove();
      this.$nextTick(() => {
        this.load();
      });
    },
    updateSimulation() {
      const scaleRadius = d3
        .scaleLinear()
        .domain([
          d3.min(this.data, (d) => d.count),
          d3.max(this.data, (d) => d.count),
        ])
        .range([this.minSize, this.maxSize]);

      if (this.simulation) {
        this.simulation.nodes(this.data);
        this.simulation.alpha(1).restart();
      } else {
        this.simulation = d3.forceSimulation(this.data);
      }

      this.simulation
        .force("charge", d3.forceManyBody().strength(this.charge))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force(
          "collide",
          d3
            .forceCollide((d) => (scaleRadius(d.count) || 10) + 1)
            .iterations(24)
        )

        .on("tick", (_event) => {
          this.node
            .attr("r", (d) => scaleRadius(d.count) || 10)
            .attr("cx", (d) => d.x + this.offset.x)
            .attr("cy", (d) => d.y + this.offset.y);
        });
    },
    initBubbleChart() {
      d3.select("#bubble-chart > *").remove();

      const chart = d3.select("#bubble-chart");
      this.tooltip = chart
        .append("div")
        .attr("class", "colours-dyanmic-tooltip")
        .text("");

      this.colorCircles = d3.scaleOrdinal(d3.schemeCategory10);

      this.svg = chart
        .append("svg")
        .attr("width", "100%")
        .attr("height", "500");

      this.node = this.svg.selectAll("circle");

      this.updateNodes();
    },
    updateNodes() {
      this.node = this.node.data(this.data, (d) => d.name || d.title);
      this.node.exit().remove();

      const bounds = this.svg.node().getBoundingClientRect();
      this.offset["x"] = bounds.width / 2;
      this.offset["y"] = bounds.height / 2;
      this.node = this.node
        .enter()
        .append("circle")
        .style("fill", (d) => d.color || this.colorCircles(d.category))
        .on("mouseover", (_event, d) => {
          if (d.dragging) return;
          this.tooltip
            .html(() => d.name)
            .style("opacity", 0.9)
            .style("z-index", 100);
        })
        .on("mousemove", (event) =>
          this.tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px")
        )
        .on("mouseout", () =>
          this.tooltip.style("opacity", 0).style("z-index", -1)
        )
        .call(
          d3
            .drag()
            .on("start", (event, d) => {
              d.dragging = true;
              this.tooltip.style("opacity", 0).style("z-index", -1);

              if (!event.active) this.simulation.alpha(1).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              if (!event.active) this.simulation.alpha(1).restart();
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (_event, d) => {
              d.dragging = false;
              d.fx = null;
              d.fy = null;
            })
        )
        .merge(this.node);
      this.updateSimulation();
    },
  },
};
</script>

<style>
.colours-dyanmic-tooltip {
  position: absolute;
  color: white;
  padding: 0.3em;
  background-color: #999;
  border-radius: 0.5em;
  transition: opacity 0.4s;
  top: -9999;
  left: 0;
  opacity: 0;
  z-index: -1;
}
</style>