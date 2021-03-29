class StackedBarChart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _province) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 600,
      margin: {top: 250, right: 10, bottom: 50, left: 100},
      legendWidth: 200,
      legendHeight: 10,
      legendSquareSize: 15,
      steps: ['step0', 'step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10', 
      'step11', 'step12', 'step13', 'step14', 'step15', 'step16', 'step17', 'step18', 'step19', 'step20', 'step21', 'step22', 
      'step23', 'step24', 'step25', 'step26', 'step27', 'step28']
    }
    this.province = _province;
    this.data = _data;
    this.initVis();
  }
  
  /**
   * Initialize scales/axes and append static chart elements
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
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
        .range(d3.schemePaired);

    
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

    // Add group for legend
    vis.legend = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left}, 100)`);

    // Add group for title
    vis.title = vis.svg.append('g')
        .attr('transform', `translate(${vis.width/2}, 50)`);

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
        .text('Tonnes of CO2 equivalent');
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

    // Initialize stack generator and specify the categories or layers
    // that we want to show in the chart
    vis.sources = [...new Set(vis.data.map(d => d.Source))];
    vis.stackGen = d3.stack()
          .keys(vis.sources);

    // Call stack generator on the dataset
    vis.stackedData = vis.stackGen(vis.flattenedData);

    console.log("rolled up by year and source");
    console.log(vis.rolledUpData);

    console.log("stacked data");
    console.log(vis.stackedData);

    console.log("keys of rolled up data");
    console.log([ ...vis.rolledUpData.keys()]);

    console.log("sources");
    console.log(vis.sources);

    // because the data is stacked we know highest val is in last element of stacked data
    let maxYValue = d3.max(vis.stackedData[vis.stackedData.length - 1], d => {
        return d3.max(d);
    })

    // set domain of scales
    vis.xScale.domain([ ...vis.rolledUpData.keys()]);

    vis.yScale.domain([0, maxYValue]);

    vis.colorScale.domain(vis.sources);

    // Render the bar chart, the legend and the title
    vis.renderVis();
    vis.renderLegend();
    vis.renderTitle();

    // Call first step
    vis.step0();
  }

 

  /**
   * This function contains the D3 code for binding data to visual elements
   */
  renderVis() {
    let vis = this;

    vis.chart.selectAll('category')
        .data(vis.stackedData)
      .join('g')
        .attr('class', d => `category cat-${d.key}`)
        .style('fill', d => vis.colorScale(d.key))
      .selectAll('rect')
        .data(d => d)
      .join('rect')
        .attr('class', d => "year" + d.data.year)
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('height', d => {
          // TODO: need to deal with cases where d[1] is null
          if (!d[0]) {
            console.log("!d[0]");
          }
          if (!d[1]) {
            console.log("!d[1]");
          }
          return vis.yScale(d[0]) - vis.yScale(d[1])
        })
        .attr('width', vis.xScale.bandwidth());

    // Update the axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }

  // Renders the legend
  renderLegend() {
    let vis = this;

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
          .attr('y', (d, i) =>  i % 2 === 0 ? i * vis.config.legendHeight + vis.config.legendSquareSize/2 : (i-1) * vis.config.legendHeight + vis.config.legendSquareSize)
          .text(d => d)
          .attr('text-anchor', 'left');
  }

  // Renders the title (not in index.html because title changes dynamically)
  renderTitle() {
    let vis = this;

    vis.title.selectAll('text')
        .data(vis.province)
        .join('text')
          .attr('class', 'stackedBarChart title')
          .attr('text-anchor', 'middle')
          .text(d => `Sources of emissions over the years in ${d}`);
  }

  step0() {
    let vis = this;

    // set opactity of all bars to 0.2
    vis.chart.selectAll('rect')
    .transition()
      .style('opacity', 0.2);
    
    // set opacity of the bar we're looking at to 1
    vis.chart.selectAll('.year1990')
      .transition()
      .style('opacity', 1);

  }

  step1() {
    let vis = this;

    // set opactity of all bars to 0.2
    vis.chart.selectAll('rect')
     .transition()
     .style('opacity', 0.2);
   
    // set opacity of the bar we're looking at to 1
    vis.chart.selectAll('.year1991')
      .transition()
      .style('opacity', 1);   
  }

  step2() {
    let vis = this;

    // set opactity of all bars to 0.2
    vis.chart.selectAll('rect')
      .transition()
      .style('opacity', 0.2);
   
    // set opacity of the bar we're looking at to 1
    vis.chart.selectAll('.year1992')
      .transition()
      .style('opacity', 1); 
  }

  step3() {
    let vis = this;

    console.log("1993");
  }

  step4() {
    let vis = this;

    console.log("1994");
  }

  step5() {
    let vis = this;

    console.log("1995");
  }

  step6() {
    let vis = this;

    console.log("1996");
  }

  step7() {
    let vis = this;

    console.log("1997");
  }

  step8() {
    let vis = this;

    console.log("1998");
  }

  step9() {
    let vis = this;

    console.log("1999");
  }

  step10() {
    let vis = this;

    console.log("2000");
  }

  step11() {
    let vis = this;

    console.log("2001");
  }
  step12() {
    let vis = this;

    console.log("2002");
  }

  step13() {
    let vis = this;

    console.log("2003");
  }

  step14() {
    let vis = this;

    console.log("2004");
  }

  step15() {
    let vis = this;

    console.log("2005");
  }

  step16() {
    let vis = this;

    console.log("2006");
  }

  step17() {
    let vis = this;

    console.log("2007");
  }

  step18() {
    let vis = this;

    console.log("2008");
  }

  step19() {
    let vis = this;

    console.log("2009");
  }

  step20() {
    let vis = this;

    console.log("2010");
  }

  goToStep(stepIndex) {
    this[this.config.steps[stepIndex]]();
  }
}