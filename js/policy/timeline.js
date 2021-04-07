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
          tooltipPadding: _config.tooltipPadding || 15,
          legendWidth: 200,
          legendHeight: 10,
          legendSquareSize: 15,
        }
        this.data = _data

        this.filteredData = this.data.filter(d => d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq>0)

        this.sectors = [...new Set(this.filteredData.map(d => d.Sector_Affected))];

        this.selectedSectors = this.sectors

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
      
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Add group for legend
        vis.legend = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, 100)`);
      
        // Intialize the scales
        vis.xScale = d3.scaleBand()
            .range([0, vis.config.width])
            .paddingInner(0.05)
            .paddingOuter(0.05);

        vis.yScale = d3.scaleLinear()
            .range([0, vis.config.height]);
    
        vis.colorScale = d3.scaleOrdinal()
            .range(d3.schemeCategory10);
    
        // Initialize axes
        vis.xAxis = d3.axisTop(vis.xScale)
          .ticks(41)
          .tickSizeOuter(0)
          .tickSize(0)

        vis.yAxis = d3.axisLeft(vis.yScale);
    
        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            // .attr('transform', `translate(0,${vis.config.height})`);
        
        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis') 
        
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
    
        
        // TODO: why cant vis.xScale.domain be set to extent? 
        // console.log('d3 extent', d3.extent(vis.filteredData, vis.xValue))
        // vis.xScale.domain(d3.extent(vis.filteredData, vis.xValue)) 
        
        vis.xScale.domain(vis.filteredData.map(vis.xValue)) 
        
        let maxYValue = d3.max(vis.filteredData, d=>d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq)
        // set the dynamic domains
        vis.yScale.domain([0, maxYValue]);
        vis.colorScale.domain(vis.sectors);
    

        // TODO: try filtering data sector affected to match key



        // Render the bar chart, the legend and the title
        vis.renderVis();
        vis.renderLegend();
    }
  
  
    /**
     * This function contains the D3 code for binding data to visual elements
     */
    renderVis() {
      let vis = this;
  
      let previousy0 = 0
      let yearsSeen = new Set()
      let stackedData = vis.filteredData.map(d => {
        let returnValue = d
        if (!yearsSeen.has(d.Start_year_of_Implementation)){
          previousy0 = d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq
          yearsSeen.add(d.Start_year_of_Implementation)
          returnValue = {...d, y0: 0, y1: previousy0}
        } else {
          let newy1 = d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq+previousy0
          returnValue = {...d, y0: previousy0, y1: newy1}
          previousy0 = newy1
        }
        return returnValue
      })

      const bars = vis.chart.selectAll('.bar')
          .data(stackedData)
        .join('rect')
            .attr('class', d => `bar '${d.key}'`)
            .attr('x', d => {
              // console.log('d', d)
              return vis.xScale(vis.xValue(d))
            }
            )
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => {
              return vis.yScale(d.y1) - vis.yScale(d.y0)
            })
            .attr('y', d => {
              return vis.yScale(d.y0)
            })
            .style('fill', d => vis.colorScale(d.Sector_Affected))
            .style('opacity', d => {
              if (vis.selectedSectors.includes(d.Sector_Affected)) {
                return 1
              } else {
                return 0.5
              }
            })
    
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
  
    // Renders the legend
    renderLegend() {
      let vis = this;

      let sortedColorScaleDomain = vis.colorScale.domain().sort()
      vis.legend.selectAll('rect')
          .data(sortedColorScaleDomain)
          .join('rect')
            .attr('x', (d, i) => (i % 2) * (vis.config.legendWidth))
            .attr('y', (d, i) => i % 2 === 0? i * vis.config.legendHeight : (i-1) * vis.config.legendHeight)
            .attr('width', vis.config.legendSquareSize)
            .attr('height', vis.config.legendSquareSize)
            .style('fill', d => vis.colorScale(d))
            .on('click', d => {
              let sectorSelected = d.srcElement.__data__
              if (vis.selectedSectors==vis.sectors) {
                vis.selectedSectors = [sectorSelected]
              } else if (vis.selectedSectors.includes(sectorSelected)) {
                // remove sector
                const index = vis.selectedSectors.indexOf(sectorSelected);
                if (index > -1) {
                  vis.selectedSectors.splice(index, 1);
                }
                if (vis.selectedSectors.length==0) {
                  vis.selectedSectors = this.sectors
                }
              } else {
                vis.selectedSectors.push(sectorSelected)
              }
              vis.updateVis()
            })
            .style('opacity', d => {
              if (vis.selectedSectors.includes(d)) {
                return 1
              } else {
                return 0.2
              }
            })


      vis.legend.selectAll('text')
          .data(sortedColorScaleDomain)
          .join('text')
            .attr('class', 'legendText')
            .attr('x', (d, i) => (i % 2) * (vis.config.legendWidth) + vis.config.legendSquareSize + 5)
            .attr('y', (d, i) =>  i % 2 === 0 ? i * vis.config.legendHeight + vis.config.legendSquareSize : (i-1) * vis.config.legendHeight + vis.config.legendSquareSize)
            .text(d => d)
            .attr('text-anchor', 'left');
    }
  
  }

    

  // Html tooltip helper functions
function getTooltipHtml(d) {
    return `
      <div class="tooltip-title">${d.Name_of_Mitigation_Action}</div>
      <div><i>${d.Sector_Affected}, ${d.Start_year_of_Implementation}</i></div>
      <div>${d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq}<div>`

  }