
class StackedBarChart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _province) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth, //|| 900,
      containerHeight: _config.containerHeight, //|| 400,
      margin: {top: 150, right: 10, bottom: 50, left: 50},
      tooltipPadding: 15,
      legendWidth: 200,
      legendHeight: 10,
      legendSquareSize: 10,
    }
    this.province = _province;
    this.data = _data

    // Specify which sources we want to show
    this.sources = [...new Set(this.data.map(d => d.Source))];

    // need to hardcode the years here because otherwise domain changes when we don't have data for some provinces
    this.allYears = [];
    for (let i = 1990; i <= 2018; i++) {
      this.allYears.push(i);
    }
    this.initVis();
  }

  /**
   * Initialize scales/axes and append static chart elements
   */blue
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Intialize the scales
    vis.xScale = d3.scaleBand()
        .domain(vis.allYears)
        .range([0, vis.width])
        .paddingInner(0.2)
        .paddingOuter(0.2);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10); // scheme paired implied relationship between unrelated economic sectors (sources)

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale).ticks(6);

    // Define SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Add group for legend
    vis.legend = vis.svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(50, 50)`);

    // Add group for title
    vis.title = vis.svg.append('g')
        .attr('transform', `translate(${vis.width/2}, 25)`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    vis.chart.append('text')
        .attr('class', 'axis-label')
        .attr('transform', `translate(${vis.width/2}, ${vis.height + 40})`)
        .style('text-anchor', 'middle')
        .text('Year');

    vis.chart.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0 - vis.height/2)
        .attr('y', - 70)
        .style('text-anchor', 'middle')
        .attr('dy', '1em')
        .text('GHG emissions in tonnes of CO2 equivalent');

    vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Specify accessor functions
    vis.xValue = d => d.data.year;
    vis.yValue = d => d[1];

    // roll up the data to get nested map of year, source and sum of CO2eq for each source
    vis.rolledUpData = d3.rollup(vis.data, v => d3.sum(v, d => d.CO2eq), d => d.Year, d => d.Source);

    // create a flattened array of the nested object so we can feed it to the stack generator
    vis.flattenedData = []
    vis.rolledUpData.forEach((sources, year) => {
      let obj = {};
      obj.year = year;
      sources.forEach((amnt, source) => {
        obj[`${source}`] = amnt;
      });
      vis.flattenedData.push(obj);
    });

    // add dummy values for all the years where we don't have data for that province (only relevant for Nunavut and Northwest Territories)
    let yearsOfRolledUpData = [ ...vis.rolledUpData.keys()];
    let difference = vis.allYears.filter(e => !yearsOfRolledUpData.includes(e));

    for (let j = 0; j < difference.length; j++) {
      let obj = {};
      obj.year = difference[j];
      for (let k = 0; k < vis.sources.length; k++) {
        obj[`${vis.sources[k]}`] = 0;
      }
      vis.flattenedData.push(obj);
    }

    console.log("years of rolledUpData", yearsOfRolledUpData);
    console.log("difference", difference);
    console.log("flattened data", vis.flattenedData);

    // Initialize stack generator with the sources
    vis.stackGen = d3.stack().keys(vis.sources);

    // Call stack generator on the dataset
    vis.stackedData = vis.stackGen(vis.flattenedData);

    console.log('vis.stackedData', vis.stackedData);
    console.log("rolled up by year and source", vis.rolledUpData);
    console.log("stacked data", vis.stackedData);
    console.log("keys of rolled up data", [ ...vis.rolledUpData.keys()]);
    console.log("sources", vis.sources);
    console.log('vis.stackedData.length', vis.stackedData.length);
    console.log('stackedData', vis.stackedData);

    // because the data is stacked we know highest val is in last element of stacked data
    let maxYValue = d3.max(vis.stackedData[vis.stackedData.length - 1], d => {
      return d3.max(d);
    })

    // set the dynamic domains
    vis.yScale.domain([0, maxYValue]);
    vis.colorScale.domain(vis.sources);

    // Render the bar chart, the legend and the title
    vis.renderVis();
    vis.renderLegend();
    vis.renderTitle();

  }


  /**
   * This function contains the D3 code for binding data to visual elements
   */
  renderVis() {
    let vis = this;

    vis.chart.selectAll('.category')
        .data(vis.stackedData)
        .join('g')
        .attr('class', d => `category cat-${d.key}`)
        .style('fill', d => vis.colorScale(d.key))
        .selectAll('rect')
        .data(d => d)
        .join('rect')
        .attr('class', d => 'year' + d.data.year)
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('height', d => {
          let y1 = !d[1] ? 0 : d[1];
          return vis.yScale(d[0]) - vis.yScale(y1);
        })
        .attr('width', vis.xScale.bandwidth())
        // Define mouseover tooltip
        .on('mouseover', (event,d) => {
          d3.select('#tooltip')
              .style('display', 'block')
              // Format number with text and newline and numerical cost
              .html(`<div id="tooltip-label" class="tooltip-label">
                        Jurisdiction: ${(vis.province)+ "\r\n"}<br>
                        Year: ${(d.data.year) + "\r\n"}<br><br>
                        Emissions:
                        </div>`);
          let label = document.getElementById("tooltip-label");
          // for (let ent in Object.entries(d.data)) {
          //   ent = Object.keys(ent);
          //   console.log(ent);
          //   let key = ent[0];
          //   let value = ent[1];
          //   console.log(key);
          Object.entries(d.data).forEach(([key, value]) => {
            if (key != 'year') {
              label.innerHTML += `<div class="tooltip-label-normal">${key + ": " + Math.round(value)+ ' million tn CO2eq' + "\r\n"}</div>`
            }
          });
        })
        // Define behaviour of tooltip as the mouse moves around
        .on('mousemove', (event) => {
          d3.select('#tooltip')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
              .style('top', (event.pageY - vis.config.tooltipPadding) + 'px')
        })
        // Define "disappearance" of tool tip after mouse moves away from semi-circle
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });

    // Update the axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }

  // Renders the legend
  renderLegend() {
    let vis = this;
    // let cols = 3;
    // let rows = 4;
    // let boxOffset = 5;
    // let baseOffset = 0;
    // let heightInterval = vis.config.legendHeight/rows;
    // let widthInterval = (vis.config.legendWidth/cols);
    // // TODO: Unkown why this is broken
    // vis.legend.selectAll('rect')
    //     .data(vis.colorScale.domain())
    //     .join('rect')
    //     .attr('x', (d, i) => {
    //       // if (i > 4) baseOffset = 25;
    //       return ((i%cols) * widthInterval + baseOffset)})
    //     .attr('y', (d, i) => ((i%rows) * heightInterval))
    //     .attr('width', vis.config.legendSquareSize)
    //     .attr('height', vis.config.legendSquareSize)
    //     .style('fill', d => vis.colorScale(d));
    //
    // vis.legend.selectAll('text')
    //     .data(vis.colorScale.domain())
    //     .join('text')
    //     .attr('class', 'legendText')
    //     .attr('x', (d, i) => {
    //       // if (i > 4) baseOffset = 25;
    //       return ((i%cols) * widthInterval) + vis.config.legendSquareSize + boxOffset + baseOffset})
    //     .attr('y', (d, i) => ((i%rows) * heightInterval) + vis.config.legendSquareSize)
    //     .text(d => d)
    //     .attr('text-anchor', 'left');
    vis.legend.selectAll('rect')
        .data(vis.colorScale.domain())
        .join('rect')
        .attr('x', (d, i) => (i % 2) * (vis.config.legendWidth))
        .attr('y', (d, i) => i % 2 === 0? i * vis.config.legendHeight : (i-1) * vis.config.legendHeight)
        .attr('width', vis.config.legendSquareSize)
        .attr('height', vis.config.legendSquareSize)
        .style('fill', d => vis.colorScale(d));

    vis.legend.selectAll('text')
        .data(vis.colorScale.domain())
        .join('text')
        .attr('class', 'legendText')
        .attr('x', (d, i) => (i % 2) * (vis.config.legendWidth) + vis.config.legendSquareSize + 5)
        .attr('y', (d, i) =>  i % 2 === 0 ? i * vis.config.legendHeight + vis.config.legendSquareSize : (i-1) * vis.config.legendHeight + vis.config.legendSquareSize)
        .text(d => d)
        .attr('text-anchor', 'left');
  }

  // Renders the title (not in index.html because title changes dynamically)
  renderTitle() {
    let vis = this;

    vis.title.selectAll('text')
        .data(vis.province)
        .join('text')
        .attr('class', 'stackedBarChart histSubVisTitle')
        .attr('text-anchor', 'middle')
        .text(d => `Sources of emissions in ${d} (1990-2018)`);
  }

  // Updates the viz based on the year user scrolls to
  goToStep(stepIndex) {
    let vis = this;

    let baseYear = 1990;
    if(stepIndex == 0){
      // Reset year, overall case
      vis.chart.selectAll('rect')
          .transition()
          .style('opacity', 1);
    } else {
      let className = `.year${baseYear + stepIndex-1}`;

      // set opactity of all bars to 0.2
      vis.chart.selectAll('rect')
          .transition()
          .style('opacity', 0.6);

      // set opacity of the bar we're looking at to 1
      vis.chart.selectAll(className)
          .transition()
          //.attr("stroke", "black")
          .style('opacity', 1);
    }
  }

}