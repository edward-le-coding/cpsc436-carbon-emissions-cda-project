class Choropleth{
    // Basic constructor
    constructor(_config, _data) {
        // Define settings for object (e.g. where it belongs, margins, width, height, etc).
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 400,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            projection: _config.projection || d3.geoConicConformal().parallels([49, 77]).rotate([110, 0])
        }
        // Update data
        this.data = _data;
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

        // Add geographical projection
        vis.geoPath = d3.geoPath().projection(vis.config.projection);

        // Update view
        vis.updateVis();
    }

    updateVis(){
        let vis = this;
        
        vis.renderVis()
    }

    // Render visualization
    renderVis() {
        let vis = this;
        // Convert data to topoJson
        const provinces = topojson.feature(vis.data, vis.data.objects.provinces);
        // Defines the projection scale so that the geometry fits within the SVG
        vis.config.projection.fitSize([vis.width, vis.height], provinces);

        // Append shapes of Canadian provinces
        const geoPath = vis.chart.selectAll('.geo-path')
            .data(provinces.features)
           .join('path')
            .attr('class', 'geo-path')
            .attr('d', vis.geoPath);

        // Add an additional layer on top of the map to show the province borders more clearly based on tutorial suggestions
        
        const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
            .data([topojson.mesh(vis.data, vis.data.objects.provinces)])
            .join('path')
            .attr('class', 'geo-boundary-path')
            .attr('d', vis.geoPath);
    }

    // Render new year's worth of data as a result of a trigger
    goToStep(stepIndex) {
        let vis = this;
    }
}