class Heatmap{
    constructor(_config, _data, _provinceDispatcher, _yearDispatcher, _metric) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth:  _config.containerWidth, //|| 1200,
            containerHeight: _config.containerHeight, //|| 300,
            tooltipPadding: 15,
            margin: _config.margin || {top: 60, right: 50, bottom: 20, left: 200},
            sortOption: _config.sortOption || 'alphabetically',
            legendWidth: 160,
            legendBarHeight: 10
        }
        // Init starting data
        this.data = _data;
        this.metric = _metric || 'CO2eq'
        this.provinceDispatcher = _provinceDispatcher;
        this.yearDispatcher = _yearDispatcher;

        // Define selected province
        this.currSelectedProvince = null;
        this.currSelectedYear = null;
        // Init vis
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g');

        // Initialize scales
        vis.xScale = d3.scaleLinear()
            .range([0, vis.config.width]);

        vis.yScale = d3.scaleBand()
            .range([0, vis.config.height])
            .paddingInner(0.2);

        // Initialize x-axis
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(0)
            .tickFormat(d3.format('d')) // Remove comma delimiter for thousands
            .tickPadding(10);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.config.height})`);

        // Legend
        vis.legend = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.containerWidth - vis.config.legendWidth - vis.config.margin.right},
             ${vis.config.margin.top/2})`);

        vis.legendColorGradient = vis.legend.append('defs').append('linearGradient')
            .attr('id', 'linear-gradient');

        vis.legendColorRamp = vis.legend.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendBarHeight)
            .attr('fill', 'url(#linear-gradient)');

        vis.xLegendScale = d3.scaleLinear()
            .range([0, vis.config.legendWidth]);

        vis.xLegendAxis = d3.axisBottom(vis.xLegendScale)
            .tickSize(vis.config.legendBarHeight + 3)
            .tickFormat(d3.format('d'));

        vis.xLegendAxisG = vis.legend.append('g')
            .attr('class', 'axis x-axis legend-axis');

        vis.updateVis();

    }

    updateVis() {
        const vis = this;

        // Group data per region (we get a nested array)
        vis.groupedData = d3.groups(vis.data, d => d.Region);

        // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
        vis.groups = d3.map(vis.data, function(d){return d.Region;}).keys()
        vis.vars = d3.map(vis.data, function(d){return d[vis.metric];}).keys()

        // Sort regions by alphabetical or value order
        if (vis.config.sortOption == 'alphabetically') {
            vis.groupedData.sort((a,b) => {
                return a[0].localeCompare(b[0]);
            })
        } else if (vis.config.sortOption == 'value') {
            vis.groupedData.forEach((d) => {
                d[3] = d3.sum(d[1], (k) => k[vis.metric]);
            });

            // Descending order
            vis.groupedData.sort((a, b) => b[3] - a[3]);
        }

        // Specify accessor functions
        vis.yValue = d => {
            return d[0]
        }
        // d[0];
        vis.colorValue = d => d[vis.metric];
        vis.xValue = d => d.Year;

        // Set color scales on update
        if (vis.metric == 'CO2eq') {
            // Carbon emissions
            vis.colorScale = d3.scaleSequential()
                .interpolator(d3.interpolateGreens);
        } else if (vis.metric == 'CO2eq_tn_per_person') {
            // Intensity per capita
            vis.colorScale = d3.scaleSequential()
                .interpolator(d3.interpolateBlues);
        } else {
            // Intensity by GDP
            vis.colorScale = d3.scaleSequential()
                .interpolator(d3.interpolatePurples);
        }

        // Set the scale input domains
        vis.colorScale.domain(d3.extent(vis.data, vis.colorValue));
        vis.xScale.domain(d3.extent(vis.data, vis.xValue));
        vis.yScale.domain(vis.groupedData.map(vis.yValue));

        let metricExtent = vis.data.map(d => d[vis.metric]);
        // Create legend stops
        vis.legendStops = [
            { color: vis.colorScale(d3.min(metricExtent)), value: d3.min(metricExtent).toFixed(1), offset: '0%'},
            { color: vis.colorScale(d3.quantile(metricExtent, 0.25)), value: d3.quantile(metricExtent, 0.25).toFixed(1), offset: '25%'},
            { color: vis.colorScale(d3.quantile(metricExtent, 0.50)), value: d3.quantile(metricExtent, 0.50).toFixed(1), offset: '50%'},
            { color: vis.colorScale(d3.quantile(metricExtent, 0.75)), value: d3.quantile(metricExtent, 0.55).toFixed(1), offset: '75%'},
            { color: vis.colorScale(d3.max(metricExtent)), value: d3.max(metricExtent).toFixed(1), offset: '100%'},
        ];
        vis.renderVis();
    }

    renderVis() {
        const vis = this;

        const cellWidth = (vis.config.width / (vis.xScale.domain()[1] - vis.xScale.domain()[0])) - 2;
        // Reset cell colours
        vis.chart.selectAll('rect')
            .attr('fill', '#fff');

        // 1. Level: rows
        const row = vis.chart.selectAll('.h-row')
            .data(vis.groupedData, d=> d[0]);

        // Enter
        const rowEnter = row.enter().append('g')
            .attr('class', 'h-row');

        // Enter + update
        rowEnter.merge(row)
            .transition().duration(1000)
            .attr('transform', d => `translate(0,${vis.yScale(vis.yValue(d))})`);

        // Exit
        row.exit().remove();

        // Append row label (y-axis)
        rowEnter.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'end')
            .attr('dy', '0.5rem')
            .attr('x', -8)
            .text(vis.yValue);


        // 2. Level: columns

        // 2a) Actual cells
        const cell = row.merge(rowEnter).selectAll('.h-cell')
            .data(d => d[1]);

        // Enter
        const cellEnter = cell.enter().append('rect')
            .attr('class', 'h-cell')
            .attr('class', d => 'year' + vis.xValue(d));
        // Clear previous stroke settings
        vis.chart.selectAll('rect')
            .style('stroke', 'none')
            .style('stroke-width', 0);
        // Enter + update
        let finalCells = cellEnter.merge(cell)
            .attr('id', d => d.Region.replace(/\s/g, ''))
            .attr('height', vis.yScale.bandwidth())
            .attr('width', cellWidth)
            .attr('x', d => vis.xScale(vis.xValue(d)))
            .style('stroke', d => {
                if (d.Region === vis.currSelectedProvince ){
                    return 'gray';
                } else if(vis.currSelectedYear && d.Year == vis.currSelectedYear){
                    return 'black'
                } else {
                    return 'none';
                }
            })
            .style('stroke-width',d => {
                if (d.Region === vis.currSelectedProvince){
                    return 2;
                } else if (vis.currSelectedYear){
                    if (d.Year == vis.currSelectedYear){
                        return 2;
                    }
                } else {
                    return 'none';
                }
            })
            .attr('fill', d => {
                if (d.value === 0 || d.value === null) {
                    return '#fff';
                } else {
                    return vis.colorScale(vis.colorValue(d));
                }
            });

        finalCells
            .on('mouseover', (event, d) => {
                const value = (d[vis.metric] === null) ? 'No data available' : d[vis.metric];
                let units = metricUnits[vis.metric]
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                  <div class='tooltip-label'>
                    Jurisdiction: ${d.Region}<br>
                    Year: ${d.Year}
                  </div>
                  <div class="tooltip-label-normal">${value.toFixed(0)} ${units}</div>
                `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        finalCells
            .on('click', (event, d) => {
                const selectedProvince = d.Region;
                const selectedYear = d.Year;
                // Encase calls in if conditions to improve performance (only re-render if necessary)
                vis.provinceDispatcher.call('selectProvince', event, selectedProvince);
                vis.yearDispatcher.call('selectYear', event, selectedYear);
            });

        // 2b) Diagonal lines for NA values
        const cellNa = row.merge(rowEnter).selectAll('.h-cell-na')
            .data(d => d[1].filter(k => k.value === null));

        const cellNaEnter = cellNa.enter().append('line')
            .attr('class', 'h-cell-na');

        cellNaEnter.merge(cellNa)
            .attr('x1', d => vis.xScale(vis.xValue(d)))
            .attr('x2', d => vis.xScale(vis.xValue(d)) + cellWidth)
            .attr('y1', vis.yScale.bandwidth())
            .attr('y2', 0);

        // Update axis
        vis.xAxisG.call(vis.xAxis);

        // Update legend
        vis.renderLegend();
    }

    /**
     * Update colour legend
     */
    renderLegend() {
        const vis = this;

        // Add stops to the gradient
        vis.legendColorGradient.selectAll('stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        // Set x-scale and reuse colour-scale because they share the same domain
        // Round values using `nice()` to make them easier to read.
        vis.xLegendScale.domain(vis.colorScale.domain()).nice();
        const extent = vis.xLegendScale.domain();

        // Manually calculate tick values
        vis.xLegendAxis.tickValues([
            extent[0],
            parseInt(extent[1]/3),
            parseInt(extent[1]/3*2),
            extent[1]
        ]);
        // Update legend axis
        vis.xLegendAxisG.call(vis.xLegendAxis);
    }

    // Updates the viz based on the year the user scrolls to
    goToStep(stepIndex) {
        let vis = this;

        let currSelectedYear = 1990 + stepIndex;
        vis.currSelectedYear = currSelectedYear;
        let className = `.year${currSelectedYear}`;
        // those years that are not selected have no stroke
        vis.chart.selectAll('rect')
            .style('stroke', 'none')
            .style('stroke-width', 0);

        // those years that are selected have a stroke
        vis.chart.selectAll(className)
            .style('stroke', '#464141')
            .style('stroke-width', 2);
        // Highlight currently selected province (if selected)
        if (vis.currSelectedProvince){
            let provinceCode = vis.currSelectedProvince.replace(/\s/g, '');
            vis.chart.selectAll('#'+provinceCode)
                .style('stroke', '#464141')
                .style('stroke-width', 2);
        }
    }
}