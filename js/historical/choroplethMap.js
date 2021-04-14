class Choropleth{
    // Basic constructor
    constructor(_config, _data, _geoData, _choroplethProvinceDispatcher) {
        // Define settings for object (e.g. where it belongs, margins, width, height, etc).
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth, //|| 400,
            containerHeight: _config.containerHeight, //|| 300,
            margin: _config.margin || {top: 50, right: 0, bottom: 50, left: 0},
            projection: _config.projection || d3.geoConicConformal().parallels([49, 77]).rotate([110, 0]),
            tooltipPadding: 15,
            legendLeft: 25,
            legendBottom: 25,
            legendRectHeight: 15,
            legendRectWidth: 100,
        }
        // Update data
        this.data = _data;
        this.geoData = _geoData;
        // Selected province
        this.currSelectedProvince = null;
        // Set dispatcher
        this.choroplethProvinceDispatcher = _choroplethProvinceDispatcher;
        // Define default display data
        this.currYear = 2018;
        this.currMetric = 'CO2eq';
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Pad chart by margins
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Create space for chart
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        // Create legend group
        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
        // Create space for legend
        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight)
            .style('stroke', 'black')
            .style('stroke-width',1);
        // Create legend gradient
        vis.linearGradient = vis.svg.append('defs').append('linearGradient')
            .attr("id", "legend-gradient");
        // Add title group
        vis.title = vis.svg.append('g')
            .attr('id', 'choropleth-title')
            .attr('transform', `translate(${vis.width/2}, 25)`)
            .append('text')
            .attr('class', 'stackedBarChart chartTitle')
            .attr('text-anchor', 'middle');
        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'choropleth-legend-title')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('y', -20)
            .attr('x', vis.config.legendRectWidth/2);

        // Add geographical projection
        vis.geoPath = d3.geoPath().projection(vis.config.projection);
        // Create colour scales
        vis.colorScale = null;
        vis.colorScaleCO2eq = d3.scaleSequential()
            .interpolator(d3.interpolateGreens)
            .domain(d3.extent(vis.data, d => d.CO2eq));
        vis.colorScaleCO2PerCapita = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain(d3.extent(vis.data, d => d.CO2eq_tn_per_person));
        vis.colorScaleCO2eqPerMilGDP = d3.scaleSequential()
            .interpolator(d3.interpolatePurples)
            .domain(d3.extent(vis.data, d => d.CO2eq_tn_per_mil_GDP));
        // Update view
        vis.updateVis();
    }

    updateVis(){
        let vis = this;
        // Find range of metric
        let metricExtent = vis.data.map(d => d[vis.currMetric]);
        // Create colour scale
        // Set color scales on update
        if (vis.currMetric == 'CO2eq') {
            // Carbon emissions
            vis.colorScale = vis.colorScaleCO2eq;
        } else if (vis.currMetric == 'CO2eq_tn_per_person') {
            // Intensity per capita
            vis.colorScale = vis.colorScaleCO2PerCapita
        } else {
            // Intensity by GDP
            vis.colorScale = vis.colorScaleCO2eqPerMilGDP;
        }
        // Create subset of data to be plotted
        let histSubset = vis.data.filter(d => d.Year == vis.currYear);
        // Bind Data Based on Year and Selected Units
        vis.geoData.objects.provinces.geometries.forEach(d => {
            for (let i = 0; i < histSubset.length; i++) {
                if (d.properties.PRENAME == histSubset[i].Region) {
                    d.properties.UUID = histSubset[i].uuid;
                    d.properties.Year = histSubset[i].Year;
                    d.properties.metric = histSubset[i][vis.currMetric];
                    d.properties.GDP = histSubset[i].GDP;
                    d.properties.Population = histSubset[i].Population;
                }
            }
        });
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

    // Render visualization
    renderVis() {
        let vis = this;
        // Convert data to topoJson
        const provinces = topojson.feature(vis.geoData, vis.geoData.objects.provinces);
        // Defines the projection scale so that the geometry fits within the SVG
        vis.config.projection.fitSize([vis.width, vis.height], provinces);
        // Append shapes of Canadian provinces
        const geoPath = vis.chart.selectAll('.geo-paths')
            .data(provinces.features)
            .join('path')
            .attr('class', 'geo-paths')
            .attr('d', vis.geoPath)
            .attr('fill', d=> {
                if(d.properties.metric) {
                    return vis.colorScale(d.properties.metric)
                } else {
                    return '#fff'
                }}
            )
            .style("stroke", "black")
            .style("stroke-width", d=> {
                if (d.properties.PRENAME == vis.currSelectedProvince){
                    return 5;
                } else {
                    return 0;
                }
            })
            .on('mouseover', (event, d) => {
                const value = (d.properties.metric === null) ? 'No data available' : d.properties.metric;
                let units = metricUnits[vis.currMetric]
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                  <div class='tooltip-label'>
                    Jurisdiction: ${d.properties.PRENAME}<br>
                    Year: ${d.properties.Year}
                  </div>
                  <div class="tooltip-label-normal">${value.toFixed(0)} ${units}</div>
                `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            })
            .on('click', (event, d) => {
                vis.currSelectedProvince = d.properties.PRENAME;
                vis.choroplethProvinceDispatcher.call('selectChoroplethProvince', event, vis.currSelectedProvince);
            });

        // Add an additional layer on top of the map to show the province borders more clearly based on tutorial suggestions
        const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
            .data([topojson.mesh(vis.geoData, vis.geoData.objects.provinces)])
            .join('path')
            .attr('class', 'geo-boundary-path')
            .attr('d', vis.geoPath)
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Add title
        vis.title
            .text(metricNames[vis.currMetric] + ", " + vis.currYear);
        // Add legend
        vis.legendTitle
            .text(metricUnits[vis.currMetric]);
        // Add legend labels
        vis.legend.selectAll('.choropleth-legend-label')
            .data(vis.legendStops)
            .join('text')
            .attr('class', 'choropleth-legend-label')
            .attr('text-anchor', 'middle')
            .attr('text-align', 'center')
            .attr('dy', '.35em')
            .attr('y', 20)
            .attr('x', (d,index) => {
                return index*(vis.config.legendRectWidth/(vis.legendStops.length-1));
            })
            .text(d => d.value);

        // Update gradient for legend
        vis.linearGradient.selectAll('stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);
        // Attach gradient to legend rectangle
        vis.legendRect.attr('fill', 'url(#legend-gradient)');
    }

    // Render new year's worth of data as a result of a trigger
    goToStep(stepIndex) {
        let vis = this;
        let baseYear = 1990;
        // Update year
        if(stepIndex == 0) {
            vis.currYear = 2018
        } else {
            vis.currYear = baseYear + stepIndex;
        }
        // Update vis
        vis.updateVis();
    }
}