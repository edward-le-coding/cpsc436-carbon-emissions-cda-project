class Timeline {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _policyData, _canadaHistoricalData) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: _config.containerWidth || 800,
          containerHeight: _config.containerHeight || 500,
          margin: {top: 250, right: 10, bottom: 50, left: 150},
          mitigation_estimate_year: _config.mitigation_estimate_year || 2030,
          tooltipPadding: _config.tooltipPadding || 15,
          legendWidth: 300,
          legendHeight: 10,
          legendSquareSize: 15,
        }
        this.policyData = _policyData.filter(d => d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq<0)

        this.canadaHistoricalData = _canadaHistoricalData
        this.sectors = [...new Set(this.policyData.map(d => d.Sector_Affected))];

        this.selectedSectors = this.sectors

        this.includeHistorical = false
        this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static chart elements
     */
    initVis() {
        let vis = this;

        // Specify accessor functions
        vis.xValue = d => d.Start_year_of_Implementation;
        vis.yValue = d => d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq;
    
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);
      
        // Add group for legend
        vis.legend = vis.svg.append('g')
            .attr('transform', `translate(100, 40)`);
      
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g')

        // set range to be 1990-2025, but need to create an array to work with scaleband
        let xScaleDomain = []
        for(let i = 1990; i<=2025; i++){
          xScaleDomain.push(i)
        } 
        // Intialize the scales
        vis.xScale = d3.scaleBand()
            .domain(xScaleDomain) 
            .range([0, vis.config.width])
            .paddingInner(0.05)
            .paddingOuter(0.05);
        
        vis.yScale = d3.scaleLinear()
            .range([vis.config.height,0])
            .nice();
    
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.sectors)
            .range(d3.schemeCategory10);
    
        // Initialize axes
        vis.xAxis = d3.axisTop(vis.xScale) // FIXME: maybe this shouldnt be axis top? this example has no xaxis http://bl.ocks.org/maaquib/6e989956b99b819d69e9
          .tickValues([1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025])
          .tickSizeOuter(0)
          .tickSize(0)

        vis.yAxis = d3.axisLeft(vis.yScale);
    
        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis')
        
        // Append y-axis group
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis') 

        vis.updateVis();
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;
  
        let maxYValue = vis.includeHistorical ? d3.max(vis.canadaHistoricalData, d=>d.CO2eq) : d3.max(vis.policyData, d=>d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq)
        let rollupTemp = d3.rollups(vis.policyData, v=>d3.sum(v, d => d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq), d=>d.Start_year_of_Implementation)
        let minYValue = d3.min(rollupTemp, d=>d[1])
        vis.yScale.domain([minYValue, maxYValue])

        vis.xAxisG.attr('transform', `translate(0,${vis.yScale(0)})`)

        // Filtering to only show selectedsectors
        vis.filteredData = vis.policyData.filter(d=>vis.selectedSectors.includes(d.Sector_Affected))

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
          previousy0 = d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq
          yearsSeen.add(d.Start_year_of_Implementation)
          returnValue = {...d, y0: 0, y1: previousy0}
        } else {
          let newy1 = d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq+previousy0
          returnValue = {...d, y0: previousy0, y1: newy1}
          previousy0 = newy1
        }
        return returnValue
      })

      const bars = vis.chart.selectAll('.bar')
          .data(stackedData)
        .join('rect')
            .attr('class', d => {
              return `bar policy ${d.Start_year_of_Implementation} '${d.Name_of_Mitigation_Action}'`
            })
            .attr('x', d => {
              return vis.xScale(vis.xValue(d))
            })
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => {
              return vis.yScale(d.y1) - vis.yScale(d.y0)
            })
            .attr('y', d => {
              return vis.yScale(d.y0)
            })
            .style('fill', d => vis.colorScale(d.Sector_Affected))
    
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

      const historicalBars = vis.chart.selectAll('.historical-bar')
        .data(vis.canadaHistoricalData)
        .join('rect')
          .attr('class', d=>`historical-bar ${d.Year}`)
          .attr('x', d => vis.xScale(d.Year))
          .attr('width', vis.xScale.bandwidth())
          .attr('height', d=>vis.yScale(0)-vis.yScale(d.CO2eq))
          .attr('y', d=>vis.yScale(d.CO2eq))
          .style('fill', 'grey')

      if (!vis.includeHistorical) {
        d3.selectAll('.historical-bar').remove()
      }

      // Tooltip event listeners
      historicalBars
        .on('mouseover', (event,d) => {
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(getTooltipHtmlHistorical(d));
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
    let format = d3.format(",");
    let C02estimate = 0-d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq
    C02estimate = format(C02estimate)
    return `
      <div class="tooltip-title">${d.Name_of_Mitigation_Action}</div>
      <div>${d.Sector_Affected}, <i>${d.Implementation_Entity}</i>, ${d.Start_year_of_Implementation}</div>
      <div>${C02estimate} Kt CO<sub>2</sub>eq<div>
      <br>
      <div class="description-text"><b>Description:</b> ${d.Brief_Description}</div>`
  }

  // Html tooltip helper functions
function getTooltipHtmlHistorical(d) {
    let format = d3.format(",");
    C02estimate = format(d.CO2eq)
    return `
      <div><b>${d.Year}:</b> ${C02estimate} Kt CO<sub>2</sub>eq<div>`

  }