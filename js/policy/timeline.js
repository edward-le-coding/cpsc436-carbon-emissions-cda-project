class Timeline {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: 800,
          containerHeight: 500,
          margin: {top: 250, right: 10, bottom: 50, left: 100},
          mitigation_estimate_year: _config.mitigation_estimate_year || 2020,
          tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data

        this.filteredData = this.data.filter(d => d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq>0)

        this.sectors = [...new Set(this.filteredData.map(d => d.Sector_Affected))];

        this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static chart elements
     */
    initVis() {
        let vis = this;
    
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);
      
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g');

      
        // Intialize the scales
        vis.xScale = d3.scaleBand()
            .domain(vis.data.map(d => d.Start_year_of_Implementation)) // todo consider setting this later. also is this ok? should i be a range [min, max]?
            .range([0, vis.config.width])
            .paddingInner(0.2)
            .paddingOuter(0.2);
    
        vis.yScale = d3.scaleLinear()
            .range([vis.config.height, 0]);
    
        vis.colorScale = d3.scaleOrdinal()
            .range(d3.schemeCategory10);
    
        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale);
    
        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.config.height})`);
        
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
        vis.xValue = d => d.Start_year_of_Implementation;
        vis.yValue = d => d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq;
    
    
        // because the data is stacked we know highest val is in last element of stacked data
        let maxYValue = d3.max(vis.filteredData, d=>d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq)
        console.log('maxYValue', maxYValue)
    
        // set the dynamic domains
        vis.yScale.domain([0, maxYValue]);
        vis.colorScale.domain(vis.sectors);
    
        // Render the bar chart, the legend and the title
        vis.renderVis();
  
    }
  
  
    /**
     * This function contains the D3 code for binding data to visual elements
     */
    renderVis() {
      let vis = this;
  
      const bars = vis.chart.selectAll('.bar')
          .data(vis.filteredData, vis.xValue)
        .join('rect')
            .attr('class', d => `bar ${d.Sector_Affected}`)
            .attr('x', d => vis.xScale(vis.xValue(d)))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.yScale(vis.yValue(d)))
            .attr('y', d => vis.yScale(vis.yValue(d)))
            .attr('fill', '#b19cd9')
            // .style('fill', d => vis.colorScale(d.key))
    
            // Tooltip event listeners
    bars
    .on('mouseover', (event,d) => {
      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        .html(getTooltipHtml(d));
      
    })
    .on('mouseleave', () => {
      d3.select('#tooltip').style('display', 'none');
    });
        
      // Update the axes
      vis.xAxisG.call(vis.xAxis);
      vis.yAxisG.call(vis.yAxis);
    }
  
  
  }

  // Html tooltip helper functions
function getTooltipHtml(d) {
    return `
      <div class="tooltip-title">${d.Name_of_Mitigation_Action}</div>
      <div><i>${d.Sector_Affected}, ${d.Start_year_of_Implementation}</i></div>
      <div>${d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq}<div>`

  }