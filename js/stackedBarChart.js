class StackedBarChart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 400,
      margin: {top: 10, right: 10, bottom: 30, left: 30},
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * Initialize scales/axes and append static chart elements
   */
  initVis() {
    let vis = this;

    // Set width and height of visualization
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Intialize the scales
    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .paddingInner(0.2)
        .paddingOuter(0.2);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

    
    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale).ticks(6);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');
    
    vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Specify accessor functions
    vis.xValue = d => d[1].Year;
    vis.yValue = d => d[1].CO2eq;


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

    // Initialize stack generator and specify the categories or layers
    // that we want to show in the chart
    let sources = [...new Set(vis.data.map(d => d.Source))];
    vis.stackGen = d3.stack()
          .keys(sources);

    // Call stack generator on the dataset
    vis.stackedData = vis.stackGen(vis.flattenedData);

    console.log("rolled up by year and source");
    console.log(vis.rolledUpData);

    console.log("stacked data");
    console.log(vis.stackedData);

    console.log("keys of rolled up data");
    console.log([ ...vis.rolledUpData.keys()]);

    console.log("sources");
    console.log(sources);

    // set domain of scales
    vis.xScale.domain([ ...vis.rolledUpData.keys()]);

    vis.yScale.domain(0, () => {
      // because the data is stacked we know highest val is in last element of stacked data
      d3.max(vis.stackedData[vis.stackedData.length - 1], d => {
        return d3.max(d);
      })   
    });

    vis.colorScale
    .domain(sources);


    vis.renderVis();
  }

  /**
   * This function contains the D3 code for binding data to visual elements
   * Important: the chart is not interactive yet and renderVis() is intended
   * to be called only once; otherwise new paths would be added on top
   */
  renderVis() {
    let vis = this;

    vis.chart.selectAll('category')
        .data(vis.stackedData)
      .join('g')
        .attr('class', d => {
          console.log("d.key is " + d.key);
          return `category cat-${d.key}`
        })
      .selectAll('rect')
        .data(d => d)
      .join('rect')
        .attr('x', d => vis.xScale(d.data.year))
        .attr('y', d => vis.yScale(d[1]))
        .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        .attr('width', vis.xScale.bandwidth());

    // Update the axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}